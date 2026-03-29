from __future__ import annotations

from insulindian_miracle import GaussianThompsonPolicy, SimulationConfig, run_experiment
from insulindian_miracle.model import SiteState, compute_reward, evolve_sites, initialize_site_states
from insulindian_miracle.policies import build_policy
from insulindian_miracle.sim import run_benchmark, run_simulation
from insulindian_miracle.terrain import Site


def test_gaussian_thompson_updates_precision():
    policy = GaussianThompsonPolicy(arm_count=2, seed=7)
    before = float(policy.precisions[0])
    policy.update(0, reward=1.5, states=[])
    after = float(policy.precisions[0])

    assert after > before


def test_reward_reflects_resource_short_run_lure():
    site = Site(
        id=0,
        x=0.5,
        y=0.5,
        port_access=0.2,
        river_access=0.2,
        arability=0.2,
        defensibility=0.2,
        accessibility=0.2,
        resource_rent=0.9,
        suitability=0.2,
    )
    config = SimulationConfig(num_sites=1, horizon=1)
    states = initialize_site_states([site], config, __import__("numpy").random.default_rng(3))
    low = compute_reward(0, states, config)
    states[0].institution.extraction = 0.95
    high = compute_reward(0, states, config)

    assert high > low


def test_build_policy_supports_whittle():
    config = SimulationConfig()
    policy = build_policy("whittle-index", arm_count=3, seed=7, config=config)

    assert policy.name == "whittle-index"


def test_build_policy_supports_new_policy_families():
    config = SimulationConfig()

    names = [
        "discounted-ucb",
        "sliding-window-ucb",
        "discounted-gaussian-thompson",
        "linucb",
        "linear-thompson",
    ]

    policies = [build_policy(name, arm_count=3, seed=7, config=config) for name in names]

    assert [policy.name for policy in policies] == names


def test_whittle_surrogate_prefers_stronger_site():
    sites = [
        Site(
            id=0,
            x=0.2,
            y=0.2,
            port_access=0.1,
            river_access=0.1,
            arability=0.1,
            defensibility=0.1,
            accessibility=0.1,
            resource_rent=0.7,
            suitability=0.2,
        ),
        Site(
            id=1,
            x=0.8,
            y=0.8,
            port_access=0.85,
            river_access=0.75,
            arability=0.7,
            defensibility=0.6,
            accessibility=0.85,
            resource_rent=0.35,
            suitability=0.9,
        ),
    ]
    config = SimulationConfig(num_sites=2, seed=7)
    rng = __import__("numpy").random.default_rng(7)
    states = initialize_site_states(sites, config, rng)
    states[0].institution.extraction = 0.85
    states[0].institution.openness = 0.15
    states[0].productive_capital = 0.1
    states[1].institution.extraction = 0.2
    states[1].institution.openness = 0.7
    states[1].productive_capital = 0.6

    policy = build_policy("whittle-index", arm_count=2, seed=7, config=config)

    assert policy.select_arm(states) == 1


def test_build_policy_supports_oracle():
    config = SimulationConfig()
    policy = build_policy("myopic-oracle", arm_count=3, seed=7, config=config)

    assert policy.name == "myopic-oracle"


def test_run_simulation_is_reproducible():
    config = SimulationConfig(horizon=15, num_sites=6, seed=13)
    first = run_simulation(config, policy_name="gaussian-thompson")
    second = run_simulation(config, policy_name="gaussian-thompson")

    assert first.cumulative_reward == second.cumulative_reward
    assert first.selected_sites == second.selected_sites


def test_new_policies_run_end_to_end():
    config = SimulationConfig(horizon=12, num_sites=6, seed=47)

    for policy_name in [
        "discounted-ucb",
        "sliding-window-ucb",
        "discounted-gaussian-thompson",
        "linucb",
        "linear-thompson",
    ]:
        result = run_simulation(config, policy_name=policy_name)
        assert len(result.selected_sites) == config.horizon
        assert len(result.site_outcomes) == config.num_sites


def test_run_simulation_reports_site_outcomes_and_metrics():
    config = SimulationConfig(horizon=18, num_sites=6, seed=17)
    result = run_simulation(config, policy_name="gaussian-thompson")

    assert len(result.site_outcomes) == 6
    assert result.site_outcomes[0].initial_productive_capital >= 0.0
    assert result.site_outcomes[0].final_adaptability >= 0.0
    assert result.site_outcomes[0].shock_readiness >= 0.0
    assert result.site_outcomes[0].post_shock_persistence >= 0.0
    assert "resource_population_correlation" in result.metrics
    assert "population_hhi" in result.metrics
    assert "mean_reforms_triggered" in result.metrics
    assert "mean_post_shock_persistence" in result.metrics


def test_active_extraction_can_deplete_resource_rents():
    config = SimulationConfig(
        horizon=8,
        num_sites=1,
        seed=23,
        active_extraction_pressure=0.2,
        active_resource_depletion=0.15,
    )
    result = run_simulation(config, policy_name="gaussian-thompson")

    outcome = result.site_outcomes[0]
    assert outcome.final_resource_rent < outcome.resource_rent


def test_run_simulation_records_selection_counts_and_first_shock_step():
    config = SimulationConfig(horizon=6, num_sites=1, seed=29, shock_probability=1.0, depletion_rate=0.05)
    result = run_simulation(config, policy_name="gaussian-thompson")

    outcome = result.site_outcomes[0]
    assert outcome.selection_count == config.horizon
    assert outcome.shock_hits == config.horizon
    assert outcome.first_shock_step == 0
    assert outcome.shock_readiness > 0.0


def test_endogenous_growth_can_raise_non_selected_populations():
    sites = [
        Site(
            id=0,
            x=0.2,
            y=0.2,
            port_access=0.05,
            river_access=0.05,
            arability=0.05,
            defensibility=0.05,
            accessibility=0.05,
            resource_rent=0.05,
            suitability=0.05,
        ),
        Site(
            id=1,
            x=0.8,
            y=0.8,
            port_access=0.9,
            river_access=0.8,
            arability=0.7,
            defensibility=0.6,
            accessibility=0.9,
            resource_rent=0.1,
            suitability=0.9,
        ),
    ]
    config = SimulationConfig(
        num_sites=2,
        horizon=8,
        seed=41,
        agglomeration_alpha=0.2,
        congestion=0.3,
        endogenous_growth_rate=0.6,
    )
    rng = __import__("numpy").random.default_rng(41)
    states = initialize_site_states(sites, config, rng)
    for state in states:
        state.institution.extraction = 0.1
        state.institution.openness = 0.85
        state.institution.adaptability = 0.0
        state.productive_capital = 0.8 if state.site.id == 1 else 0.1
    states[0].population = 6

    for step in range(config.horizon):
        evolve_sites(states, config, rng, active_site=None, step=step)

    assert states[1].population > 1


def test_forced_shock_sets_post_shock_transition_timer():
    site = Site(
        id=0,
        x=0.5,
        y=0.5,
        port_access=0.2,
        river_access=0.2,
        arability=0.2,
        defensibility=0.2,
        accessibility=0.2,
        resource_rent=0.9,
        suitability=0.2,
    )
    config = SimulationConfig(
        num_sites=1,
        horizon=2,
        shock_probability=1.0,
        shock_reform_bonus=2.0,
        shock_transition_duration=6,
    )
    rng = __import__("numpy").random.default_rng(7)
    states = initialize_site_states([site], config, rng)

    evolve_sites(states, config, rng, active_site=0, step=0)

    assert states[0].post_shock_timer == config.shock_transition_duration


def test_run_experiment_reports_summary_and_oracle_regret():
    config = SimulationConfig(horizon=24, num_sites=6, seed=5)
    payload = run_experiment(config, policies=["gaussian-thompson", "ucb1"], runs=2, scenario_name="resource-curse")

    assert payload["scenario"]["name"] == "resource-curse"
    assert payload["config"]["horizon"] == 420
    assert payload["oracle_policy"] == "myopic-oracle"
    assert set(payload["summary"]) == {"gaussian-thompson", "ucb1"}
    assert payload["summary"]["gaussian-thompson"]["runs"] == 2.0
    assert "mean_oracle_regret" in payload["summary"]["gaussian-thompson"]
    assert "mean_reforms_triggered" in payload["summary"]["gaussian-thompson"]


def test_ucb_bait_run_marks_a_boomtown_site():
    config = SimulationConfig(horizon=30, num_sites=8, seed=11)
    result = run_simulation(config, policy_name="ucb1", scenario_name="ucb-bait")

    assert any(outcome.boomtown for outcome in result.site_outcomes)
    assert result.metrics["boomtown_count"] == 1.0
    assert result.metrics["boomtown_selection_share"] >= 0.0


def test_open_cluster_run_marks_trade_cluster_sites():
    config = SimulationConfig(horizon=24, num_sites=8, seed=19)
    result = run_simulation(config, policy_name="gaussian-thompson", scenario_name="open-cluster")

    assert any(outcome.trade_cluster for outcome in result.site_outcomes)


def test_merchant_republic_run_marks_trade_cluster_sites():
    config = SimulationConfig(horizon=24, num_sites=8, seed=21)
    result = run_simulation(config, policy_name="linucb", scenario_name="merchant-republic")

    assert any(outcome.trade_cluster for outcome in result.site_outcomes)


def test_megacity_trap_increases_top_site_share_relative_to_balanced_system():
    config = SimulationConfig(horizon=40, num_sites=8, seed=59)
    trap = run_simulation(config, policy_name="whittle-index", scenario_name="megacity-trap")
    balanced = run_simulation(config, policy_name="whittle-index", scenario_name="balanced-urban-system")

    assert trap.metrics["top_site_share"] > balanced.metrics["top_site_share"]


def test_run_benchmark_returns_all_policies():
    scores = run_benchmark(seed=9)

    assert set(scores) == {
        "epsilon-greedy",
        "ucb1",
        "discounted-ucb",
        "sliding-window-ucb",
        "gaussian-thompson",
        "discounted-gaussian-thompson",
        "linucb",
        "linear-thompson",
        "whittle-index",
    }
