from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict
import json
import math
from pathlib import Path
from typing import Any

import numpy as np

from .model import SiteOutcome, SimulationConfig, SimulationResult, base_geography, evolve_sites, initialize_site_states
from .policies import build_policy
from .scenarios import apply_scenario, get_scenario
from .terrain import generate_terrain, select_candidate_sites


DEFAULT_POLICIES = [
    "epsilon-greedy",
    "ucb1",
    "discounted-ucb",
    "sliding-window-ucb",
    "gaussian-thompson",
    "discounted-gaussian-thompson",
    "linucb",
    "linear-thompson",
    "whittle-index",
]
ORACLE_POLICY = "myopic-oracle"


def _config_with_overrides(config: SimulationConfig, overrides: dict[str, Any] | None = None) -> SimulationConfig:
    if not overrides:
        return config
    payload = asdict(config)
    payload.update(overrides)
    return SimulationConfig.from_dict(payload)


def _terrain_summary(terrain) -> dict[str, float]:
    land = float(np.mean(terrain.land_mask))
    river = float(np.mean(terrain.river_mask))
    mean_elevation = float(np.mean(terrain.elevation[terrain.land_mask]))
    mean_resource = float(np.mean(terrain.resource_rent[terrain.land_mask]))
    return {
        "land_share": land,
        "river_share": river,
        "mean_land_elevation": mean_elevation,
        "mean_resource_rent": mean_resource,
    }


def _apply_boomtown_shape(sites, config: SimulationConfig) -> None:
    if config.boomtown_count <= 0 or not sites:
        return

    geography_scores = [base_geography(site, config) for site in sites]
    geography_cutoff = float(np.median(geography_scores))
    ranked = sorted(
        range(len(sites)),
        key=lambda index: (
            sites[index].resource_rent - geography_scores[index],
            sites[index].resource_rent,
            -geography_scores[index],
        ),
        reverse=True,
    )

    chosen: list[int] = []
    for index in ranked:
        if geography_scores[index] <= geography_cutoff:
            chosen.append(index)
        if len(chosen) >= config.boomtown_count:
            break
    if len(chosen) < config.boomtown_count:
        for index in ranked:
            if index not in chosen:
                chosen.append(index)
            if len(chosen) >= config.boomtown_count:
                break

    for index in chosen:
        site = sites[index]
        geography_factor = max(0.05, 1.0 - config.boomtown_geography_penalty)
        site.port_access *= geography_factor
        site.river_access *= geography_factor
        site.arability *= geography_factor
        site.defensibility *= geography_factor
        site.accessibility *= geography_factor
        site.resource_rent = min(1.0, site.resource_rent + config.boomtown_resource_bonus)
        site.suitability = min(1.0, site.suitability + 0.35 * config.boomtown_resource_bonus)
        site.boomtown = True
        site.boomtown_reward_bonus = config.boomtown_early_reward_bonus
        site.boomtown_bonus_duration = config.boomtown_bonus_duration
        site.boomtown_collapse_penalty = config.boomtown_collapse_penalty
        site.boomtown_collapse_threshold = config.boomtown_collapse_threshold
        site.boomtown_decay_multiplier = config.boomtown_decay_multiplier
        site.boomtown_initial_extraction_boost = config.boomtown_initial_extraction_boost


def _apply_trade_cluster_shape(sites, config: SimulationConfig) -> None:
    if config.trade_cluster_count <= 0 or not sites:
        return

    anchor = max(
        range(len(sites)),
        key=lambda index: (
            0.5 * sites[index].accessibility + 0.35 * sites[index].port_access + 0.15 * sites[index].river_access
            - 0.25 * sites[index].resource_rent
        ),
    )
    ranked = sorted(
        range(len(sites)),
        key=lambda index: (
            math.hypot(sites[index].x - sites[anchor].x, sites[index].y - sites[anchor].y),
            -(0.55 * sites[index].accessibility + 0.3 * sites[index].port_access + 0.15 * sites[index].river_access),
        ),
    )

    chosen: list[int] = []
    for index in ranked:
        distance = math.hypot(sites[index].x - sites[anchor].x, sites[index].y - sites[anchor].y)
        if distance <= config.trade_cluster_radius or index == anchor:
            chosen.append(index)
        if len(chosen) >= config.trade_cluster_count:
            break
    if len(chosen) < config.trade_cluster_count:
        for index in ranked:
            if index not in chosen:
                chosen.append(index)
            if len(chosen) >= config.trade_cluster_count:
                break

    for index in chosen:
        site = sites[index]
        site.trade_cluster = True
        site.trade_cluster_openness_bonus = config.trade_cluster_openness_bonus
        site.trade_cluster_capital_bonus = config.trade_cluster_capital_bonus
        site.accessibility = min(1.0, site.accessibility + config.trade_cluster_accessibility_bonus)
        site.port_access = min(1.0, site.port_access + 0.5 * config.trade_cluster_accessibility_bonus)
        site.suitability = min(1.0, site.suitability + 0.15 * config.trade_cluster_accessibility_bonus)


def _seeded_config(config: SimulationConfig, offset: int) -> SimulationConfig:
    return SimulationConfig.from_dict(
        {
            **asdict(config),
            "terrain": {**asdict(config.terrain), "seed": config.terrain.seed + offset},
            "seed": config.seed + offset,
        }
    )


def _safe_correlation(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or len(left) < 2:
        return 0.0
    left_array = np.asarray(left, dtype=float)
    right_array = np.asarray(right, dtype=float)
    if np.allclose(left_array, left_array[0]) or np.allclose(right_array, right_array[0]):
        return 0.0
    return float(np.corrcoef(left_array, right_array)[0, 1])


def _gini(values: list[float]) -> float:
    array = np.sort(np.asarray(values, dtype=float))
    total = float(array.sum())
    if array.size == 0 or math.isclose(total, 0.0):
        return 0.0
    ranks = np.arange(1, array.size + 1, dtype=float)
    return float((2.0 * np.dot(ranks, array)) / (array.size * total) - (array.size + 1.0) / array.size)


def _zipf_slope(populations: list[float]) -> float:
    positive = sorted((value for value in populations if value > 0.0), reverse=True)
    if len(positive) < 2:
        return 0.0
    tail_count = max(3, min(len(positive), max(3, len(positive) // 3)))
    tail = positive[:tail_count]
    ranks = np.arange(1, len(tail) + 1, dtype=float)
    slope, _intercept = np.polyfit(np.log(ranks), np.log(np.asarray(tail, dtype=float)), 1)
    return float(slope)


def _selection_hhi(selected_sites: list[int], site_count: int) -> float:
    if not selected_sites:
        return 0.0
    counts = np.bincount(selected_sites, minlength=site_count).astype(float)
    weights = counts / counts.sum()
    return float(np.square(weights).sum())


def _selection_counts(selected_sites: list[int], site_count: int) -> np.ndarray:
    if site_count <= 0:
        return np.array([], dtype=int)
    return np.bincount(selected_sites, minlength=site_count).astype(int)


def _build_site_outcomes(
    states,
    initial_snapshots: dict[int, dict[str, float]],
    selected_sites: list[int],
    config: SimulationConfig,
) -> list[SiteOutcome]:
    outcomes: list[SiteOutcome] = []
    selection_counts = _selection_counts(selected_sites, len(states))
    for state in states:
        initial = initial_snapshots[state.site.id]
        outcomes.append(
            SiteOutcome(
                site_id=state.site.id,
                x=state.site.x,
                y=state.site.y,
                boomtown=state.site.boomtown,
                trade_cluster=state.site.trade_cluster,
                geography=base_geography(state.site, config),
                suitability=state.site.suitability,
                resource_rent=initial["resource_rent"],
                final_resource_rent=state.resource_rent,
                productive_capital=state.productive_capital,
                initial_productive_capital=state.initial_productive_capital,
                initial_extraction=initial["extraction"],
                final_extraction=state.institution.extraction,
                initial_openness=initial["openness"],
                final_openness=state.institution.openness,
                initial_adaptability=initial["adaptability"],
                final_adaptability=state.institution.adaptability,
                shock_readiness=state.shock_readiness,
                post_shock_persistence=state.post_shock_persistence,
                final_population=state.population,
                cumulative_reward=state.cumulative_reward,
                selection_count=int(selection_counts[state.site.id]) if selection_counts.size else 0,
                reforms_triggered=state.reforms_triggered,
                shock_hits=state.shock_hits,
                first_shock_step=state.first_shock_step,
            )
        )
    outcomes.sort(key=lambda outcome: outcome.site_id)
    return outcomes


def _result_metrics(site_outcomes: list[SiteOutcome], selected_sites: list[int]) -> dict[str, float]:
    populations = [float(outcome.final_population) for outcome in site_outcomes]
    extractions = [outcome.final_extraction for outcome in site_outcomes]
    initial_extractions = [outcome.initial_extraction for outcome in site_outcomes]
    openness = [outcome.final_openness for outcome in site_outcomes]
    resources = [outcome.resource_rent for outcome in site_outcomes]
    final_resources = [outcome.final_resource_rent for outcome in site_outcomes]
    productive_capital = [outcome.productive_capital for outcome in site_outcomes]
    final_adaptability = [outcome.final_adaptability for outcome in site_outcomes]
    geographies = [outcome.geography for outcome in site_outcomes]
    reforms = [float(outcome.reforms_triggered) for outcome in site_outcomes]
    shocks = [float(outcome.shock_hits) for outcome in site_outcomes]
    readiness = [outcome.shock_readiness for outcome in site_outcomes]
    persistence = [outcome.post_shock_persistence for outcome in site_outcomes]
    boomtown_indices = [index for index, outcome in enumerate(site_outcomes) if outcome.boomtown]

    total_population = float(sum(populations))
    population_weights = np.asarray(populations, dtype=float) / max(total_population, 1.0)
    max_resource_index = int(np.argmax(resources)) if resources else 0
    selection_counts = np.bincount(selected_sites, minlength=len(site_outcomes)).astype(float) if site_outcomes else np.array([], dtype=float)
    total_selections = float(selection_counts.sum())

    return {
        "mean_final_extraction": float(np.mean(extractions)) if extractions else 0.0,
        "mean_final_openness": float(np.mean(openness)) if openness else 0.0,
        "mean_final_adaptability": float(np.mean(final_adaptability)) if final_adaptability else 0.0,
        "mean_final_resource_rent": float(np.mean(final_resources)) if final_resources else 0.0,
        "mean_productive_capital": float(np.mean(productive_capital)) if productive_capital else 0.0,
        "mean_reforms_triggered": float(np.mean(reforms)) if reforms else 0.0,
        "mean_shock_hits": float(np.mean(shocks)) if shocks else 0.0,
        "mean_shock_readiness": float(np.mean(readiness)) if readiness else 0.0,
        "mean_post_shock_persistence": float(np.mean(persistence)) if persistence else 0.0,
        "top_site_share": float(max(populations) / total_population) if total_population > 0.0 else 0.0,
        "population_hhi": float(np.square(population_weights).sum()) if population_weights.size else 0.0,
        "population_gini": _gini(populations),
        "selection_hhi": _selection_hhi(selected_sites, len(site_outcomes)),
        "zipf_slope": _zipf_slope(populations),
        "resource_population_correlation": _safe_correlation(resources, populations),
        "resource_extraction_correlation": _safe_correlation(resources, extractions),
        "resource_reform_correlation": _safe_correlation(resources, reforms),
        "resource_capital_correlation": _safe_correlation(resources, productive_capital),
        "initial_extraction_population_correlation": _safe_correlation(initial_extractions, populations),
        "geography_population_correlation": _safe_correlation(geographies, populations),
        "top_resource_site_share": float(populations[max_resource_index] / total_population) if total_population > 0.0 and populations else 0.0,
        "top_resource_selection_share": float(selection_counts[max_resource_index] / total_selections) if total_selections > 0.0 and selection_counts.size else 0.0,
        "top_resource_reforms_triggered": float(reforms[max_resource_index]) if reforms else 0.0,
        "top_resource_shock_hits": float(shocks[max_resource_index]) if shocks else 0.0,
        "boomtown_count": float(len(boomtown_indices)),
        "boomtown_selection_share": float(selection_counts[boomtown_indices].sum() / total_selections) if total_selections > 0.0 and boomtown_indices else 0.0,
        "boomtown_population_share": float(sum(populations[index] for index in boomtown_indices) / total_population) if total_population > 0.0 and boomtown_indices else 0.0,
        "boomtown_final_resource_rent": float(np.mean([final_resources[index] for index in boomtown_indices])) if boomtown_indices else 0.0,
    }


def _aggregate_results(results: list[SimulationResult], oracle_results: list[SimulationResult] | None = None) -> dict[str, float]:
    cumulative_rewards = [result.cumulative_reward for result in results]
    summary = {
        "runs": float(len(results)),
        "mean_cumulative_reward": float(np.mean(cumulative_rewards)) if cumulative_rewards else 0.0,
        "std_cumulative_reward": float(np.std(cumulative_rewards)) if cumulative_rewards else 0.0,
    }

    metric_keys = sorted({key for result in results for key in result.metrics})
    for key in metric_keys:
        metric_values = [result.metrics[key] for result in results]
        summary_key = key if key.startswith("mean_") else f"mean_{key}"
        summary[summary_key] = float(np.mean(metric_values))

    if oracle_results is not None and results:
        regrets = [oracle.cumulative_reward - result.cumulative_reward for result, oracle in zip(results, oracle_results, strict=True)]
        summary["mean_oracle_regret"] = float(np.mean(regrets))
        summary["std_oracle_regret"] = float(np.std(regrets))
        oracle_rewards = [oracle.cumulative_reward for oracle in oracle_results]
        summary["mean_oracle_reward"] = float(np.mean(oracle_rewards))

    return summary


def _prepare_world(config: SimulationConfig) -> tuple[Any, Any, list[Any]]:
    terrain = generate_terrain(config.terrain)
    sites = select_candidate_sites(terrain, count=config.num_sites, min_spacing=config.min_site_spacing)
    _apply_trade_cluster_shape(sites, config)
    _apply_boomtown_shape(sites, config)
    if not sites:
        raise ValueError("Terrain generation produced no viable sites.")
    return terrain, sites


def _run_policy_on_sites(
    config: SimulationConfig,
    terrain,
    sites,
    policy_name: str,
) -> SimulationResult:
    working_sites = deepcopy(sites)
    rng = np.random.default_rng(config.seed)
    states = initialize_site_states(working_sites, config, rng)
    initial_snapshots = {
        state.site.id: {
            "extraction": state.institution.extraction,
            "openness": state.institution.openness,
            "adaptability": state.institution.adaptability,
            "resource_rent": state.resource_rent,
        }
        for state in states
    }
    policy = build_policy(policy_name, len(states), config.seed, config)

    selected_sites: list[int] = []
    reward_history: list[float] = []
    cumulative_reward = 0.0
    for step in range(config.horizon):
        chosen = policy.select_arm(states)
        states[chosen].population += 1
        evolve_report = evolve_sites(states, config, rng, active_site=chosen, step=step)
        reward = evolve_report.rewards[chosen]
        policy.update(chosen, reward, states)
        selected_sites.append(chosen)
        reward_history.append(reward)
        cumulative_reward += reward

    site_outcomes = _build_site_outcomes(states, initial_snapshots, selected_sites, config)
    metrics = _result_metrics(site_outcomes, selected_sites)
    return SimulationResult(
        policy=policy.name,
        seed=config.seed,
        cumulative_reward=cumulative_reward,
        selected_sites=selected_sites,
        reward_history=reward_history,
        population_by_site={state.site.id: state.population for state in states},
        final_extraction_by_site={state.site.id: state.institution.extraction for state in states},
        final_openness_by_site={state.site.id: state.institution.openness for state in states},
        site_outcomes=site_outcomes,
        metrics=metrics,
        terrain_summary=_terrain_summary(terrain),
    )


def run_simulation(
    config: SimulationConfig,
    policy_name: str = "gaussian-thompson",
    scenario_name: str | None = None,
) -> SimulationResult:
    active_config = apply_scenario(config, scenario_name)
    terrain, sites = _prepare_world(active_config)
    return _run_policy_on_sites(active_config, terrain, sites, policy_name)


def run_policy_comparison(
    config: SimulationConfig,
    policies: list[str],
    scenario_name: str = "baseline",
    scenario_overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not policies:
        raise ValueError("Comparison requires at least one policy.")
    if len(policies) > 3:
        raise ValueError("Comparison supports at most three policies.")

    scenario_key = scenario_name or "baseline"
    scenario = get_scenario(scenario_key)
    active_config = _config_with_overrides(apply_scenario(config, scenario_key), scenario_overrides)
    terrain, sites = _prepare_world(active_config)

    oracle = _run_policy_on_sites(active_config, terrain, sites, ORACLE_POLICY)
    oracle_reward = oracle.cumulative_reward

    results = []
    for policy in policies:
        result = _run_policy_on_sites(active_config, terrain, sites, policy)
        d = result.to_dict()
        d["oracle_regret"] = float(oracle_reward - result.cumulative_reward)
        results.append(d)

    return {
        "scenario": scenario.to_dict(),
        "config": asdict(active_config),
        "terrain_summary": _terrain_summary(terrain),
        "sites": [asdict(site) for site in sites],
        "oracle_reward": oracle_reward,
        "results": results,
    }


def run_sweep(
    config: SimulationConfig,
    policies: list[str],
    runs: int,
    scenario_name: str | None = None,
) -> dict[str, list[dict[str, Any]]]:
    base_config = apply_scenario(config, scenario_name)
    output: dict[str, list[dict[str, Any]]] = {}
    for policy in policies:
        output[policy] = []
        for offset in range(runs):
            result = run_simulation(_seeded_config(base_config, offset), policy_name=policy)
            output[policy].append(result.to_dict())
    return output


def run_experiment(
    config: SimulationConfig,
    policies: list[str] | None = None,
    runs: int = 12,
    scenario_name: str = "baseline",
    scenario_overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    policy_list = policies or list(DEFAULT_POLICIES)
    scenario = get_scenario(scenario_name)
    base_config = _config_with_overrides(apply_scenario(config, scenario_name), scenario_overrides)

    oracle_results: list[SimulationResult] = []
    seeded_configs = [_seeded_config(base_config, offset) for offset in range(runs)]
    for seeded_config in seeded_configs:
        oracle_results.append(run_simulation(seeded_config, policy_name=ORACLE_POLICY))

    results: dict[str, list[dict[str, Any]]] = {}
    summary: dict[str, dict[str, float]] = {}
    for policy in policy_list:
        policy_results = [run_simulation(seeded_config, policy_name=policy) for seeded_config in seeded_configs]
        results[policy] = [result.to_dict() for result in policy_results]
        summary[policy] = _aggregate_results(policy_results, oracle_results)

    return {
        "scenario": scenario.to_dict(),
        "config": asdict(base_config),
        "runs": runs,
        "policies": policy_list,
        "oracle_policy": ORACLE_POLICY,
        "oracle_summary": _aggregate_results(oracle_results),
        "summary": summary,
        "results": results,
    }


def run_benchmark(seed: int = 7, scenario_name: str = "baseline") -> dict[str, float]:
    config = SimulationConfig(seed=seed, horizon=220, num_sites=10, shock_probability=0.01)
    active_config = apply_scenario(config, scenario_name)
    scores: dict[str, float] = {}
    for policy in DEFAULT_POLICIES:
        result = run_simulation(active_config, policy_name=policy)
        scores[policy] = result.cumulative_reward
    return scores


def write_json(path: str | Path, payload: Any) -> None:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
