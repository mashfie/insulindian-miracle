use crate::core::{base_geography, evolve_sites, institutional_readiness, site_distance};
use crate::policies::{
    DiscountedUCBPolicy, EpsilonGreedyPolicy, GaussianThompsonPolicy, LinUCBPolicy,
    LinearThompsonPolicy, MyopicOraclePolicy, Policy, SlidingWindowUCBPolicy, UCB1Policy,
};
use crate::terrain::{generate_terrain_rust, select_candidate_sites_rust, terrain_shares};
use crate::types::{InstitutionState, SimulationConfig, Site, SiteState, SiteStateSnapshot};
use crate::whittle::WhittleIndexPolicy;

use ndarray::{Array1, Array2};

use rand::distributions::Distribution;
use rand::SeedableRng;
use rand_distr::Beta;
use rand_pcg::Pcg64;
use rayon::prelude::*;
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;

use arrow::array::{Float64Builder, Int64Builder, StringBuilder};
use arrow::datatypes::{DataType, Field, Schema};
use arrow::record_batch::RecordBatch;
use parquet::arrow::ArrowWriter;
use parquet::file::properties::WriterProperties;

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct SweepInputLine {
    scenario: String,
    config: SimulationConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SiteOutcome {
    pub site_id: i32,
    pub x: f64,
    pub y: f64,
    pub boomtown: bool,
    pub trade_cluster: bool,
    pub population: f64,
    pub extraction: f64,
    pub openness: f64,
    pub adaptability: f64,
    pub initial_resource_rent: f64,
    pub resource_rent: f64,
    pub productive_capital: f64,
    pub shock_hits: f64,
    pub reforms_triggered: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RunResult {
    pub run_id: i64,
    pub seed: i64,
    pub policy: String,
    pub scenario: String,
    pub cumulative_reward: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub oracle_reward: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub oracle_regret: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub empirical_best_reward: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub empirical_regret: Option<f64>,
    pub mean_final_extraction: f64,
    pub mean_final_openness: f64,
    pub mean_final_adaptability: f64,
    pub mean_final_resource_rent: f64,
    pub mean_productive_capital: f64,
    pub mean_reforms_triggered: f64,
    pub mean_shock_hits: f64,
    pub population_hhi: f64,
    pub population_gini: f64,
    pub zipf_slope: f64,
    pub resource_extraction_correlation: f64,
    pub resource_population_correlation: f64,
    pub boomtown_population_share: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub boomtown_selection_share: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub boomtown_pre_collapse_selection_share: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub boomtown_collapse_selection_share: Option<f64>,
    pub land_share: f64,
    pub river_share: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_sites: Option<Vec<usize>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reward_history: Option<Vec<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub site_outcomes: Option<Vec<SiteOutcome>>,
}

impl RunResult {
    pub fn set_oracle_baseline(&mut self, oracle_reward: f64) {
        self.oracle_reward = Some(oracle_reward);
        self.oracle_regret = Some(oracle_reward - self.cumulative_reward);
    }

    pub fn set_empirical_best_baseline(&mut self, best_observed_reward: f64) {
        self.empirical_best_reward = Some(best_observed_reward);
        self.empirical_regret = Some(best_observed_reward - self.cumulative_reward);
    }

    pub fn metric_value(&self, metric: &str) -> Option<f64> {
        match metric {
            "cumulative_reward" => Some(self.cumulative_reward),
            "oracle_reward" => self.oracle_reward,
            "oracle_regret" => self.oracle_regret,
            "empirical_best_reward" => self.empirical_best_reward,
            "empirical_regret" => self.empirical_regret,
            "mean_final_extraction" => Some(self.mean_final_extraction),
            "mean_final_openness" => Some(self.mean_final_openness),
            "mean_final_adaptability" => Some(self.mean_final_adaptability),
            "mean_final_resource_rent" => Some(self.mean_final_resource_rent),
            "mean_productive_capital" => Some(self.mean_productive_capital),
            "mean_reforms_triggered" => Some(self.mean_reforms_triggered),
            "mean_shock_hits" => Some(self.mean_shock_hits),
            "population_hhi" => Some(self.population_hhi),
            "population_gini" => Some(self.population_gini),
            "zipf_slope" => Some(self.zipf_slope),
            "resource_extraction_correlation" => Some(self.resource_extraction_correlation),
            "resource_population_correlation" => Some(self.resource_population_correlation),
            "boomtown_population_share" => Some(self.boomtown_population_share),
            "boomtown_selection_share" => self.boomtown_selection_share,
            "boomtown_pre_collapse_selection_share" => self.boomtown_pre_collapse_selection_share,
            "boomtown_collapse_selection_share" => self.boomtown_collapse_selection_share,
            "land_share" => Some(self.land_share),
            "river_share" => Some(self.river_share),
            _ => None,
        }
    }
}

pub fn is_oracle_policy_name(policy: &str) -> bool {
    matches!(policy.to_lowercase().as_str(), "myopic-oracle" | "oracle")
}

pub(crate) fn parse_sweep_input_line(
    line: &str,
) -> Result<(SimulationConfig, String), serde_json::Error> {
    match serde_json::from_str::<SweepInputLine>(line) {
        Ok(item) => Ok((item.config, item.scenario)),
        Err(labeled_err) => match serde_json::from_str::<SimulationConfig>(line) {
            Ok(config) => Ok((config, "sweep".to_string())),
            Err(_) => Err(labeled_err),
        },
    }
}

pub fn set_result_baselines(results: &mut [RunResult]) {
    let best_observed_reward = results
        .iter()
        .map(|result| result.cumulative_reward)
        .fold(f64::NEG_INFINITY, f64::max);
    let oracle_reward = results
        .iter()
        .find(|result| is_oracle_policy_name(&result.policy))
        .map(|result| result.cumulative_reward)
        .unwrap_or(best_observed_reward);

    for result in results {
        result.set_oracle_baseline(oracle_reward);
        result.set_empirical_best_baseline(best_observed_reward);
    }
}

fn set_result_baselines_with_oracle(results: &mut [RunResult], oracle_reward: f64) {
    let best_observed_reward = results
        .iter()
        .map(|result| result.cumulative_reward)
        .fold(f64::NEG_INFINITY, f64::max);
    for result in results {
        result.set_oracle_baseline(oracle_reward);
        result.set_empirical_best_baseline(best_observed_reward);
    }
}

fn boomtown_selection_share_for_window(
    selected_sites: &[usize],
    states: &[SiteState],
    start: usize,
    end: usize,
) -> Option<f64> {
    let start = start.min(selected_sites.len());
    let end = end.min(selected_sites.len());
    if end <= start {
        return None;
    }
    let window = &selected_sites[start..end];
    let boomtown_choices = window
        .iter()
        .filter(|&&idx| states.get(idx).is_some_and(|s| s.site.boomtown))
        .count();
    Some(boomtown_choices as f64 / window.len() as f64)
}

fn apply_boomtown_shape_rust(sites: &mut [Site], config: &SimulationConfig) {
    if config.boomtown_count <= 0 || sites.is_empty() {
        return;
    }

    let geography_scores: Vec<f64> = sites.iter().map(|s| base_geography(s, config)).collect();

    let mut sorted_scores = geography_scores.clone();
    sorted_scores.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let median_idx = sorted_scores.len() / 2;
    // For exact median behavior as python np.median, we should average if even, but picking mid is usually close enough for cutoff. Let's do exact median.
    let geography_cutoff = if sorted_scores.len().is_multiple_of(2) {
        (sorted_scores[median_idx - 1] + sorted_scores[median_idx]) / 2.0
    } else {
        sorted_scores[median_idx]
    };

    let mut ranked: Vec<usize> = (0..sites.len()).collect();
    ranked.sort_by(|&a, &b| {
        let score_a_1 = sites[a].resource_rent - geography_scores[a];
        let score_b_1 = sites[b].resource_rent - geography_scores[b];

        let mut cmp = score_b_1.partial_cmp(&score_a_1).unwrap();
        if cmp == std::cmp::Ordering::Equal {
            cmp = sites[b]
                .resource_rent
                .partial_cmp(&sites[a].resource_rent)
                .unwrap();
            if cmp == std::cmp::Ordering::Equal {
                cmp = (-geography_scores[b])
                    .partial_cmp(&(-geography_scores[a]))
                    .unwrap();
            }
        }
        cmp
    });

    let mut chosen = std::collections::HashSet::new();
    let target_count = config.boomtown_count as usize;

    for &idx in &ranked {
        if geography_scores[idx] <= geography_cutoff {
            chosen.insert(idx);
        }
        if chosen.len() >= target_count {
            break;
        }
    }

    if chosen.len() < target_count {
        for &idx in &ranked {
            chosen.insert(idx);
            if chosen.len() >= target_count {
                break;
            }
        }
    }

    for idx in chosen {
        let site = &mut sites[idx];
        let geography_factor = (1.0 - config.boomtown_geography_penalty).max(0.05);
        site.port_access *= geography_factor;
        site.river_access *= geography_factor;
        site.arability *= geography_factor;
        site.defensibility *= geography_factor;
        site.accessibility *= geography_factor;
        site.resource_rent = (site.resource_rent + config.boomtown_resource_bonus).min(1.0);
        site.suitability = (site.suitability + 0.35 * config.boomtown_resource_bonus).min(1.0);
        site.boomtown = true;
        site.boomtown_reward_bonus = config.boomtown_early_reward_bonus;
        site.boomtown_bonus_duration = config.boomtown_bonus_duration;
        site.boomtown_collapse_penalty = config.boomtown_collapse_penalty;
        site.boomtown_collapse_threshold = config.boomtown_collapse_threshold;
        site.boomtown_decay_multiplier = config.boomtown_decay_multiplier;
        site.boomtown_initial_extraction_boost = config.boomtown_initial_extraction_boost;
    }
}

fn apply_trade_cluster_shape_rust(sites: &mut [Site], config: &SimulationConfig) {
    if config.trade_cluster_count <= 0 || sites.is_empty() {
        return;
    }

    let anchor = (0..sites.len())
        .max_by(|&a, &b| {
            let score_a = 0.5 * sites[a].accessibility
                + 0.35 * sites[a].port_access
                + 0.15 * sites[a].river_access
                - 0.25 * sites[a].resource_rent;
            let score_b = 0.5 * sites[b].accessibility
                + 0.35 * sites[b].port_access
                + 0.15 * sites[b].river_access
                - 0.25 * sites[b].resource_rent;
            score_a.partial_cmp(&score_b).unwrap()
        })
        .unwrap();

    let mut ranked_with_dist: Vec<(f64, usize)> = (0..sites.len())
        .map(|i| {
            let dist = ((sites[i].x - sites[anchor].x).powi(2)
                + (sites[i].y - sites[anchor].y).powi(2))
            .sqrt();
            (dist, i)
        })
        .collect();

    ranked_with_dist.sort_by(|a, b| {
        let primary = a.0.partial_cmp(&b.0).unwrap();
        if primary == std::cmp::Ordering::Equal {
            let score_a = -(0.55 * sites[a.1].accessibility
                + 0.3 * sites[a.1].port_access
                + 0.15 * sites[a.1].river_access);
            let score_b = -(0.55 * sites[b.1].accessibility
                + 0.3 * sites[b.1].port_access
                + 0.15 * sites[b.1].river_access);
            score_a.partial_cmp(&score_b).unwrap()
        } else {
            primary
        }
    });

    let mut chosen = std::collections::HashSet::new();
    let target_count = config.trade_cluster_count as usize;

    for &(dist, idx) in &ranked_with_dist {
        if dist <= config.trade_cluster_radius || idx == anchor {
            chosen.insert(idx);
        }
        if chosen.len() >= target_count {
            break;
        }
    }

    if chosen.len() < target_count {
        for &(_dist, idx) in &ranked_with_dist {
            chosen.insert(idx);
            if chosen.len() >= target_count {
                break;
            }
        }
    }

    for idx in chosen {
        let site = &mut sites[idx];
        site.trade_cluster = true;
        site.trade_cluster_openness_bonus = config.trade_cluster_openness_bonus;
        site.trade_cluster_capital_bonus = config.trade_cluster_capital_bonus;
        site.accessibility =
            (site.accessibility + config.trade_cluster_accessibility_bonus).min(1.0);
        site.port_access =
            (site.port_access + 0.5 * config.trade_cluster_accessibility_bonus).min(1.0);
        site.suitability =
            (site.suitability + 0.15 * config.trade_cluster_accessibility_bonus).min(1.0);
    }
}

fn initialize_site_states_rust(sites: Vec<Site>, config: &SimulationConfig) -> Vec<SiteState> {
    let mut rng = Pcg64::seed_from_u64(config.seed as u64);
    let mut states = Vec::new();

    for site in sites {
        let extraction_bias = config.initial_extraction_resource_bias * site.resource_rent;
        let extraction_alpha = (config.initial_extraction_alpha + extraction_bias).max(0.1);
        let extraction_beta = (config.initial_extraction_beta - extraction_bias).max(0.1);

        let extraction_dist = Beta::new(extraction_alpha, extraction_beta).unwrap();
        let mut extraction = extraction_dist.sample(&mut rng);
        extraction = (extraction + site.boomtown_initial_extraction_boost).min(1.0);

        let openness_dist =
            Beta::new(config.initial_openness_alpha, config.initial_openness_beta).unwrap();
        let mut openness = openness_dist.sample(&mut rng);
        openness = (openness + site.trade_cluster_openness_bonus).min(1.0);

        let adaptability_dist = Beta::new(
            config.initial_adaptability_alpha,
            config.initial_adaptability_beta,
        )
        .unwrap();
        let mut adaptability = adaptability_dist.sample(&mut rng);
        if site.trade_cluster {
            adaptability = (adaptability + 0.35 * site.trade_cluster_openness_bonus).min(1.0);
        }

        let productive_capital = (0.04
            + 0.08 * (site.port_access + site.river_access + site.accessibility)
            + site.trade_cluster_capital_bonus)
            .min(1.5);

        let readiness =
            institutional_readiness(extraction, openness, adaptability, productive_capital);

        states.push(SiteState {
            site: site.clone(),
            institution: InstitutionState {
                extraction,
                openness,
                adaptability,
                reform_timer: 0,
            },
            resource_rent: site.resource_rent,
            initial_resource_rent: site.resource_rent,
            productive_capital,
            initial_productive_capital: productive_capital,
            population: 1,
            initial_extraction: extraction,
            initial_openness: openness,
            initial_adaptability: adaptability,
            shock_readiness: readiness,
            ..Default::default()
        });
    }
    states
}

fn build_policy_enum(
    name: &str,
    arm_count: usize,
    seed: u64,
    config: &SimulationConfig,
) -> Result<Box<dyn Policy + Send>, String> {
    let rng = Pcg64::seed_from_u64(seed);
    let cfg = config.clone();
    match name.to_lowercase().as_str() {
        "epsilon-greedy" | "eps-greedy" => Ok(Box::new(EpsilonGreedyPolicy::new(arm_count, rng, 0.1))),
        "ucb1" | "ucb" => Ok(Box::new(UCB1Policy::new(arm_count, 2.0))),
        "discounted-ucb" | "ducb" => Ok(Box::new(DiscountedUCBPolicy::new(
            arm_count,
            config.discounted_ucb_gamma,
            2.0,
        ))),
        "sliding-window-ucb" | "sw-ucb" => Ok(Box::new(SlidingWindowUCBPolicy::new(
            arm_count,
            config.sliding_window_ucb_window as usize,
            2.0,
        ))),
        "gaussian-thompson" | "thompson-sampling" | "ts" | "thompson" => Ok(Box::new(GaussianThompsonPolicy::new(
            arm_count,
            rng,
            9.0,
            0.0,
            16.0,
            config.thompson_posterior_decay,
            0.3,
            false,
        ))),
        "discounted-gaussian-thompson" | "discounted-thompson" | "discounted-ts" => Ok(Box::new(GaussianThompsonPolicy::new(
            arm_count,
            rng,
            9.0,
            0.0,
            16.0,
            config.discounted_thompson_posterior_decay,
            0.3,
            true,
        ))),
        "whittle-index" | "whittle" => Ok(Box::new(WhittleIndexPolicy::new(arm_count, cfg))),
        "myopic-oracle" | "oracle" => Ok(Box::new(MyopicOraclePolicy::new(arm_count, cfg))),
        "linucb" | "linear-ucb" => Ok(Box::new(LinUCBPolicy::new(
            arm_count,
            config.linucb_alpha,
            config.linear_bandit_ridge,
            cfg,
        ))),
        "linear-thompson" | "linear-ts" => Ok(Box::new(LinearThompsonPolicy::new(
            arm_count,
            rng,
            config.linear_bandit_ridge,
            config.linear_thompson_observation_variance,
            config.linear_thompson_sampling_scale,
            cfg,
        ))),
        _ => Err(format!(
            "unknown policy {:?}: use epsilon-greedy, ucb1, discounted-ucb, sliding-window-ucb, gaussian-thompson, thompson-sampling, discounted-gaussian-thompson, discounted-thompson, whittle-index, myopic-oracle, linucb, linear-thompson",
            name
        )),
    }
}

pub fn run_simulation_with_options(
    config: &SimulationConfig,
    policy_name: &str,
    scenario_label: &str,
) -> Result<RunResult, String> {
    let terrain = generate_terrain_rust(config);
    let (land_share, river_share) = terrain_shares(&terrain);
    let mut sites =
        select_candidate_sites_rust(&terrain, config.num_sites as usize, config.min_site_spacing);
    apply_trade_cluster_shape_rust(&mut sites, config);
    apply_boomtown_shape_rust(&mut sites, config);

    let mut states = initialize_site_states_rust(sites, config);
    let n = states.len();

    let mut decay_matrix = Array2::<f64>::zeros((n, n));
    for i in 0..n {
        for j in 0..n {
            if i != j {
                let dist = site_distance(&states[i].site, &states[j].site).max(1e-6);
                decay_matrix[[i, j]] = (-dist / config.network_scale).exp();
            }
        }
    }

    let mut geographies = Array1::<f64>::zeros(n);
    for i in 0..n {
        geographies[i] = base_geography(&states[i].site, config);
    }

    let mut rng = Pcg64::seed_from_u64(config.seed as u64);
    let mut policy = build_policy_enum(policy_name, n, config.seed as u64, config)?;
    let mut cache = crate::core::SimulationCache::new(n);

    let mut cumulative_reward = 0.0;
    let wants_snapshots = policy.wants_snapshots();

    let is_low_lod = config.lod.to_uppercase() == "LOW";
    let mut selected_sites = if is_low_lod {
        None
    } else {
        Some(Vec::with_capacity(config.horizon as usize))
    };
    let mut reward_history = if is_low_lod {
        None
    } else {
        Some(Vec::with_capacity(config.horizon as usize))
    };

    for step in 0..config.horizon {
        let snapshots: Vec<SiteStateSnapshot> = if wants_snapshots {
            states
                .iter()
                .enumerate()
                .map(|(i, s)| SiteStateSnapshot {
                    site_id: s.site.id,
                    x: s.site.x,
                    y: s.site.y,
                    boomtown: s.site.boomtown,
                    trade_cluster: s.site.trade_cluster,
                    extraction: s.institution.extraction,
                    openness: s.institution.openness,
                    adaptability: s.institution.adaptability,
                    resource_rent: s.resource_rent,
                    productive_capital: s.productive_capital,
                    population: s.population,
                    shock_reform_stock: s.shock_reform_stock,
                    geography: geographies[i],
                    reform_timer: s.institution.reform_timer,
                    boomtown_reward_bonus: s.site.boomtown_reward_bonus,
                    boomtown_bonus_duration: s.site.boomtown_bonus_duration,
                    boomtown_collapse_threshold: s.site.boomtown_collapse_threshold,
                    boomtown_collapse_penalty: s.site.boomtown_collapse_penalty,
                    boomtown_decay_multiplier: s.site.boomtown_decay_multiplier,
                })
                .collect()
        } else {
            Vec::new()
        };

        let chosen = policy.select_site(&snapshots);
        states[chosen].population += 1;

        if let Some(ref mut ss) = selected_sites {
            ss.push(chosen);
        }

        let _report = evolve_sites(
            &mut states,
            config,
            &mut rng,
            Some(chosen),
            Some(step),
            &decay_matrix,
            &geographies,
            &mut cache,
        );

        let reward = cache.rewards[chosen];

        if let Some(ref mut rh) = reward_history {
            rh.push(reward);
        }

        policy.update(chosen, reward, &snapshots);
        cumulative_reward += reward;
    }

    // Calculate final metrics
    let extractions: Vec<f64> = states.iter().map(|s| s.institution.extraction).collect();
    let openness: Vec<f64> = states.iter().map(|s| s.institution.openness).collect();
    let adaptability: Vec<f64> = states.iter().map(|s| s.institution.adaptability).collect();
    let resource_rents: Vec<f64> = states.iter().map(|s| s.resource_rent).collect();
    let initial_resource_rents: Vec<f64> = states.iter().map(|s| s.initial_resource_rent).collect();
    let capitals: Vec<f64> = states.iter().map(|s| s.productive_capital).collect();
    let populations: Vec<f64> = states.iter().map(|s| s.population as f64).collect();
    let reforms: Vec<f64> = states.iter().map(|s| s.reforms_triggered as f64).collect();
    let shocks: Vec<f64> = states.iter().map(|s| s.shock_hits as f64).collect();

    let total_pop: f64 = populations.iter().sum();
    let bt_pop: f64 = states
        .iter()
        .filter(|s| s.site.boomtown)
        .map(|s| s.population as f64)
        .sum();

    let boomtown_selection_share = selected_sites
        .as_ref()
        .and_then(|chosen| boomtown_selection_share_for_window(chosen, &states, 0, chosen.len()));
    let collapse_start = config.boomtown_collapse_threshold.max(0) as usize;
    let bonus_end = config
        .boomtown_bonus_duration
        .max(config.boomtown_collapse_threshold) as usize;
    let boomtown_pre_collapse_selection_share = selected_sites
        .as_ref()
        .and_then(|chosen| boomtown_selection_share_for_window(chosen, &states, 0, collapse_start));
    let boomtown_collapse_selection_share = selected_sites.as_ref().and_then(|chosen| {
        boomtown_selection_share_for_window(chosen, &states, collapse_start, bonus_end)
    });

    let mut site_outcomes = None;
    if config.lod.to_uppercase() == "HIGH" {
        let mut outcomes = Vec::with_capacity(n);
        for s in &states {
            outcomes.push(SiteOutcome {
                site_id: s.site.id,
                x: s.site.x,
                y: s.site.y,
                boomtown: s.site.boomtown,
                trade_cluster: s.site.trade_cluster,
                population: s.population as f64,
                extraction: s.institution.extraction,
                openness: s.institution.openness,
                adaptability: s.institution.adaptability,
                initial_resource_rent: s.initial_resource_rent,
                resource_rent: s.resource_rent,
                productive_capital: s.productive_capital,
                shock_hits: s.shock_hits as f64,
                reforms_triggered: s.reforms_triggered as f64,
            });
        }
        site_outcomes = Some(outcomes);
    }

    Ok(RunResult {
        run_id: config.run_id as i64,
        seed: config.seed as i64,
        policy: policy_name.to_string(),
        scenario: scenario_label.to_string(),
        cumulative_reward,
        oracle_reward: None,
        oracle_regret: None,
        empirical_best_reward: None,
        empirical_regret: None,
        mean_final_extraction: if n > 0 {
            extractions.iter().sum::<f64>() / n as f64
        } else {
            0.0
        },
        mean_final_openness: if n > 0 {
            openness.iter().sum::<f64>() / n as f64
        } else {
            0.0
        },
        mean_final_adaptability: if n > 0 {
            adaptability.iter().sum::<f64>() / n as f64
        } else {
            0.0
        },
        mean_final_resource_rent: if n > 0 {
            resource_rents.iter().sum::<f64>() / n as f64
        } else {
            0.0
        },
        mean_productive_capital: if n > 0 {
            capitals.iter().sum::<f64>() / n as f64
        } else {
            0.0
        },
        mean_reforms_triggered: if n > 0 {
            reforms.iter().sum::<f64>() / n as f64
        } else {
            0.0
        },
        mean_shock_hits: if n > 0 {
            shocks.iter().sum::<f64>() / n as f64
        } else {
            0.0
        },
        population_hhi: crate::math_utils::calculate_hhi(&populations),
        population_gini: crate::math_utils::calculate_gini(&populations),
        zipf_slope: crate::math_utils::calculate_zipf_slope(&populations),
        resource_extraction_correlation: crate::math_utils::calculate_correlation(
            &initial_resource_rents,
            &extractions,
        ),
        resource_population_correlation: crate::math_utils::calculate_correlation(
            &initial_resource_rents,
            &populations,
        ),
        boomtown_population_share: if total_pop > 0.0 {
            bt_pop / total_pop
        } else {
            0.0
        },
        boomtown_selection_share,
        boomtown_pre_collapse_selection_share,
        boomtown_collapse_selection_share,
        land_share,
        river_share,
        selected_sites,
        reward_history,
        site_outcomes,
    })
}

/// Backward-compatible entry: scenario label `"default"`.
pub fn _run_simulation_rust(
    config: &SimulationConfig,
    policy_name: &str,
) -> Result<RunResult, String> {
    run_simulation_with_options(config, policy_name, "default")
}



pub fn run_sweep_rust_core(
    input_jsonl: &str,
    policies: &[String],
    output_parquet: &str,
    batch_limit: Option<usize>,
    batch_offset: Option<usize>,
) -> Result<(), Box<dyn std::error::Error>> {
    let (tx, rx) = mpsc::sync_channel::<RunResult>(5000);

    let output_path = output_parquet.to_string();
    let temp_output_path = format!("{output_parquet}.tmp");
    let writer_output_path = temp_output_path.clone();
    let _ = fs::remove_file(&temp_output_path);
    let policies_vec = policies.to_vec();
    let errors = Arc::new(Mutex::new(Vec::<String>::new()));
    let completed_configs = Arc::new(AtomicUsize::new(0));

    let writer_thread = thread::spawn(move || {
        let file = File::create(Path::new(&writer_output_path)).unwrap();

        let schema = Arc::new(Schema::new(vec![
            Field::new("run_id", DataType::Int64, false),
            Field::new("seed", DataType::Int64, false),
            Field::new("policy", DataType::Utf8, false),
            Field::new("scenario", DataType::Utf8, false),
            Field::new("cumulative_reward", DataType::Float64, false),
            Field::new("oracle_reward", DataType::Float64, true),
            Field::new("oracle_regret", DataType::Float64, true),
            Field::new("empirical_best_reward", DataType::Float64, true),
            Field::new("empirical_regret", DataType::Float64, true),
            Field::new("mean_final_extraction", DataType::Float64, false),
            Field::new("mean_final_openness", DataType::Float64, false),
            Field::new("mean_final_adaptability", DataType::Float64, false),
            Field::new("mean_final_resource_rent", DataType::Float64, false),
            Field::new("mean_productive_capital", DataType::Float64, false),
            Field::new("mean_reforms_triggered", DataType::Float64, false),
            Field::new("mean_shock_hits", DataType::Float64, false),
            Field::new("population_hhi", DataType::Float64, false),
            Field::new("population_gini", DataType::Float64, false),
            Field::new("zipf_slope", DataType::Float64, false),
            Field::new("resource_extraction_correlation", DataType::Float64, false),
            Field::new("resource_population_correlation", DataType::Float64, false),
            Field::new("boomtown_population_share", DataType::Float64, false),
            Field::new("boomtown_selection_share", DataType::Float64, true),
            Field::new(
                "boomtown_pre_collapse_selection_share",
                DataType::Float64,
                true,
            ),
            Field::new("boomtown_collapse_selection_share", DataType::Float64, true),
            Field::new("land_share", DataType::Float64, false),
            Field::new("river_share", DataType::Float64, false),
        ]));

        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(file, schema.clone(), Some(props)).unwrap();

        let mut batch_run_id = Int64Builder::new();
        let mut batch_seed = Int64Builder::new();
        let mut batch_policy = StringBuilder::new();
        let mut batch_scenario = StringBuilder::new();
        let mut batch_cumulative_reward = Float64Builder::new();
        let mut batch_oracle_reward = Float64Builder::new();
        let mut batch_oracle_regret = Float64Builder::new();
        let mut batch_empirical_best_reward = Float64Builder::new();
        let mut batch_empirical_regret = Float64Builder::new();
        let mut batch_mean_final_extraction = Float64Builder::new();
        let mut batch_mean_final_openness = Float64Builder::new();
        let mut batch_mean_final_adaptability = Float64Builder::new();
        let mut batch_mean_final_resource_rent = Float64Builder::new();
        let mut batch_mean_productive_capital = Float64Builder::new();
        let mut batch_mean_reforms_triggered = Float64Builder::new();
        let mut batch_mean_shock_hits = Float64Builder::new();
        let mut batch_population_hhi = Float64Builder::new();
        let mut batch_population_gini = Float64Builder::new();
        let mut batch_zipf_slope = Float64Builder::new();
        let mut batch_resource_extraction_correlation = Float64Builder::new();
        let mut batch_resource_population_correlation = Float64Builder::new();
        let mut batch_boomtown_population_share = Float64Builder::new();
        let mut batch_boomtown_selection_share = Float64Builder::new();
        let mut batch_boomtown_pre_collapse_selection_share = Float64Builder::new();
        let mut batch_boomtown_collapse_selection_share = Float64Builder::new();
        let mut batch_land_share = Float64Builder::new();
        let mut batch_river_share = Float64Builder::new();

        let mut count = 0;

        for res in rx {
            batch_run_id.append_value(res.run_id);
            batch_seed.append_value(res.seed);
            batch_policy.append_value(res.policy);
            batch_scenario.append_value(res.scenario);
            batch_cumulative_reward.append_value(res.cumulative_reward);
            match res.oracle_reward {
                Some(value) => batch_oracle_reward.append_value(value),
                None => batch_oracle_reward.append_null(),
            }
            match res.oracle_regret {
                Some(value) => batch_oracle_regret.append_value(value),
                None => batch_oracle_regret.append_null(),
            }
            match res.empirical_best_reward {
                Some(value) => batch_empirical_best_reward.append_value(value),
                None => batch_empirical_best_reward.append_null(),
            }
            match res.empirical_regret {
                Some(value) => batch_empirical_regret.append_value(value),
                None => batch_empirical_regret.append_null(),
            }
            batch_mean_final_extraction.append_value(res.mean_final_extraction);
            batch_mean_final_openness.append_value(res.mean_final_openness);
            batch_mean_final_adaptability.append_value(res.mean_final_adaptability);
            batch_mean_final_resource_rent.append_value(res.mean_final_resource_rent);
            batch_mean_productive_capital.append_value(res.mean_productive_capital);
            batch_mean_reforms_triggered.append_value(res.mean_reforms_triggered);
            batch_mean_shock_hits.append_value(res.mean_shock_hits);
            batch_population_hhi.append_value(res.population_hhi);
            batch_population_gini.append_value(res.population_gini);
            batch_zipf_slope.append_value(res.zipf_slope);
            batch_resource_extraction_correlation.append_value(res.resource_extraction_correlation);
            batch_resource_population_correlation.append_value(res.resource_population_correlation);
            batch_boomtown_population_share.append_value(res.boomtown_population_share);
            match res.boomtown_selection_share {
                Some(value) => batch_boomtown_selection_share.append_value(value),
                None => batch_boomtown_selection_share.append_null(),
            }
            match res.boomtown_pre_collapse_selection_share {
                Some(value) => batch_boomtown_pre_collapse_selection_share.append_value(value),
                None => batch_boomtown_pre_collapse_selection_share.append_null(),
            }
            match res.boomtown_collapse_selection_share {
                Some(value) => batch_boomtown_collapse_selection_share.append_value(value),
                None => batch_boomtown_collapse_selection_share.append_null(),
            }
            batch_land_share.append_value(res.land_share);
            batch_river_share.append_value(res.river_share);

            count += 1;
            if count >= 1000 {
                let batch = RecordBatch::try_new(
                    schema.clone(),
                    vec![
                        Arc::new(batch_run_id.finish()),
                        Arc::new(batch_seed.finish()),
                        Arc::new(batch_policy.finish()),
                        Arc::new(batch_scenario.finish()),
                        Arc::new(batch_cumulative_reward.finish()),
                        Arc::new(batch_oracle_reward.finish()),
                        Arc::new(batch_oracle_regret.finish()),
                        Arc::new(batch_empirical_best_reward.finish()),
                        Arc::new(batch_empirical_regret.finish()),
                        Arc::new(batch_mean_final_extraction.finish()),
                        Arc::new(batch_mean_final_openness.finish()),
                        Arc::new(batch_mean_final_adaptability.finish()),
                        Arc::new(batch_mean_final_resource_rent.finish()),
                        Arc::new(batch_mean_productive_capital.finish()),
                        Arc::new(batch_mean_reforms_triggered.finish()),
                        Arc::new(batch_mean_shock_hits.finish()),
                        Arc::new(batch_population_hhi.finish()),
                        Arc::new(batch_population_gini.finish()),
                        Arc::new(batch_zipf_slope.finish()),
                        Arc::new(batch_resource_extraction_correlation.finish()),
                        Arc::new(batch_resource_population_correlation.finish()),
                        Arc::new(batch_boomtown_population_share.finish()),
                        Arc::new(batch_boomtown_selection_share.finish()),
                        Arc::new(batch_boomtown_pre_collapse_selection_share.finish()),
                        Arc::new(batch_boomtown_collapse_selection_share.finish()),
                        Arc::new(batch_land_share.finish()),
                        Arc::new(batch_river_share.finish()),
                    ],
                )
                .unwrap();
                writer.write(&batch).unwrap();
                count = 0;
            }
        }

        if count > 0 {
            let batch = RecordBatch::try_new(
                schema.clone(),
                vec![
                    Arc::new(batch_run_id.finish()),
                    Arc::new(batch_seed.finish()),
                    Arc::new(batch_policy.finish()),
                    Arc::new(batch_scenario.finish()),
                    Arc::new(batch_cumulative_reward.finish()),
                    Arc::new(batch_oracle_reward.finish()),
                    Arc::new(batch_oracle_regret.finish()),
                    Arc::new(batch_empirical_best_reward.finish()),
                    Arc::new(batch_empirical_regret.finish()),
                    Arc::new(batch_mean_final_extraction.finish()),
                    Arc::new(batch_mean_final_openness.finish()),
                    Arc::new(batch_mean_final_adaptability.finish()),
                    Arc::new(batch_mean_final_resource_rent.finish()),
                    Arc::new(batch_mean_productive_capital.finish()),
                    Arc::new(batch_mean_reforms_triggered.finish()),
                    Arc::new(batch_mean_shock_hits.finish()),
                    Arc::new(batch_population_hhi.finish()),
                    Arc::new(batch_population_gini.finish()),
                    Arc::new(batch_zipf_slope.finish()),
                    Arc::new(batch_resource_extraction_correlation.finish()),
                    Arc::new(batch_resource_population_correlation.finish()),
                    Arc::new(batch_boomtown_population_share.finish()),
                    Arc::new(batch_boomtown_selection_share.finish()),
                    Arc::new(batch_boomtown_pre_collapse_selection_share.finish()),
                    Arc::new(batch_boomtown_collapse_selection_share.finish()),
                    Arc::new(batch_land_share.finish()),
                    Arc::new(batch_river_share.finish()),
                ],
            )
            .unwrap();
            writer.write(&batch).unwrap();
        }

        writer.close().unwrap();
    });

    let reader = BufReader::new(File::open(input_jsonl)?);
    let mut lines = Vec::new();
    for line in reader.lines() {
        match line {
            Ok(line) => lines.push(line),
            Err(e) => errors
                .lock()
                .unwrap()
                .push(format!("input read error: {e}")),
        }
    }

    let offset = batch_offset.unwrap_or(0).min(lines.len());
    let available_configs = lines.len().saturating_sub(offset);
    let total_configs = batch_limit.map_or(available_configs, |limit| available_configs.min(limit));
    eprintln!(
        "Loaded {} configs; executing {total_configs} configs from offset {offset} with {} requested policies",
        lines.len(),
        policies_vec.len()
    );

    if let Some(limit) = batch_limit {
        let batch: Vec<String> = lines.into_iter().skip(offset).take(limit).collect();
        let errors = Arc::clone(&errors);
        let completed_configs = Arc::clone(&completed_configs);
        batch.into_par_iter().for_each(|line| {
            let (config, scenario_name) = match parse_sweep_input_line(&line) {
                Ok(parsed) => parsed,
                Err(e) => {
                    errors
                        .lock()
                        .unwrap()
                        .push(format!("invalid JSON line: {e}"));
                    return;
                }
            };
            let mut results = Vec::new();
            for policy in &policies_vec {
                match run_simulation_with_options(&config, policy, &scenario_name) {
                    Ok(result) => results.push(result),
                    Err(e) => errors
                        .lock()
                        .unwrap()
                        .push(format!("policy {policy:?}: {e}")),
                }
            }
            if results.is_empty() {
                errors
                    .lock()
                    .unwrap()
                    .push("no sweep policies ran".to_string());
                return;
            }
            let oracle_reward = if let Some(oracle) = results
                .iter()
                .find(|result| is_oracle_policy_name(&result.policy))
            {
                oracle.cumulative_reward
            } else {
                match run_simulation_with_options(&config, "myopic-oracle", &scenario_name) {
                    Ok(result) => result.cumulative_reward,
                    Err(e) => {
                        errors
                            .lock()
                            .unwrap()
                            .push(format!("oracle baseline failed: {e}"));
                        return;
                    }
                }
            };
            set_result_baselines_with_oracle(&mut results, oracle_reward);
            for result in results {
                if tx.send(result).is_err() {
                    return;
                }
            }
            let done = completed_configs.fetch_add(1, Ordering::Relaxed) + 1;
            if done % 1000 == 0 || done == total_configs {
                eprintln!("sweep progress: {done}/{total_configs} configs");
            }
        });
    } else {
        let errors = Arc::clone(&errors);
        let completed_configs = Arc::clone(&completed_configs);
        lines.into_par_iter().skip(offset).for_each(|line| {
            let (config, scenario_name) = match parse_sweep_input_line(&line) {
                Ok(parsed) => parsed,
                Err(e) => {
                    errors
                        .lock()
                        .unwrap()
                        .push(format!("invalid JSON line: {e}"));
                    return;
                }
            };
            let mut results = Vec::new();
            for policy in &policies_vec {
                match run_simulation_with_options(&config, policy, &scenario_name) {
                    Ok(result) => results.push(result),
                    Err(e) => errors
                        .lock()
                        .unwrap()
                        .push(format!("policy {policy:?}: {e}")),
                }
            }
            if results.is_empty() {
                errors
                    .lock()
                    .unwrap()
                    .push("no sweep policies ran".to_string());
                return;
            }
            let oracle_reward = if let Some(oracle) = results
                .iter()
                .find(|result| is_oracle_policy_name(&result.policy))
            {
                oracle.cumulative_reward
            } else {
                match run_simulation_with_options(&config, "myopic-oracle", &scenario_name) {
                    Ok(result) => result.cumulative_reward,
                    Err(e) => {
                        errors
                            .lock()
                            .unwrap()
                            .push(format!("oracle baseline failed: {e}"));
                        return;
                    }
                }
            };
            set_result_baselines_with_oracle(&mut results, oracle_reward);
            for result in results {
                if tx.send(result).is_err() {
                    return;
                }
            }
            let done = completed_configs.fetch_add(1, Ordering::Relaxed) + 1;
            if done % 1000 == 0 || done == total_configs {
                eprintln!("sweep progress: {done}/{total_configs} configs");
            }
        });
    }

    drop(tx);
    writer_thread.join().unwrap();
    let errors = errors.lock().unwrap();
    if !errors.is_empty() {
        let _ = fs::remove_file(&temp_output_path);
        return Err(format!(
            "sweep failed with {} error(s): {}",
            errors.len(),
            errors.join("; ")
        )
        .into());
    }
    if Path::new(&output_path).exists() {
        fs::remove_file(&output_path)?;
    }
    fs::rename(&temp_output_path, &output_path)?;
    Ok(())
}



