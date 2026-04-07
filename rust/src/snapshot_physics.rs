//! Reward / network helpers on `SiteStateSnapshot` slices (Whittle surrogate, myopic checks).

use crate::types::{SimulationConfig, SiteStateSnapshot};

pub fn network_bonus_snapshot(index: usize, states: &[SiteStateSnapshot], config: &SimulationConfig) -> f64 {
    if states.len() <= 1 {
        return 0.0;
    }
    let state = &states[index];
    let mut trade_mass = 0.0;
    let mut weight_sum = 0.0;
    for (other_index, other) in states.iter().enumerate() {
        if other_index == index {
            continue;
        }
        let dist = ((state.x - other.x).powi(2) + (state.y - other.y).powi(2))
            .sqrt()
            .max(1e-6);
        let decay = (-dist / config.network_scale).exp();
        let partner_scale = other.openness
            * (1.0 + config.network_population_gain * (other.population as f64).ln_1p())
            * (1.0 + config.network_capital_gain * other.productive_capital);
        trade_mass += partner_scale * decay;
        weight_sum += decay;
    }
    if weight_sum <= 1e-9 {
        return 0.0;
    }
    let local_density = weight_sum / ((states.len() - 1) as f64);
    let local_market = trade_mass / weight_sum;
    state.openness * local_market * (1.0 + config.network_density_gain * local_density)
}

/// Per-step reward for `index`, optionally evaluating as if `population_delta` extra residents were present.
pub fn compute_reward_snapshot(
    index: usize,
    states: &[SiteStateSnapshot],
    config: &SimulationConfig,
    population_delta: i32,
) -> f64 {
    let state = &states[index];
    let population = (state.population + population_delta).max(1);
    let pop_f = population as f64;
    let active_steps = (population - 1).max(0);

    let network = network_bonus_snapshot(index, states, config);
    let resource_payoff =
        state.resource_rent * (config.resource_base_payoff + config.resource_capture_gain * state.extraction);
    let extractive_cashflow = config.extractive_cashflow_premium
        * state.resource_rent
        * state.extraction
        * (0.55_f64).max(1.0 - 0.2 * state.productive_capital);
    let inclusive = (1.0 - state.extraction)
        * pop_f.powf(config.agglomeration_alpha)
        * (1.0 + config.inclusive_productivity_gain * state.productive_capital);
    let reinvestment_dividend = config.inclusive_investment_gain
        * state.resource_rent
        * (1.0 - state.extraction)
        * (0.45 + state.openness + 0.35 * state.productive_capital);
    let target_log = (config.secondary_city_target.max(1.0) + 1.0).ln();
    let spread = config.secondary_city_spread.max(1e-3);
    let mid_city_multiplier =
        (-(((pop_f + 1.0).ln() - target_log).powi(2)) / (2.0 * spread * spread)).exp();
    let secondary_city_dividend = config.secondary_city_bonus * network * mid_city_multiplier;
    let extractive_drag = state.extraction * config.extraction_drag * pop_f;
    let congestion = config.congestion * pop_f * pop_f;
    let overstretch = (pop_f - config.metropolitan_overstretch_threshold).max(0.0);
    let metropolitan_drag = config.metropolitan_overstretch_penalty * overstretch.powf(1.35);
    let reform_cost = if state.reform_timer > 0 {
        config.reform_cost
    } else {
        0.0
    };

    let mut boomtown_bonus = 0.0;
    if state.boomtown
        && state.boomtown_bonus_duration > 0
        && active_steps <= state.boomtown_bonus_duration
    {
        let remaining_window =
            1.0 - (active_steps as f64 / state.boomtown_bonus_duration.max(1) as f64);
        boomtown_bonus += state.boomtown_reward_bonus * remaining_window.max(0.25);
    }
    let mut collapse_penalty = 0.0;
    if state.boomtown && active_steps > state.boomtown_collapse_threshold {
        let overflow = active_steps - state.boomtown_collapse_threshold;
        collapse_penalty = state.boomtown_collapse_penalty * overflow as f64;
    }

    state.geography
        + resource_payoff
        + extractive_cashflow
        + inclusive
        + reinvestment_dividend
        + secondary_city_dividend
        - extractive_drag
        - congestion
        - metropolitan_drag
        + network
        - reform_cost
        + boomtown_bonus
        - collapse_penalty
}
