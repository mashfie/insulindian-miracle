//! Whittle-style index policy using a discretized surrogate (ported from Python `WhittleIndexPolicy`).

use crate::core::sigmoid;
use crate::policies::Policy;
use crate::snapshot_physics::{compute_reward_snapshot, network_bonus_snapshot};
use crate::types::{SimulationConfig, SiteStateSnapshot};
use std::collections::HashMap;

const POPULATION_BINS: &[f64] = &[1.0, 3.0, 6.0, 10.0, 16.0, 24.0];
const SHARE_BINS: &[f64] = &[0.15, 0.35, 0.55, 0.75];
const CAPITAL_BINS: &[f64] = &[0.15, 0.35, 0.65, 1.0];
const LEGACY_BINS: &[f64] = &[0.05, 0.2, 0.45, 0.7];
const GEOGRAPHY_BINS: &[f64] = &[0.12, 0.24, 0.36, 0.48, 0.62];
const NETWORK_REF_BINS: &[f64] = &[0.1, 0.3, 0.55, 0.85, 1.2];

#[derive(Clone)]
struct Observed {
    population: f64,
    extraction: f64,
    openness: f64,
    adaptability: f64,
    resource: f64,
    capital: f64,
    legacy: f64,
    geography: f64,
    network_reference: f64,
    boomtown: f64,
    trade_cluster: f64,
}

fn bin_value(value: f64, boundaries: &[f64]) -> usize {
    for (index, boundary) in boundaries.iter().enumerate() {
        if value <= *boundary {
            return index;
        }
    }
    boundaries.len()
}

fn representative_value(index: usize, boundaries: &[f64], minimum: f64, maximum: f64) -> f64 {
    let mut edges: Vec<f64> = Vec::with_capacity(boundaries.len() + 2);
    edges.push(minimum);
    edges.extend_from_slice(boundaries);
    edges.push(maximum);
    let i = index.min(boundaries.len());
    let lower = edges[i];
    let upper = edges[i + 1];
    if (lower - upper).abs() < 1e-12 {
        lower
    } else {
        0.5 * (lower + upper)
    }
}

fn population_value(index: usize) -> f64 {
    const REP: &[f64] = &[1.0, 2.0, 4.5, 8.0, 13.0, 20.0, 30.0];
    REP[index.min(REP.len() - 1)]
}

fn clamp(v: f64, lo: f64, hi: f64) -> f64 {
    v.max(lo).min(hi)
}

fn network_reference(index: usize, states: &[SiteStateSnapshot], config: &SimulationConfig) -> f64 {
    let state = &states[index];
    let denom = (state.openness
        * (1.0 + config.network_population_gain * (state.population as f64).ln_1p())
        * (1.0 + config.network_capital_gain * state.productive_capital))
    .max(1e-6);
    let nb = network_bonus_snapshot(index, states, config);
    clamp(nb / denom, 0.0, 1.6)
}

fn observed_from_snapshots(index: usize, states: &[SiteStateSnapshot], config: &SimulationConfig) -> Observed {
    let s = &states[index];
    Observed {
        population: s.population as f64,
        extraction: s.extraction,
        openness: s.openness,
        adaptability: s.adaptability,
        resource: s.resource_rent,
        capital: s.productive_capital,
        legacy: s.shock_reform_stock,
        geography: s.geography,
        network_reference: network_reference(index, states, config),
        boomtown: if s.boomtown { 1.0 } else { 0.0 },
        trade_cluster: if s.trade_cluster { 1.0 } else { 0.0 },
    }
}

fn encode_state_key(state: &Observed) -> Vec<usize> {
    vec![
        bin_value(state.population, POPULATION_BINS),
        bin_value(state.extraction, SHARE_BINS),
        bin_value(state.openness, SHARE_BINS),
        bin_value(state.adaptability, SHARE_BINS),
        bin_value(state.resource, SHARE_BINS),
        bin_value(state.capital, CAPITAL_BINS),
        bin_value(state.legacy, LEGACY_BINS),
        bin_value(state.geography, GEOGRAPHY_BINS),
        bin_value(state.network_reference, NETWORK_REF_BINS),
        if state.boomtown > 0.5 { 1 } else { 0 },
        if state.trade_cluster > 0.5 { 1 } else { 0 },
    ]
}

fn decode_state_key(key: &[usize]) -> Observed {
    Observed {
        population: population_value(key[0]),
        extraction: representative_value(key[1], SHARE_BINS, 0.0, 1.0),
        openness: representative_value(key[2], SHARE_BINS, 0.0, 1.0),
        adaptability: representative_value(key[3], SHARE_BINS, 0.0, 1.0),
        resource: representative_value(key[4], SHARE_BINS, 0.0, 1.0),
        capital: representative_value(key[5], CAPITAL_BINS, 0.0, 1.5),
        legacy: representative_value(key[6], LEGACY_BINS, 0.0, 1.0),
        geography: representative_value(key[7], GEOGRAPHY_BINS, 0.0, 0.8),
        network_reference: representative_value(key[8], NETWORK_REF_BINS, 0.0, 1.6),
        boomtown: key[9] as f64,
        trade_cluster: key[10] as f64,
    }
}

fn exact_state_key(state: &Observed) -> String {
    format!(
        "{:.2}|{:.3}|{:.3}|{:.3}|{:.3}|{:.3}|{:.3}|{:.3}|{:.3}|{}|{}",
        state.population,
        state.extraction,
        state.openness,
        state.adaptability,
        state.resource,
        state.capital,
        state.legacy,
        state.geography,
        state.network_reference,
        if state.boomtown > 0.5 { 1 } else { 0 },
        if state.trade_cluster > 0.5 { 1 } else { 0 },
    )
}

fn local_network(state: &Observed, population: f64, config: &SimulationConfig) -> f64 {
    state.network_reference
        * state.openness
        * (1.0 + config.network_population_gain * population.max(1.0).ln_1p())
        * (1.0 + config.network_capital_gain * state.capital)
}

fn surrogate_reward(state: &Observed, config: &SimulationConfig, active: bool) -> f64 {
    let population = state.population + if active { 1.0 } else { 0.0 };
    let extraction = state.extraction;
    let network = local_network(state, population, config);
    let resource_payoff =
        state.resource * (config.resource_base_payoff + config.resource_capture_gain * extraction);
    let extractive_cashflow = config.extractive_cashflow_premium
        * state.resource
        * extraction
        * (0.55_f64).max(1.0 - 0.2 * state.capital);
    let inclusive = (1.0 - extraction)
        * population.powf(config.agglomeration_alpha)
        * (1.0 + config.inclusive_productivity_gain * state.capital);
    let reinvestment_dividend = config.inclusive_investment_gain
        * state.resource
        * (1.0 - extraction)
        * (0.45 + state.openness + 0.35 * state.capital);
    let target_log = (config.secondary_city_target.max(1.0) + 1.0).ln();
    let spread = config.secondary_city_spread.max(1e-3);
    let mid_city_multiplier =
        (-(((population + 1.0).ln() - target_log).powi(2)) / (2.0 * spread * spread)).exp();
    let secondary_city_dividend = config.secondary_city_bonus * network * mid_city_multiplier;
    let path_dep = 0.12
        * state.geography
        * (population.ln_1p())
        * (0.6 + state.capital + 0.25 * state.network_reference);
    let extractive_drag = extraction * config.extraction_drag * population;
    let congestion = config.congestion * population * population;
    let overstretch = (population - config.metropolitan_overstretch_threshold).max(0.0);
    let metropolitan_drag = config.metropolitan_overstretch_penalty * overstretch.powf(1.35);
    let mut reward = state.geography
        + resource_payoff
        + extractive_cashflow
        + inclusive
        + reinvestment_dividend
        + secondary_city_dividend
        + path_dep
        - extractive_drag
        - congestion
        - metropolitan_drag
        + network;
    if state.trade_cluster > 0.5 {
        reward += 0.18 * network;
    }
    if state.boomtown > 0.5 && active {
        let active_steps = (population - 1.0).max(0.0);
        if config.boomtown_bonus_duration > 0 && active_steps <= config.boomtown_bonus_duration as f64 {
            let rem = 1.0 - active_steps / config.boomtown_bonus_duration.max(1) as f64;
            reward += config.boomtown_early_reward_bonus * rem.max(0.25);
        }
        if active_steps > config.boomtown_collapse_threshold as f64 {
            reward -= config.boomtown_collapse_penalty
                * (active_steps - config.boomtown_collapse_threshold as f64);
        }
    }
    reward
}

fn activity_load(population: f64, config: &SimulationConfig) -> f64 {
    let active_steps = (population - 1.0).max(0.0);
    ((active_steps - config.active_decay_onset as f64) / config.active_decay_onset.max(1) as f64).max(0.0)
}

fn transition(state: &Observed, config: &SimulationConfig, active: bool) -> Vec<usize> {
    let mut next = state.clone();
    next.population = clamp(state.population + if active { 1.0 } else { 0.0 }, 1.0, 42.0);
    let reform_signal = sigmoid(
        1.35 * state.adaptability + 2.1 * state.legacy + 0.35 * (1.0 - state.resource)
            + 0.25 * state.capital
            - 1.15 * state.extraction,
    );
    if reform_signal > 0.58 {
        next.extraction = clamp(
            state.extraction - config.reform_step * (0.65 + 0.7 * state.legacy),
            0.0,
            1.0,
        );
        next.openness = clamp(
            state.openness + 0.04 + 0.06 * state.legacy + 0.02 * state.trade_cluster,
            0.0,
            1.0,
        );
        next.capital = clamp(
            state.capital + 0.03 + 0.25 * config.shock_capital_rebuild * state.legacy,
            0.0,
            1.5,
        );
        next.adaptability = clamp(state.adaptability + 0.03 * state.legacy, 0.0, 1.0);
        if state.legacy > 0.0 {
            next.legacy = clamp(
                state.legacy.max(0.25 + 0.45 * reform_signal),
                0.0,
                1.0,
            );
        }
    } else {
        let curse_modifier = (1.0
            - config.curse_openness_buffer * state.openness
            - config.curse_capital_buffer * state.capital.min(1.5)
            - config.shock_transition_curse_buffer * state.legacy
            - config.shock_legacy_curse_buffer * state.legacy)
            .max(0.1);
        next.extraction = clamp(
            state.extraction
                + config.resource_curse_strength
                    * state.resource
                    * curse_modifier
                    * (1.0 - state.extraction),
            0.0,
            1.0,
        );
    }

    if active {
        let al = activity_load(next.population, config);
        let legacy_brake = (1.0 - config.shock_legacy_extraction_brake * state.legacy).max(0.0);
        next.extraction = clamp(
            next.extraction
                + config.active_extraction_pressure
                    * legacy_brake
                    * al
                    * state.resource
                    * next.extraction.max(0.1)
                    * (1.0 - next.extraction),
            0.0,
            1.0,
        );
        let depletion_mult = if state.boomtown > 0.5 {
            config.boomtown_decay_multiplier.max(1.0)
        } else {
            1.0
        };
        next.resource = clamp(
            state.resource
                * (1.0
                    - config.active_resource_depletion
                        * depletion_mult
                        * al
                        * state.resource
                        * (0.35 + next.extraction)),
            0.0,
            1.0,
        );
        next.openness = clamp(
            next.openness - config.active_openness_drag * legacy_brake * al * next.extraction,
            0.0,
            1.0,
        );
    } else {
        next.resource = clamp(
            state.resource * (1.0 - 0.2 * config.depletion_rate * state.legacy),
            0.0,
            1.0,
        );
    }

    next.extraction = clamp(
        next.extraction - config.shock_legacy_extraction_decay * state.legacy,
        0.0,
        1.0,
    );
    next.openness = clamp(
        next.openness + config.shock_legacy_openness_gain * state.legacy,
        0.0,
        1.0,
    );

    let network = local_network(&next, next.population, config);

    let capital_investment = 0.22
        * config.inclusive_investment_gain
        * next.resource
        * (1.0 - next.extraction)
        * (0.4 + next.openness + 0.2 * network);
    let capital_erosion =
        config.extractive_capital_erosion * next.extraction * (0.35 + next.resource);

    if active {
        let compounding = (0.015 + 0.04 * state.geography)
            * (1.0 - next.extraction)
            * (0.6 + state.trade_cluster + network.min(1.5));
        next.capital = clamp(next.capital + compounding, 0.0, 1.5);
        next.openness = clamp(
            next.openness + 0.01 * state.geography * (1.0 - next.extraction),
            0.0,
            1.0,
        );
    } else {
        let passive_drag = 0.012 * (next.extraction - next.openness).max(0.0);
        next.capital = clamp(next.capital - passive_drag, 0.0, 1.5);
        next.openness = clamp(next.openness - 0.5 * passive_drag, 0.0, 1.0);
    }
    next.capital = clamp(
        next.capital + capital_investment + 0.01 * network - capital_erosion,
        0.0,
        1.5,
    );
    next.legacy = clamp(next.legacy - config.shock_legacy_fade, 0.0, 1.0);
    encode_state_key(&next)
}

type ValueCacheKey = (Vec<usize>, i32, i64);

fn quantize_subsidy(s: f64) -> i64 {
    (s * 1_000_000.0).round() as i64
}

/// Matches Python `WhittleIndexPolicy.discount` (not `discounted_ucb_gamma`).
const WHITTLE_DISCOUNT: f64 = 0.92;

fn action_values(
    state_key: &[usize],
    subsidy: f64,
    depth: i32,
    config: &SimulationConfig,
    cache: &mut HashMap<ValueCacheKey, f64>,
    visited_stack: &mut Vec<ValueCacheKey>,
) -> (f64, f64) {
    let state = decode_state_key(state_key);
    let active_reward = surrogate_reward(&state, config, true);
    let passive_reward = surrogate_reward(&state, config, false) + subsidy;
    if depth <= 1 {
        return (active_reward, passive_reward);
    }
    let active_next = transition(&state, config, true);
    let passive_next = transition(&state, config, false);
    let active_tail = surrogate_value(&active_next, depth - 1, subsidy, config, cache, visited_stack);
    let passive_tail = surrogate_value(&passive_next, depth - 1, subsidy, config, cache, visited_stack);
    (
        active_reward + WHITTLE_DISCOUNT * active_tail,
        passive_reward + WHITTLE_DISCOUNT * passive_tail,
    )
}

fn surrogate_value(
    state_key: &[usize],
    depth: i32,
    subsidy: f64,
    config: &SimulationConfig,
    cache: &mut HashMap<ValueCacheKey, f64>,
    visited_stack: &mut Vec<ValueCacheKey>,
) -> f64 {
    if depth <= 0 {
        return 0.0;
    }
    let sk = (
        state_key.to_vec(),
        depth,
        quantize_subsidy(subsidy),
    );
    if let Some(v) = cache.get(&sk) {
        return *v;
    }
    if visited_stack.contains(&sk) {
        return 0.0;
    }
    visited_stack.push(sk.clone());
    let (av, pv) = action_values(state_key, subsidy, depth, config, cache, visited_stack);
    visited_stack.pop();
    let v = av.max(pv);
    cache.insert(sk, v);
    v
}

fn root_action_values(
    index: usize,
    states: &[SiteStateSnapshot],
    exact: &Observed,
    subsidy: f64,
    config: &SimulationConfig,
    cache: &mut HashMap<ValueCacheKey, f64>,
) -> (f64, f64) {
    let current_reward = compute_reward_snapshot(index, states, config, 0);
    let active_reward = compute_reward_snapshot(index, states, config, 1);
    let active_next = transition(exact, config, true);
    let passive_next = transition(exact, config, false);
    let mut visited = Vec::new();
    let rollout = 5;
    let active_tail = surrogate_value(
        &active_next,
        rollout - 1,
        subsidy,
        config,
        cache,
        &mut visited,
    );
    let mut visited2 = Vec::new();
    let passive_tail = surrogate_value(
        &passive_next,
        rollout - 1,
        subsidy,
        config,
        cache,
        &mut visited2,
    );
    (
        active_reward + WHITTLE_DISCOUNT * active_tail,
        current_reward + subsidy + WHITTLE_DISCOUNT * passive_tail,
    )
}

pub struct WhittleIndexPolicy {
    config: SimulationConfig,
    index_cache: HashMap<String, f64>,
}

impl WhittleIndexPolicy {
    pub fn new(_arm_count: usize, config: SimulationConfig) -> Self {
        Self {
            config,
            index_cache: HashMap::new(),
        }
    }

    fn compute_index(&mut self, index: usize, states: &[SiteStateSnapshot]) -> f64 {
        let exact = observed_from_snapshots(index, states, &self.config);
        let key = exact_state_key(&exact);
        if let Some(v) = self.index_cache.get(&key).copied() {
            return v;
        }
        let mut low = -6.0_f64;
        let mut high = 6.0_f64;
        for _ in 0..10 {
            let mid = 0.5 * (low + high);
            let mut cache: HashMap<ValueCacheKey, f64> = HashMap::new();
            let (active_value, passive_value) =
                root_action_values(index, states, &exact, mid, &self.config, &mut cache);
            if passive_value >= active_value {
                high = mid;
            } else {
                low = mid;
            }
        }
        let network_anchor = local_network(&exact, exact.population, &self.config);
        let core_premium = (exact.geography - 0.38).max(0.0);
        let spatial_anchor = 5.5 * exact.geography.powi(2)
            + 24.0 * core_premium * core_premium
            + 0.35 * network_anchor
            + 2.4 * exact.geography.powi(2) * exact.population.ln_1p()
            + 0.04 * exact.population.ln_1p().powi(2)
            - 0.04
                * (exact.population - self.config.metropolitan_overstretch_threshold)
                    .max(0.0)
                    .powf(1.2);
        let index_value = 0.5 * (low + high) + spatial_anchor;
        self.index_cache.insert(key, index_value);
        index_value
    }
}

impl Policy for WhittleIndexPolicy {
    fn wants_snapshots(&self) -> bool {
        true
    }

    fn select_site(&mut self, states: &[SiteStateSnapshot]) -> usize {
        let mut best_i = 0;
        let mut best = f64::NEG_INFINITY;
        for i in 0..states.len() {
            let idx = self.compute_index(i, states);
            if idx > best {
                best = idx;
                best_i = i;
            }
        }
        best_i
    }

    fn update(&mut self, _chosen_arm: usize, _reward: f64, _states: &[SiteStateSnapshot]) {}
}
