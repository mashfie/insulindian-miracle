from __future__ import annotations

from insulindian_miracle import SimulationConfig, apply_scenario, list_scenarios


def test_list_scenarios_exposes_named_experiments():
    names = {scenario.name for scenario in list_scenarios()}

    assert {"baseline", "resource-curse", "botswana", "open-cluster", "shock-reform", "ucb-bait"} <= names


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
