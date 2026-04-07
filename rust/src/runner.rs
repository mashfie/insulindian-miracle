use crate::core::{evolve_sites, institutional_readiness, site_distance, base_geography};
use crate::policies::{
    Policy, EpsilonGreedyPolicy, UCB1Policy, GaussianThompsonPolicy,
    DiscountedUCBPolicy, SlidingWindowUCBPolicy, MyopicOraclePolicy, LinUCBPolicy,
    LinearThompsonPolicy,
};
use crate::types::{SimulationConfig, Site, SiteState, SiteStateSnapshot, InstitutionState};
use crate::terrain::{generate_terrain_rust, select_candidate_sites_rust, terrain_shares};
use crate::whittle::WhittleIndexPolicy;

use ndarray::{Array1, Array2};
use pyo3::prelude::*;
use rand::SeedableRng;
use rand_pcg::Pcg64;
use rand::distributions::Distribution;
use rand_distr::Beta;
use rayon::prelude::*;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::sync::mpsc;
use std::thread;
use std::sync::Arc;

use arrow::array::{Int64Builder, Float64Builder, StringBuilder};
use arrow::datatypes::{Schema, Field, DataType};
use arrow::record_batch::RecordBatch;
use parquet::arrow::ArrowWriter;
use parquet::file::properties::WriterProperties;

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RunResult {
    pub run_id: i64,
    pub seed: i64,
    pub policy: String,
    pub scenario: String,
    pub cumulative_reward: f64,
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
    pub resource_population_correlation: f64,
    pub boomtown_population_share: f64,
    pub land_share: f64,
    pub river_share: f64,
}

fn apply_boomtown_shape_rust(sites: &mut Vec<Site>, config: &SimulationConfig) {
    if config.boomtown_count <= 0 || sites.is_empty() { return; }

    let mut ranked: Vec<usize> = (0..sites.len()).collect();
    ranked.sort_by(|&a, &b| {
        let score_a = sites[a].resource_rent - base_geography(&sites[a], config);
        let score_b = sites[b].resource_rent - base_geography(&sites[b], config);
        score_b.partial_cmp(&score_a).unwrap()
    });

    for i in 0..config.boomtown_count as usize {
        if i >= ranked.len() { break; }
        let idx = ranked[i];
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

fn apply_trade_cluster_shape_rust(sites: &mut Vec<Site>, config: &SimulationConfig) {
    if config.trade_cluster_count <= 0 || sites.is_empty() { return; }

    let anchor = (0..sites.len()).max_by(|&a, &b| {
        let score_a = 0.5 * sites[a].accessibility + 0.35 * sites[a].port_access + 0.15 * sites[a].river_access - 0.25 * sites[a].resource_rent;
        let score_b = 0.5 * sites[b].accessibility + 0.35 * sites[b].port_access + 0.15 * sites[b].river_access - 0.25 * sites[b].resource_rent;
        score_a.partial_cmp(&score_b).unwrap()
    }).unwrap();

    let mut ranked_with_dist: Vec<(f64, usize)> = (0..sites.len()).map(|i| {
        let dist = ((sites[i].x - sites[anchor].x).powi(2) + (sites[i].y - sites[anchor].y).powi(2)).sqrt();
        (dist, i)
    }).collect();

    ranked_with_dist.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());

    for i in 0..config.trade_cluster_count as usize {
        if i >= ranked_with_dist.len() { break; }
        let (dist, idx) = ranked_with_dist[i];
        if dist > config.trade_cluster_radius {
            break;
        }
        let site = &mut sites[idx];
        site.trade_cluster = true;
        site.trade_cluster_openness_bonus = config.trade_cluster_openness_bonus;
        site.trade_cluster_capital_bonus = config.trade_cluster_capital_bonus;
        site.accessibility = (site.accessibility + config.trade_cluster_accessibility_bonus).min(1.0);
        site.port_access = (site.port_access + 0.5 * config.trade_cluster_accessibility_bonus).min(1.0);
        site.suitability = (site.suitability + 0.15 * config.trade_cluster_accessibility_bonus).min(1.0);
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

        let openness_dist = Beta::new(config.initial_openness_alpha, config.initial_openness_beta).unwrap();
        let mut openness = openness_dist.sample(&mut rng);
        openness = (openness + site.trade_cluster_openness_bonus).min(1.0);

        let adaptability_dist = Beta::new(config.initial_adaptability_alpha, config.initial_adaptability_beta).unwrap();
        let mut adaptability = adaptability_dist.sample(&mut rng);
        if site.trade_cluster {
            adaptability = (adaptability + 0.35 * site.trade_cluster_openness_bonus).min(1.0);
        }

        let productive_capital = (0.04 + 0.08 * (site.port_access + site.river_access + site.accessibility) + site.trade_cluster_capital_bonus).min(1.5);
        
        let readiness = institutional_readiness(
            extraction,
            openness,
            adaptability,
            productive_capital,
        );

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
        "gaussian-thompson" | "ts" | "thompson" => Ok(Box::new(GaussianThompsonPolicy::new(
            arm_count,
            rng,
            9.0,
            0.0,
            16.0,
            config.thompson_posterior_decay,
            0.3,
            false,
        ))),
        "discounted-gaussian-thompson" | "discounted-thompson" => Ok(Box::new(GaussianThompsonPolicy::new(
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
        "myopic-oracle" | "oracle" => Ok(Box::new(MyopicOraclePolicy::new(arm_count))),
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
            "unknown policy {:?}: use epsilon-greedy, ucb1, discounted-ucb, sliding-window-ucb, gaussian-thompson, discounted-thompson, whittle-index, myopic-oracle, linucb, linear-thompson",
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
    let mut sites = select_candidate_sites_rust(&terrain, config.num_sites as usize, config.min_site_spacing);
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
        policy.update(chosen, reward, &snapshots);
        cumulative_reward += reward;
    }


    // Calculate final metrics
    let extractions: Vec<f64> = states.iter().map(|s| s.institution.extraction).collect();
    let openness: Vec<f64> = states.iter().map(|s| s.institution.openness).collect();
    let adaptability: Vec<f64> = states.iter().map(|s| s.institution.adaptability).collect();
    let resource_rents: Vec<f64> = states.iter().map(|s| s.resource_rent).collect();
    let capitals: Vec<f64> = states.iter().map(|s| s.productive_capital).collect();
    let populations: Vec<f64> = states.iter().map(|s| s.population as f64).collect();
    let reforms: Vec<f64> = states.iter().map(|s| s.reforms_triggered as f64).collect();
    let shocks: Vec<f64> = states.iter().map(|s| s.shock_hits as f64).collect();

    let total_pop: f64 = populations.iter().sum();
    let bt_pop: f64 = states.iter().filter(|s| s.site.boomtown).map(|s| s.population as f64).sum();

    Ok(RunResult {
        run_id: config.run_id as i64,
        seed: config.seed as i64,
        policy: policy_name.to_string(),
        scenario: scenario_label.to_string(),
        cumulative_reward,
        mean_final_extraction: if n > 0 { extractions.iter().sum::<f64>() / n as f64 } else { 0.0 },
        mean_final_openness: if n > 0 { openness.iter().sum::<f64>() / n as f64 } else { 0.0 },
        mean_final_adaptability: if n > 0 { adaptability.iter().sum::<f64>() / n as f64 } else { 0.0 },
        mean_final_resource_rent: if n > 0 { resource_rents.iter().sum::<f64>() / n as f64 } else { 0.0 },
        mean_productive_capital: if n > 0 { capitals.iter().sum::<f64>() / n as f64 } else { 0.0 },
        mean_reforms_triggered: if n > 0 { reforms.iter().sum::<f64>() / n as f64 } else { 0.0 },
        mean_shock_hits: if n > 0 { shocks.iter().sum::<f64>() / n as f64 } else { 0.0 },
        population_hhi: crate::math_utils::calculate_hhi(&populations),
        population_gini: crate::math_utils::calculate_gini(&populations),
        zipf_slope: crate::math_utils::calculate_zipf_slope(&populations),
        resource_population_correlation: crate::math_utils::calculate_correlation(&resource_rents, &populations),
        boomtown_population_share: if total_pop > 0.0 { bt_pop / total_pop } else { 0.0 },
        land_share,
        river_share,
    })
}

/// Backward-compatible entry: scenario label `"default"`.
pub fn _run_simulation_rust(config: &SimulationConfig, policy_name: &str) -> Result<RunResult, String> {
    run_simulation_with_options(config, policy_name, "default")
}

#[pyfunction]
pub fn run_simulation_rust(
    py: Python<'_>,
    config_json: String,
    policy_name: String,
) -> PyResult<String> {
    py.allow_threads(|| {
        let config: SimulationConfig = serde_json::from_str(&config_json).map_err(|e| {
            PyErr::new::<pyo3::exceptions::PyValueError, _>(format!("invalid config JSON: {e}"))
        })?;
        let result = _run_simulation_rust(&config, &policy_name).map_err(|e| {
            PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e)
        })?;

        let res_json = serde_json::json!({
            "cumulative_reward": result.cumulative_reward,
            "mean_final_extraction": result.mean_final_extraction,
            "mean_final_openness": result.mean_final_openness,
            "mean_final_adaptability": result.mean_final_adaptability,
            "mean_final_resource_rent": result.mean_final_resource_rent,
            "mean_productive_capital": result.mean_productive_capital,
            "mean_reforms_triggered": result.mean_reforms_triggered,
            "mean_shock_hits": result.mean_shock_hits,
            "population_hhi": result.population_hhi,
            "population_gini": result.population_gini,
            "zipf_slope": result.zipf_slope,
            "resource_population_correlation": result.resource_population_correlation,
            "boomtown_population_share": result.boomtown_population_share,
            "land_share": result.land_share,
            "river_share": result.river_share,
        });
        Ok(res_json.to_string())
    })
}

pub fn run_sweep_rust_core(
    input_jsonl: &str,
    policies: &[String],
    output_parquet: &str,
    batch_limit: Option<usize>,
) -> Result<(), Box<dyn std::error::Error>> {
    let (tx, rx) = mpsc::sync_channel::<RunResult>(5000);

    let output_path = output_parquet.to_string();
    let policies_vec = policies.to_vec();

    let writer_thread = thread::spawn(move || {
        let file = File::create(Path::new(&output_path)).unwrap();
        
        let schema = Arc::new(Schema::new(vec![
            Field::new("run_id", DataType::Int64, false),
            Field::new("seed", DataType::Int64, false),
            Field::new("policy", DataType::Utf8, false),
            Field::new("scenario", DataType::Utf8, false),
            Field::new("cumulative_reward", DataType::Float64, false),
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
            Field::new("resource_population_correlation", DataType::Float64, false),
            Field::new("boomtown_population_share", DataType::Float64, false),
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
        let mut batch_resource_population_correlation = Float64Builder::new();
        let mut batch_boomtown_population_share = Float64Builder::new();
        let mut batch_land_share = Float64Builder::new();
        let mut batch_river_share = Float64Builder::new();

        let mut count = 0;

        for res in rx {
            batch_run_id.append_value(res.run_id);
            batch_seed.append_value(res.seed);
            batch_policy.append_value(res.policy);
            batch_scenario.append_value(res.scenario);
            batch_cumulative_reward.append_value(res.cumulative_reward);
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
            batch_resource_population_correlation.append_value(res.resource_population_correlation);
            batch_boomtown_population_share.append_value(res.boomtown_population_share);
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
                        Arc::new(batch_resource_population_correlation.finish()),
                        Arc::new(batch_boomtown_population_share.finish()),
                        Arc::new(batch_land_share.finish()),
                        Arc::new(batch_river_share.finish()),
                    ],
                ).unwrap();
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
                    Arc::new(batch_resource_population_correlation.finish()),
                    Arc::new(batch_boomtown_population_share.finish()),
                    Arc::new(batch_land_share.finish()),
                    Arc::new(batch_river_share.finish()),
                ],
            ).unwrap();
            writer.write(&batch).unwrap();
        }

        writer.close().unwrap();
    });

    let reader = BufReader::new(File::open(input_jsonl)?);
    let lines = reader.lines().filter_map(|l| l.ok());
    
    if let Some(limit) = batch_limit {
        let batch: Vec<String> = lines.take(limit).collect();
        batch.into_par_iter().for_each(|line| {
            let config: SimulationConfig = match serde_json::from_str(&line) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("sweep: skip line (invalid JSON): {e}");
                    return;
                }
            };
            for policy in &policies_vec {
                match run_simulation_with_options(&config, policy, "sweep") {
                    Ok(result) => {
                        if tx.send(result).is_err() {
                            return;
                        }
                    }
                    Err(e) => eprintln!("sweep: skip run (policy {:?}): {e}", policy),
                }
            }
        });
    } else {
        lines.par_bridge().for_each(|line| {
            let config: SimulationConfig = match serde_json::from_str(&line) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("sweep: skip line (invalid JSON): {e}");
                    return;
                }
            };
            for policy in &policies_vec {
                match run_simulation_with_options(&config, policy, "sweep") {
                    Ok(result) => {
                        if tx.send(result).is_err() {
                            return;
                        }
                    }
                    Err(e) => eprintln!("sweep: skip run (policy {:?}): {e}", policy),
                }
            }
        });
    }

    drop(tx);
    writer_thread.join().unwrap();
    Ok(())
}

#[pyfunction]
#[pyo3(signature = (input_jsonl, policies, output_parquet, batch_limit=None))]
pub fn run_sweep_from_file_rust(
    py: Python<'_>,
    input_jsonl: String,
    policies: Vec<String>,
    output_parquet: String,
    batch_limit: Option<usize>,
) -> PyResult<()> {
    py.allow_threads(|| {
        run_sweep_rust_core(&input_jsonl, &policies, &output_parquet, batch_limit)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))
    })
}
