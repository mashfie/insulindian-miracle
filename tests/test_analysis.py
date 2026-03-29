from __future__ import annotations

from insulindian_miracle import SimulationConfig, run_hypothesis_suite


def test_run_hypothesis_suite_emits_all_hypotheses_and_pairwise_comparisons():
    config = SimulationConfig(horizon=18, num_sites=5, seed=31)
    payload = run_hypothesis_suite(config, runs=2)

    assert payload["runs"] == 2
    assert set(payload["hypotheses"]) == {"H1", "H2", "H3", "H5", "H6", "H7"}
    assert {"baseline", "resource-curse", "botswana", "open-cluster", "ucb-bait"} <= set(payload["scenarios"])
    assert "ucb1__minus__gaussian-thompson" in payload["pairwise_policy_comparisons"]["baseline"]
    assert payload["hypotheses"]["H1"]["status"] in {"supported", "mixed", "not_supported"}
    assert "resource_curse_threshold_interaction_beta" in payload["hypotheses"]["H2"]["evidence"]
    assert payload["hypotheses"]["H7"]["scenario"] == "ucb-bait"
    assert "policy_mean_curve_slopes" in payload["hypotheses"]["H6"]["evidence"]


def test_run_hypothesis_suite_can_include_raw_experiments():
    config = SimulationConfig(horizon=12, num_sites=4, seed=37)
    payload = run_hypothesis_suite(config, runs=1, include_experiments=True)

    assert "experiments" in payload
    assert payload["experiments"]["baseline"]["results"]["ucb1"][0]["site_outcomes"][0]["selection_count"] >= 0
    assert "trade_cluster" in payload["experiments"]["open-cluster"]["results"]["gaussian-thompson"][0]["site_outcomes"][0]


def test_run_hypothesis_suite_can_limit_scenarios_for_targeted_analysis():
    config = SimulationConfig(horizon=12, num_sites=4, seed=53)
    payload = run_hypothesis_suite(
        config,
        policies=["gaussian-thompson"],
        runs=1,
        scenario_names=["baseline", "shock-reform"],
    )

    assert set(payload["scenario_names"]) == {"baseline", "shock-reform"}
    assert set(payload["scenarios"]) == {"baseline", "shock-reform"}
    assert set(payload["hypotheses"]) == {"H6"}
