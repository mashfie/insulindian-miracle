use crate::types::{SimulationConfig, SiteState};
use ndarray::{Array1, Array2, Axis};
use rand::Rng;
use rand::distributions::{Distribution, WeightedIndex};

pub fn sigmoid(value: f64) -> f64 {
    1.0 / (1.0 + (-value).exp())
}

pub fn base_geography(site: &crate::types::Site, config: &SimulationConfig) -> f64 {
    let weights = config.geography_weights;
    weights.0 * site.port_access
        + weights.1 * site.river_access
        + weights.2 * site.arability
        + weights.3 * site.defensibility
        + weights.4 * site.accessibility
}

pub fn site_distance(left: &crate::types::Site, right: &crate::types::Site) -> f64 {
    ((left.x - right.x).powi(2) + (left.y - right.y).powi(2)).sqrt()
}

pub fn institutional_readiness(
    extraction: f64,
    openness: f64,
    adaptability: f64,
    productive_capital: f64,
) -> f64 {
    let capital_scale = (productive_capital / 1.5).clamp(0.0, 1.0);
    let readiness = 0.28 * (1.0 - extraction)
        + 0.28 * openness
        + 0.26 * adaptability
        + 0.18 * capital_scale;
    readiness.clamp(0.0, 1.0)
}

pub struct SimulationCache {
    pub openness: Array1<f64>,
    pub populations: Array1<f64>,
    pub capitals: Array1<f64>,
    pub partner_scale: Array1<f64>,
    pub network_bonuses: Array1<f64>,
    pub rewards: Array1<f64>,
    pub weights: Vec<f64>,
    pub donor_candidates: Vec<usize>,
}

impl SimulationCache {
    pub fn new(n: usize) -> Self {
        Self {
            openness: Array1::zeros(n),
            populations: Array1::zeros(n),
            capitals: Array1::zeros(n),
            partner_scale: Array1::zeros(n),
            network_bonuses: Array1::zeros(n),
            rewards: Array1::zeros(n),
            weights: Vec::with_capacity(n),
            donor_candidates: Vec::with_capacity(n),
        }
    }
}

pub fn calculate_all_network_bonuses(
    states: &[SiteState],
    config: &SimulationConfig,
    decay_matrix: &Array2<f64>,
    cache: &mut SimulationCache,
) {
    let n = states.len();
    if n <= 1 {
        cache.network_bonuses.fill(0.0);
        return;
    }

    for (i, state) in states.iter().enumerate() {
        cache.openness[i] = state.institution.openness;
        cache.populations[i] = state.population as f64;
        cache.capitals[i] = state.productive_capital;
    }

    for i in 0..n {
        cache.partner_scale[i] = cache.openness[i]
            * (1.0 + config.network_population_gain * (cache.populations[i] + 1.0).ln())
            * (1.0 + config.network_capital_gain * cache.capitals[i]);
    }

    let trade_mass = decay_matrix.dot(&cache.partner_scale);
    let weight_sum = decay_matrix.sum_axis(Axis(1));

    for i in 0..n {
        let w = weight_sum[i];
        if w > 1e-9 {
            let local_density = w / ((n - 1) as f64);
            let local_market = trade_mass[i] / w;
            cache.network_bonuses[i] = cache.openness[i] * local_market * (1.0 + config.network_density_gain * local_density);
        } else {
            cache.network_bonuses[i] = 0.0;
        }
    }
}

pub fn compute_all_rewards(
    states: &[SiteState],
    config: &SimulationConfig,
    geographies: &Array1<f64>,
    cache: &mut SimulationCache,
) {
    let n = states.len();
    let target_log = (config.secondary_city_target.max(1.0) + 1.0).ln();
    let spread = config.secondary_city_spread.max(1e-3);

    for i in 0..n {
        let state = &states[i];
        let pop = state.population.max(1) as f64;
        let active_steps = (state.population - 1).max(0) as i32;

        let extractions = state.institution.extraction;
        let openness = state.institution.openness;
        let resource_rents = state.resource_rent;
        let capitals = state.productive_capital;
        let reform_timers = state.institution.reform_timer;
        let network_bonus = cache.network_bonuses[i];

        let resource_payoff = resource_rents * (config.resource_base_payoff + config.resource_capture_gain * extractions);
        let extractive_cashflow = config.extractive_cashflow_premium
            * resource_rents
            * extractions
            * (0.55_f64).max(1.0 - 0.2 * capitals);

        let inclusive = (1.0 - extractions)
            * pop.powf(config.agglomeration_alpha)
            * (1.0 + config.inclusive_productivity_gain * capitals);

        let reinvestment_dividend = config.inclusive_investment_gain
            * resource_rents
            * (1.0 - extractions)
            * (0.45 + openness + 0.35 * capitals);

        let mid_city_multiplier = (-(((pop + 1.0).ln() - target_log).powi(2)) / (2.0 * spread * spread)).exp();
        let secondary_city_dividend = config.secondary_city_bonus * network_bonus * mid_city_multiplier;

        let extractive_drag = extractions * config.extraction_drag * pop;
        let congestion = config.congestion * pop * pop;
        let overstretch = (pop - config.metropolitan_overstretch_threshold).max(0.0);
        let metropolitan_drag = config.metropolitan_overstretch_penalty * overstretch.powf(1.35);

        let reform_cost = if reform_timers > 0 { config.reform_cost } else { 0.0 };

        let mut boomtown_bonus = 0.0;
        let is_boomtown = state.site.boomtown;
        let boomtown_duration = state.site.boomtown_bonus_duration;
        if is_boomtown && boomtown_duration > 0 && active_steps <= boomtown_duration {
            let rem = 1.0 - (active_steps as f64 / boomtown_duration.max(1) as f64);
            boomtown_bonus = state.site.boomtown_reward_bonus * rem.max(0.25);
        }

        let mut collapse_penalty = 0.0;
        let bt_threshold = state.site.boomtown_collapse_threshold;
        if is_boomtown && active_steps > bt_threshold {
            let overflow = active_steps - bt_threshold;
            collapse_penalty = state.site.boomtown_collapse_penalty * overflow as f64;
        }

        cache.rewards[i] = geographies[i]
            + resource_payoff
            + extractive_cashflow
            + inclusive
            + reinvestment_dividend
            + secondary_city_dividend
            - extractive_drag
            - congestion
            - metropolitan_drag
            + network_bonus
            - reform_cost
            + boomtown_bonus
            - collapse_penalty;
    }
}

pub fn _choose_shock_target<R: Rng + ?Sized>(
    states: &[SiteState],
    config: &SimulationConfig,
    rng: &mut R,
    cache: &mut SimulationCache,
) -> usize {
    if states.is_empty() {
        panic!("cannot choose shock target from empty states");
    }
    if config.shock_target_resource_bias <= 0.0 {
        return rng.gen_range(0..states.len());
    }

    cache.weights.clear();
    for state in states {
        cache.weights.push(state.resource_rent.max(1e-6).powf(1.0 + config.shock_target_resource_bias));
    }

    let total: f64 = cache.weights.iter().sum();
    if total <= 1e-9 {
        return rng.gen_range(0..states.len());
    }

    let dist = WeightedIndex::new(&cache.weights).unwrap();
    dist.sample(rng)
}

#[derive(Debug, Clone)]
pub struct EvolveReport {
    pub shock_site: Option<usize>,
}

pub fn evolve_sites<R: Rng + ?Sized>(
    states: &mut [SiteState],
    config: &SimulationConfig,
    rng: &mut R,
    active_site: Option<usize>,
    step: Option<i32>,
    decay_matrix: &Array2<f64>,
    geographies: &Array1<f64>,
    cache: &mut SimulationCache,
) -> EvolveReport {
    calculate_all_network_bonuses(states, config, decay_matrix, cache);
    compute_all_rewards(states, config, geographies, cache);

    let n = states.len();
    let mean_reward = if n > 0 { cache.rewards.mean().unwrap_or(0.0) } else { 0.0 };
    
    let mut sum_sq = 0.0;
    for r in cache.rewards.iter() {
        sum_sq += (r - mean_reward).powi(2);
    }
    let variance = if n > 0 { sum_sq / n as f64 } else { 0.0 };
    let reward_scale = variance.sqrt().max(1.0);

    let target_log = (config.secondary_city_target.max(1.0) + 1.0).ln();
    let spread = (config.secondary_city_spread * 1.2).max(1e-3);

    for index in 0..n {
        let reward = cache.rewards[index];
        let network = cache.network_bonuses[index];
        let geography = geographies[index];
        
        let state = &mut states[index];
        let delta = reward - state.last_reward;

        if state.shock_memory > 0 {
            state.shock_memory -= 1;
        }

        let legacy_factor = state.shock_reform_stock;
        let transition_factor = if config.shock_transition_duration > 0 && state.post_shock_timer > 0 {
            state.post_shock_timer as f64 / config.shock_transition_duration.max(1) as f64
        } else {
            0.0
        };

        let readiness = if state.first_shock_step.is_some() {
            state.shock_readiness
        } else {
            institutional_readiness(
                state.institution.extraction,
                state.institution.openness,
                state.institution.adaptability,
                state.productive_capital,
            )
        };

        let readiness_scale = if config.shock_readiness_weight > 0.0 {
            config.shock_readiness_base + config.shock_readiness_weight * readiness
        } else {
            1.0
        };

        let transition_support = transition_factor * readiness_scale;
        let legacy_support = legacy_factor * if config.shock_readiness_weight > 0.0 {
            config.shock_legacy_readiness_base + config.shock_readiness_weight * readiness
        } else {
            1.0
        };

        let effective_adaptability = (
            state.institution.adaptability
            + config.shock_transition_adaptability_bonus * transition_support
            + config.shock_legacy_adaptability_bonus * legacy_support
        ).min(1.0);

        if state.institution.reform_timer == 0 {
            let shock_factor = if config.shock_reform_memory > 0 {
                state.shock_memory as f64 / config.shock_reform_memory.max(1) as f64
            } else {
                0.0
            };

            let crisis_pressure = sigmoid(
                (-delta) * config.reform_sensitivity
                + config.shock_reform_bonus * shock_factor
                + 2.0 * transition_factor
                + legacy_factor
            );

            let reform_probability = (effective_adaptability * crisis_pressure).min(1.0);

            if rng.gen::<f64>() < reform_probability {
                let reform_scale = 1.0 + config.shock_reform_step_bonus * shock_factor;
                state.institution.extraction = (state.institution.extraction - config.reform_step * reform_scale).max(0.0);
                state.institution.openness = (state.institution.openness + config.reform_openness_gain + config.shock_openness_bonus * shock_factor).min(1.0);
                state.institution.reform_timer = config.reform_duration;
                state.reforms_triggered += 1;
                state.productive_capital = (state.productive_capital + config.shock_capital_rebuild * shock_factor).min(1.5);
                
                if shock_factor > 0.0 || transition_factor > 0.0 {
                    state.shock_reform_stock = state.shock_reform_stock.max(
                        config.reform_openness_gain + 0.75 * readiness * shock_factor.max(transition_factor)
                    ).min(1.0);
                }
            } else {
                let curse_modifier = (
                    1.0
                    - config.curse_openness_buffer * state.institution.openness
                    - config.curse_capital_buffer * state.productive_capital.min(1.5)
                    - config.shock_transition_curse_buffer * transition_support
                    - config.shock_legacy_curse_buffer * legacy_support
                ).max(0.1);
                state.institution.extraction = (
                    state.institution.extraction
                    + config.resource_curse_strength * state.resource_rent * curse_modifier * (1.0 - state.institution.extraction)
                ).min(1.0);
            }
        } else {
            state.institution.reform_timer -= 1;
        }

        let mut extraction_cap = 1.0;
        if transition_factor > 0.0 {
            state.institution.extraction = (state.institution.extraction - config.shock_transition_extraction_decay * transition_support).max(0.0);
            extraction_cap = 1.0 - (1.0 - config.shock_transition_extraction_cap) * transition_support.min(1.0);
            state.institution.extraction = state.institution.extraction.min(extraction_cap);
            state.institution.openness = (
                state.institution.openness
                + (config.shock_transition_openness_gain + 0.45 * config.shock_lock_in_bonus * readiness) * transition_support
            ).min(1.0);
            state.productive_capital = (
                state.productive_capital
                + (config.shock_transition_capital_gain + 0.6 * config.shock_lock_in_bonus * readiness) * transition_support
            ).min(1.5);
            state.post_shock_timer -= 1;
        }
        
        if legacy_factor > 0.0 {
            state.institution.extraction = (state.institution.extraction - config.shock_legacy_extraction_decay * legacy_support).max(0.0);
            state.institution.openness = (
                state.institution.openness + (config.shock_legacy_openness_gain + 0.25 * config.shock_lock_in_bonus * readiness) * legacy_support
            ).min(1.0);
        }

        let capital_investment = 0.25 * config.inclusive_investment_gain * state.resource_rent * (1.0 - state.institution.extraction) * (
            0.4 + state.institution.openness + 0.25 * network
        );
        let capital_erosion = config.extractive_capital_erosion * state.institution.extraction * (0.35 + state.resource_rent);
        
        let passive_scale = if Some(index) == active_site { 1.0 } else { config.passive_investment_scale };
        
        state.productive_capital = (state.productive_capital + passive_scale * capital_investment + 0.015 * network - capital_erosion).max(0.0).min(1.5);

        if Some(index) == active_site {
            let active_steps = (state.population - 1).max(0) as f64;
            let mut activity_load = ((active_steps - config.active_decay_onset as f64) / (config.active_decay_onset.max(1) as f64)).max(0.0);
            if state.site.boomtown {
                activity_load *= state.site.boomtown_decay_multiplier;
            }
            let transition_brake = (1.0 - 1.5 * transition_support.min(1.0)).max(0.0);
            let legacy_brake = (1.0 - config.shock_legacy_extraction_brake * legacy_support).max(0.0);
            
            let extraction_pressure = config.active_extraction_pressure
                * transition_brake
                * legacy_brake
                * activity_load
                * state.resource_rent
                * state.institution.extraction.max(0.1)
                * (1.0 - state.institution.extraction);
                
            state.institution.extraction = (state.institution.extraction + extraction_pressure).min(1.0);
            if transition_factor > 0.0 {
                state.institution.extraction = state.institution.extraction.min(extraction_cap);
            }
            
            let depletion_pressure = config.active_resource_depletion
                * (0.6 + 0.4 * transition_brake)
                * activity_load
                * state.resource_rent
                * (0.35 + state.institution.extraction);
                
            state.resource_rent = (state.resource_rent * (1.0 - depletion_pressure)).max(0.0);
            state.institution.openness = (state.institution.openness - config.active_openness_drag * transition_brake * activity_load * state.institution.extraction).max(0.0);
        }

        if state.first_shock_step.is_some() && transition_factor <= 0.0 {
            let lock_in = config.shock_lock_in_bonus * readiness * state.productive_capital.min(1.0);
            let snapback = config.shock_snapback_pressure * (1.0 - readiness) * state.resource_rent * (1.0 - state.institution.openness);
            state.institution.extraction = (state.institution.extraction + snapback - lock_in).max(0.0).min(1.0);
            state.institution.openness = (state.institution.openness + 0.35 * lock_in - 0.15 * snapback).max(0.0).min(1.0);
        }

        state.institution.openness = (state.institution.openness + config.network_openness_influence * (network - state.institution.openness)).max(0.0).min(1.0);

        let reward_signal = (reward - mean_reward) / reward_scale;
        let pop_log = (state.population.max(1) as f64 + 1.0).ln();
        let mid_city_signal = (-((pop_log - target_log).powi(2)) / (2.0 * spread * spread)).exp();
        
        let overstretch_ratio = (state.population as f64 - config.metropolitan_overstretch_threshold).max(0.0) / config.metropolitan_overstretch_threshold.max(1.0);
        let structural_signal = geography + 0.45 * network + 0.35 * state.productive_capital;
        
        let growth_signal = reward_signal + config.growth_structural_weight * (structural_signal - 0.75) + 0.45 * (mid_city_signal - 0.35);
        let momentum_delta = config.endogenous_growth_rate * growth_signal - config.endogenous_decline_rate * overstretch_ratio;
        
        state.population_momentum = config.endogenous_growth_decay * state.population_momentum + momentum_delta;
        
        if legacy_factor > 0.0 && config.shock_legacy_fade > 0.0 {
            state.shock_reform_stock = (state.shock_reform_stock - config.shock_legacy_fade).max(0.0);
        }
        
        if state.first_shock_step.is_some() && state.institution.extraction < state.initial_extraction {
            state.post_shock_persistence += 1.0;
        }
        
        state.reward_delta = delta;
        state.last_reward = reward;
        state.cumulative_reward += reward;
    }

    cache.donor_candidates.clear();
    for (i, state) in states.iter().enumerate() {
        if state.population > 1 {
            cache.donor_candidates.push(i);
        }
    }
    
    if !cache.donor_candidates.is_empty() {
        let mut recipient = 0;
        let mut max_momentum = f64::NEG_INFINITY;
        for (i, state) in states.iter().enumerate() {
            if state.population_momentum > max_momentum {
                max_momentum = state.population_momentum;
                recipient = i;
            }
        }
        
        let mut donor = cache.donor_candidates[0];
        let mut min_momentum = f64::INFINITY;
        for &i in &cache.donor_candidates {
            if states[i].population_momentum < min_momentum {
                min_momentum = states[i].population_momentum;
                donor = i;
            }
        }
        
        let migration_threshold = config.migration_threshold;
        if recipient != donor 
            && states[recipient].population_momentum >= migration_threshold 
            && states[donor].population_momentum <= -migration_threshold 
        {
            states[recipient].population += 1;
            states[recipient].population_momentum -= migration_threshold;
            states[donor].population -= 1;
            states[donor].population_momentum += migration_threshold;
        }
    }

    let mut shock_site = None;
    if config.shock_probability > 0.0 && rng.gen::<f64>() < config.shock_probability {
        let choice = _choose_shock_target(states, config, rng, cache);
        states[choice].resource_rent = (states[choice].resource_rent * (1.0 - config.depletion_rate)).max(0.0);
        states[choice].productive_capital = (states[choice].productive_capital - 0.3 * config.depletion_rate).max(0.0);
        states[choice].shock_hits += 1;
        if states[choice].first_shock_step.is_none() {
            states[choice].first_shock_step = step;
        }
        states[choice].shock_memory = states[choice].shock_memory.max(config.shock_reform_memory);
        states[choice].post_shock_timer = states[choice].post_shock_timer.max(config.shock_transition_duration);
        
        if config.shock_reform_bonus > 0.0 {
            let readiness = states[choice].shock_readiness;
            let impulse = readiness;
            if impulse > 0.0 {
                states[choice].institution.adaptability = (states[choice].institution.adaptability + 0.35 * config.shock_transition_adaptability_bonus * impulse).min(1.0);
                states[choice].shock_reform_stock = (0.08 + 0.82 * impulse).max(states[choice].shock_reform_stock).min(1.0);
                states[choice].institution.extraction = (
                    states[choice].institution.extraction 
                    - 0.45 * config.reform_step * (1.0 + config.shock_reform_step_bonus) * (0.25 + impulse)
                    - 0.5 * config.shock_transition_extraction_decay * impulse
                ).max(0.0);
                states[choice].institution.openness = (states[choice].institution.openness + config.shock_openness_bonus * impulse).min(1.0);
                states[choice].productive_capital = (states[choice].productive_capital + config.shock_capital_rebuild * impulse).min(1.5);
                states[choice].reforms_triggered += 1;
                states[choice].institution.reform_timer = states[choice].institution.reform_timer.max((config.reform_duration / 2).max(1));
            }
        }
        shock_site = Some(choice);
    }

    EvolveReport {
        shock_site,
    }
}
