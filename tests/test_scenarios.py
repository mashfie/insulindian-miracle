from __future__ import annotations

from insulindian_miracle import SimulationConfig, apply_scenario, list_scenarios


def test_list_scenarios_exposes_named_experiments():
    names = {scenario.name for scenario in list_scenarios()}

    assert {
        "baseline",
        "resource-curse",
        "botswana",
        "open-cluster",
        "merchant-republic",
        "megacity-trap",
        "balanced-urban-system",
        "shock-reform",
        "ucb-bait",
    } <= names


def test_apply_scenario_overrides_resource_bias_and_networks():
    base = SimulationConfig()
    cursed = apply_scenario(base, "resource-curse")
    botswana = apply_scenario(base, "botswana")

    assert cursed.initial_extraction_resource_bias > botswana.initial_extraction_resource_bias
    assert botswana.network_scale > base.network_scale


def test_ucb_bait_scenario_enables_active_decay_pressures():
    base = SimulationConfig()
    bait = apply_scenario(base, "ucb-bait")

    assert bait.active_extraction_pressure > 0.0
    assert bait.active_resource_depletion > 0.0
    assert bait.active_extraction_pressure > base.active_extraction_pressure
    assert bait.boomtown_count == 1
    assert bait.boomtown_early_reward_bonus > 0.0
    assert bait.thompson_posterior_decay < 1.0


def test_shock_reform_scenario_enables_transition_regime():
    base = SimulationConfig()
    shock = apply_scenario(base, "shock-reform")

    assert shock.shock_transition_duration > 0
    assert shock.shock_transition_adaptability_bonus > 0.0
    assert shock.shock_transition_extraction_decay > 0.0
    assert shock.shock_transition_extraction_cap < 1.0
    assert shock.shock_legacy_fade > 0.0
    assert shock.shock_legacy_extraction_decay > 0.0
    assert shock.shock_readiness_weight > 0.0
    assert shock.shock_lock_in_bonus > 0.0
    assert shock.shock_snapback_pressure > 0.0


def test_merchant_republic_strengthens_trade_networks():
    base = SimulationConfig()
    merchant = apply_scenario(base, "merchant-republic")

    assert merchant.trade_cluster_count > 0
    assert merchant.network_scale > base.network_scale
    assert merchant.network_capital_gain > base.network_capital_gain
    assert merchant.resource_curse_strength < base.resource_curse_strength


def test_megacity_trap_hardens_metropolitan_overstretch():
    base = SimulationConfig()
    trap = apply_scenario(base, "megacity-trap")

    assert trap.secondary_city_bonus < base.secondary_city_bonus
    assert trap.secondary_city_spread < base.secondary_city_spread
    assert trap.metropolitan_overstretch_threshold < base.metropolitan_overstretch_threshold
    assert trap.metropolitan_overstretch_penalty > base.metropolitan_overstretch_penalty


def test_balanced_urban_system_supports_secondary_cities():
    base = SimulationConfig()
    balanced = apply_scenario(base, "balanced-urban-system")

    assert balanced.secondary_city_bonus > base.secondary_city_bonus
    assert balanced.secondary_city_spread > base.secondary_city_spread
    assert balanced.metropolitan_overstretch_penalty < base.metropolitan_overstretch_penalty
    assert balanced.network_scale > base.network_scale
