from __future__ import annotations

from dataclasses import asdict
import math
from typing import Any

import numpy as np

from .model import SimulationConfig
from .sim import DEFAULT_POLICIES, run_experiment


HYPOTHESIS_SCENARIOS = ("baseline", "resource-curse", "botswana", "open-cluster", "ucb-bait")
HYPOTHESIS_REQUIREMENTS = {
    "H1": ("resource-curse",),
    "H2": ("resource-curse", "botswana"),
    "H3": ("baseline", "open-cluster"),
    "H5": HYPOTHESIS_SCENARIOS,
    "H6": ("baseline",),
    "H7": ("ucb-bait",),
}


def _as_float_array(values: list[float] | np.ndarray) -> np.ndarray:
    if isinstance(values, np.ndarray):
        return values.astype(float)
    return np.asarray(values, dtype=float)


def _series_stats(values: list[float] | np.ndarray) -> dict[str, float | int]:
    array = _as_float_array(values)
    if array.size == 0:
        return {
            "n": 0,
            "mean": 0.0,
            "std": 0.0,
            "sem": 0.0,
            "ci95_low": 0.0,
            "ci95_high": 0.0,
        }
    mean = float(np.mean(array))
    std = float(np.std(array))
    sem = float(std / math.sqrt(array.size)) if array.size > 1 else 0.0
    margin = 1.96 * sem
    return {
        "n": int(array.size),
        "mean": mean,
        "std": std,
        "sem": sem,
        "ci95_low": mean - margin,
        "ci95_high": mean + margin,
    }


def _paired_stats(left: list[float] | np.ndarray, right: list[float] | np.ndarray) -> dict[str, float | int]:
    left_array = _as_float_array(left)
    right_array = _as_float_array(right)
    if left_array.size != right_array.size:
        raise ValueError("Paired comparisons require equal-length samples.")
    diff_stats = _series_stats(left_array - right_array)
    ties = np.isclose(left_array, right_array)
    return {
        **diff_stats,
        "left_mean": float(np.mean(left_array)) if left_array.size else 0.0,
        "right_mean": float(np.mean(right_array)) if right_array.size else 0.0,
        "win_rate": float(np.mean(left_array > right_array)) if left_array.size else 0.0,
        "loss_rate": float(np.mean(left_array < right_array)) if left_array.size else 0.0,
        "tie_rate": float(np.mean(ties)) if left_array.size else 0.0,
    }


def _policy_metric(experiment: dict[str, Any], policy: str, metric_key: str, *, summary: bool = False) -> list[float]:
    if summary:
        summary_key = metric_key if metric_key.startswith("mean_") else f"mean_{metric_key}"
        return [float(experiment["summary"][policy][summary_key])]
    return [float(run["metrics"][metric_key]) for run in experiment["results"][policy]]


def _policy_rewards(experiment: dict[str, Any], policy: str) -> list[float]:
    return [float(run["cumulative_reward"]) for run in experiment["results"][policy]]


def _collect_site_rows(experiment: dict[str, Any], policies: list[str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for policy in policies:
        for run in experiment["results"][policy]:
            seed = int(run["seed"])
            for outcome in run["site_outcomes"]:
                rows.append({**outcome, "policy": policy, "seed": seed})
    return rows


def _standardize(values: np.ndarray) -> np.ndarray:
    array = _as_float_array(values)
    if array.size == 0:
        return array
    std = float(np.std(array))
    if math.isclose(std, 0.0):
        return np.zeros_like(array, dtype=float)
    return (array - float(np.mean(array))) / std


def _dummy_columns(labels: list[Any]) -> list[np.ndarray]:
    if len(labels) <= 1:
        return []
    ordered = sorted({str(label) for label in labels})
    if len(ordered) <= 1:
        return []
    columns: list[np.ndarray] = []
    for label in ordered[1:]:
        columns.append(np.asarray([1.0 if str(value) == label else 0.0 for value in labels], dtype=float))
    return columns


def _interaction_beta(rows: list[dict[str, Any]], *, controlled: bool = False) -> float:
    if len(rows) < 4:
        return 0.0
    resource = _standardize(np.asarray([row["resource_rent"] for row in rows], dtype=float))
    extraction = _standardize(np.asarray([row["initial_extraction"] for row in rows], dtype=float))
    population = _standardize(np.asarray([row["final_population"] for row in rows], dtype=float))
    design_columns: list[np.ndarray] = [
        np.ones(len(rows), dtype=float),
        resource,
        extraction,
        resource * extraction,
    ]
    if controlled:
        geography = _standardize(np.asarray([row["geography"] for row in rows], dtype=float))
        suitability = _standardize(np.asarray([row["suitability"] for row in rows], dtype=float))
        design_columns.extend((geography, suitability))
        design_columns.extend(_dummy_columns([row["policy"] for row in rows]))
        design_columns.extend(_dummy_columns([row["seed"] for row in rows]))
    design = np.column_stack(design_columns)
    coefficients, *_ = np.linalg.lstsq(design, population, rcond=None)
    return float(coefficients[3])


def _threshold_interaction_beta(rows: list[dict[str, Any]], *, controlled: bool = False) -> float:
    if len(rows) < 4:
        return 0.0
    resources = np.asarray([row["resource_rent"] for row in rows], dtype=float)
    extractions = np.asarray([row["initial_extraction"] for row in rows], dtype=float)
    population = _standardize(np.asarray([row["final_population"] for row in rows], dtype=float))
    high_resource_threshold = float(np.quantile(resources, 0.75))
    high_extraction_threshold = float(np.quantile(extractions, 0.5))
    high_resource = np.asarray(resources >= high_resource_threshold, dtype=float)
    high_extraction = np.asarray(extractions >= high_extraction_threshold, dtype=float)
    design_columns: list[np.ndarray] = [
        np.ones(len(rows), dtype=float),
        high_resource,
        high_extraction,
        high_resource * high_extraction,
    ]
    if controlled:
        geography = _standardize(np.asarray([row["geography"] for row in rows], dtype=float))
        suitability = _standardize(np.asarray([row["suitability"] for row in rows], dtype=float))
        design_columns.extend((geography, suitability))
        design_columns.extend(_dummy_columns([row["policy"] for row in rows]))
        design_columns.extend(_dummy_columns([row["seed"] for row in rows]))
    design = np.column_stack(design_columns)
    coefficients, *_ = np.linalg.lstsq(design, population, rcond=None)
    return float(coefficients[3])


def _group_mean(values: list[float]) -> float:
    return float(np.mean(np.asarray(values, dtype=float))) if values else 0.0


def _conditional_group_summary(rows: list[dict[str, Any]]) -> dict[str, float]:
    if not rows:
        return {
            "high_resource_low_extraction_mean_population": 0.0,
            "high_resource_high_extraction_mean_population": 0.0,
            "low_minus_high_extraction_gap": 0.0,
            "high_resource_low_extraction_count": 0.0,
            "high_resource_high_extraction_count": 0.0,
        }

    resources = np.asarray([row["resource_rent"] for row in rows], dtype=float)
    extractions = np.asarray([row["initial_extraction"] for row in rows], dtype=float)
    populations = np.asarray([row["final_population"] for row in rows], dtype=float)
    high_resource_threshold = float(np.quantile(resources, 0.75))
    low_extraction_threshold = float(np.quantile(extractions, 0.25))
    high_extraction_threshold = float(np.quantile(extractions, 0.75))

    low_mask = (resources >= high_resource_threshold) & (extractions <= low_extraction_threshold)
    high_mask = (resources >= high_resource_threshold) & (extractions >= high_extraction_threshold)
    low_values = populations[low_mask].tolist()
    high_values = populations[high_mask].tolist()
    low_mean = _group_mean(low_values)
    high_mean = _group_mean(high_values)
    return {
        "high_resource_low_extraction_mean_population": low_mean,
        "high_resource_high_extraction_mean_population": high_mean,
        "low_minus_high_extraction_gap": low_mean - high_mean,
        "high_resource_low_extraction_count": float(len(low_values)),
        "high_resource_high_extraction_count": float(len(high_values)),
    }


def _cluster_scores(site_rows: list[dict[str, Any]]) -> np.ndarray:
    if len(site_rows) <= 1:
        return np.zeros(len(site_rows), dtype=float)
    points = np.asarray([[row["x"], row["y"]] for row in site_rows], dtype=float)
    openness = np.asarray([row["final_openness"] for row in site_rows], dtype=float)
    distances = np.linalg.norm(points[:, None, :] - points[None, :, :], axis=2)
    mask = distances > 0.0
    if np.any(mask):
        bandwidth = float(np.median(distances[mask]))
    else:
        bandwidth = 0.2
    bandwidth = max(bandwidth, 1e-3)
    weights = np.exp(-distances / bandwidth)
    np.fill_diagonal(weights, 0.0)
    totals = weights.sum(axis=1)
    exposure = np.divide(weights @ openness, totals, out=np.zeros_like(openness), where=totals > 0.0)
    return openness * exposure


def _cluster_premium(site_rows: list[dict[str, Any]]) -> float:
    if len(site_rows) < 4:
        return 0.0
    scores = _cluster_scores(site_rows)
    populations = np.asarray([row["final_population"] for row in site_rows], dtype=float)
    openness = np.asarray([row["final_openness"] for row in site_rows], dtype=float)
    eligible = openness >= float(np.median(openness))
    if int(np.sum(eligible)) < 4:
        eligible = np.ones(len(site_rows), dtype=bool)
    subset_scores = scores[eligible]
    subset_populations = populations[eligible]
    high_cutoff = float(np.quantile(subset_scores, 0.75))
    low_cutoff = float(np.quantile(subset_scores, 0.25))
    high_values = subset_populations[subset_scores >= high_cutoff]
    low_values = subset_populations[subset_scores <= low_cutoff]
    if high_values.size == 0 or low_values.size == 0:
        return 0.0
    return float(np.mean(high_values) - np.mean(low_values))


def _rank_curve(site_rows: list[dict[str, Any]]) -> list[float]:
    return sorted((float(row["final_population"]) for row in site_rows if float(row["final_population"]) > 0.0), reverse=True)


def _zipf_tail_slope(values: list[float]) -> float:
    positive = [value for value in values if value > 0.0]
    if len(positive) < 2:
        return 0.0
    tail_count = max(3, min(len(positive), max(3, len(positive) // 3)))
    tail = positive[:tail_count]
    ranks = np.arange(1, len(tail) + 1, dtype=float)
    slope, _intercept = np.polyfit(np.log(ranks), np.log(np.asarray(tail, dtype=float)), 1)
    return float(slope)


def _mean_rank_curve(runs: list[dict[str, Any]]) -> list[float]:
    curves = [_rank_curve(run["site_outcomes"]) for run in runs]
    if not curves:
        return []
    max_length = max(len(curve) for curve in curves)
    return [
        float(np.mean([curve[rank] for curve in curves if len(curve) > rank]))
        for rank in range(max_length)
    ]


def _treatment_premium(site_rows: list[dict[str, Any]], treatment_key: str) -> float:
    treated = [row["final_population"] for row in site_rows if row.get(treatment_key)]
    untreated = [row["final_population"] for row in site_rows if not row.get(treatment_key)]
    if not treated or not untreated:
        return 0.0
    return _group_mean(treated) - _group_mean(untreated)


def _experiment_digest(experiment: dict[str, Any]) -> dict[str, Any]:
    return {
        "scenario": experiment["scenario"],
        "config": experiment["config"],
        "runs": experiment["runs"],
        "policies": experiment["policies"],
        "oracle_policy": experiment["oracle_policy"],
        "oracle_summary": experiment["oracle_summary"],
        "summary": experiment["summary"],
    }


def _pair_name(left: str, right: str) -> str:
    return f"{left}__minus__{right}"


def _status(strong: bool, weak: bool) -> str:
    if strong:
        return "supported"
    if weak:
        return "mixed"
    return "not_supported"


def _evaluate_h1(experiment: dict[str, Any], policies: list[str]) -> dict[str, Any]:
    population_corr = [
        value
        for policy in policies
        for value in _policy_metric(experiment, policy, "resource_population_correlation")
    ]
    extraction_corr = [
        value
        for policy in policies
        for value in _policy_metric(experiment, policy, "resource_extraction_correlation")
    ]
    overall_population = _series_stats(population_corr)
    overall_extraction = _series_stats(extraction_corr)
    by_policy: dict[str, Any] = {}
    for policy in policies:
        policy_population = _series_stats(_policy_metric(experiment, policy, "resource_population_correlation"))
        policy_extraction = _series_stats(_policy_metric(experiment, policy, "resource_extraction_correlation"))
        by_policy[policy] = {
            "resource_population_correlation": policy_population,
            "resource_extraction_correlation": policy_extraction,
        }
    strong = overall_population["ci95_high"] < 0.0 and overall_extraction["ci95_low"] > 0.0
    weak = overall_population["mean"] < 0.0 and overall_extraction["mean"] > 0.0
    return {
        "status": _status(strong, weak),
        "description": "High resource rents should correlate with lower final population and higher final extraction.",
        "scenario": "resource-curse",
        "evidence": {
            "overall_resource_population_correlation": overall_population,
            "overall_resource_extraction_correlation": overall_extraction,
            "by_policy": by_policy,
        },
    }


def _evaluate_h2(resource_experiment: dict[str, Any], botswana_experiment: dict[str, Any], policies: list[str]) -> dict[str, Any]:
    resource_rows = _collect_site_rows(resource_experiment, policies)
    botswana_rows = _collect_site_rows(botswana_experiment, policies)
    resource_groups = _conditional_group_summary(resource_rows)
    botswana_groups = _conditional_group_summary(botswana_rows)
    resource_interaction = _interaction_beta(resource_rows)
    botswana_interaction = _interaction_beta(botswana_rows)
    resource_interaction_controlled = _interaction_beta(resource_rows, controlled=True)
    botswana_interaction_controlled = _interaction_beta(botswana_rows, controlled=True)
    resource_threshold_interaction = _threshold_interaction_beta(resource_rows, controlled=True)
    botswana_threshold_interaction = _threshold_interaction_beta(botswana_rows, controlled=True)
    low_extraction_lift = (
        botswana_groups["high_resource_low_extraction_mean_population"]
        - resource_groups["high_resource_low_extraction_mean_population"]
    )
    strong = (
        resource_groups["low_minus_high_extraction_gap"] > 0.0
        and botswana_groups["low_minus_high_extraction_gap"] > 0.0
        and resource_threshold_interaction < 0.0
        and botswana_threshold_interaction >= resource_threshold_interaction
    )
    weak = (
        resource_groups["low_minus_high_extraction_gap"] > 0.0
        and botswana_groups["low_minus_high_extraction_gap"] > 0.0
        and (
            resource_threshold_interaction < 0.0
            or resource_interaction_controlled < 0.0
            or resource_interaction < 0.0
        )
    )
    return {
        "status": _status(strong, weak),
        "description": "Resource abundance should be most harmful once initial extraction crosses the institutional threshold; high-resource sites with inclusive starts should retain a population advantage, with Botswana-style calibration reported as a robustness case rather than a required dominance test.",
        "scenarios": ["resource-curse", "botswana"],
        "evidence": {
            "resource_curse_interaction_beta": resource_interaction,
            "resource_curse_controlled_interaction_beta": resource_interaction_controlled,
            "resource_curse_threshold_interaction_beta": resource_threshold_interaction,
            "botswana_interaction_beta": botswana_interaction,
            "botswana_controlled_interaction_beta": botswana_interaction_controlled,
            "botswana_threshold_interaction_beta": botswana_threshold_interaction,
            "resource_curse_groups": resource_groups,
            "botswana_groups": botswana_groups,
            "botswana_low_extraction_lift": low_extraction_lift,
        },
    }


def _evaluate_h3(baseline_experiment: dict[str, Any], cluster_experiment: dict[str, Any], policies: list[str]) -> dict[str, Any]:
    reward_diffs: list[float] = []
    treatment_premia: list[float] = []
    by_policy: dict[str, Any] = {}
    for policy in policies:
        cluster_runs = cluster_experiment["results"][policy]
        treatment_stats = _series_stats([_treatment_premium(run["site_outcomes"], "trade_cluster") for run in cluster_runs])
        reward_stats = _paired_stats(_policy_rewards(cluster_experiment, policy), _policy_rewards(baseline_experiment, policy))
        by_policy[policy] = {
            "treated_cluster_population_premium": treatment_stats,
            "cumulative_reward_difference": reward_stats,
        }
        treatment_premia.extend([_treatment_premium(run["site_outcomes"], "trade_cluster") for run in cluster_runs])
        reward_diffs.extend((np.asarray(_policy_rewards(cluster_experiment, policy)) - np.asarray(_policy_rewards(baseline_experiment, policy))).tolist())
    overall_premium = _series_stats(treatment_premia)
    overall_reward = _series_stats(reward_diffs)
    strong = overall_premium["ci95_low"] > 0.0 and overall_reward["ci95_low"] > 0.0
    weak = overall_premium["mean"] > 0.0 and overall_reward["mean"] > 0.0
    return {
        "status": _status(strong, weak),
        "description": "Open, spatially clustered cities should enjoy a stronger population premium than comparable baseline sites.",
        "scenarios": ["baseline", "open-cluster"],
        "evidence": {
            "overall_treated_cluster_population_premium": overall_premium,
            "overall_cumulative_reward_difference": overall_reward,
            "by_policy": by_policy,
        },
    }


def _scenario_policy_comparisons(experiment: dict[str, Any], policies: list[str]) -> dict[str, Any]:
    comparisons: dict[str, Any] = {}
    for left_index, left in enumerate(policies):
        for right in policies[left_index + 1 :]:
            comparisons[_pair_name(left, right)] = {
                "metric": "cumulative_reward",
                "stats": _paired_stats(_policy_rewards(experiment, left), _policy_rewards(experiment, right)),
            }
    return comparisons


def _evaluate_h5(experiments: dict[str, dict[str, Any]]) -> dict[str, Any]:
    scenario_names = list(experiments)
    required_pairs = [
        ("gaussian-thompson", "ucb1"),
        ("gaussian-thompson", "epsilon-greedy"),
        ("whittle-index", "ucb1"),
        ("whittle-index", "epsilon-greedy"),
    ]
    pair_evidence: dict[str, Any] = {}
    strong_conditions: list[bool] = []
    weak_conditions: list[bool] = []
    for left, right in required_pairs:
        diffs: list[float] = []
        per_scenario: dict[str, Any] = {}
        available = True
        for scenario_name in scenario_names:
            experiment = experiments[scenario_name]
            if left not in experiment["results"] or right not in experiment["results"]:
                available = False
                break
            left_rewards = _policy_rewards(experiment, left)
            right_rewards = _policy_rewards(experiment, right)
            diff_stats = _paired_stats(left_rewards, right_rewards)
            per_scenario[scenario_name] = diff_stats
            diffs.extend((np.asarray(left_rewards) - np.asarray(right_rewards)).tolist())
        if not available:
            pair_evidence[_pair_name(left, right)] = {"status": "missing_policy"}
            continue
        overall = _series_stats(diffs)
        pair_evidence[_pair_name(left, right)] = {
            "overall_difference": overall,
            "by_scenario": per_scenario,
        }
        strong_conditions.append(overall["ci95_low"] > 0.0)
        weak_conditions.append(overall["mean"] > 0.0)

    if not strong_conditions:
        status = "not_supported"
    else:
        status = _status(all(strong_conditions), sum(weak_conditions) >= max(1, len(weak_conditions) // 2))
    return {
        "status": status,
        "description": "Thompson Sampling and Whittle should outperform UCB1 and epsilon-greedy on cumulative reward.",
        "scenarios": scenario_names,
        "evidence": pair_evidence,
    }


def _evaluate_h6(experiment: dict[str, Any], policies: list[str]) -> dict[str, Any]:
    run_slopes = [
        value
        for policy in policies
        for value in _policy_metric(experiment, policy, "zipf_slope")
    ]
    run_stats = _series_stats(run_slopes)
    within_band = [slope for slope in run_slopes if -1.25 <= slope <= -0.75]
    within_share = float(len(within_band) / len(run_slopes)) if run_slopes else 0.0
    deviation = [abs(slope + 1.0) for slope in run_slopes]
    deviation_stats = _series_stats(deviation)
    policy_curve_slopes = {
        policy: _zipf_tail_slope(_mean_rank_curve(experiment["results"][policy]))
        for policy in policies
        if policy in experiment["results"]
    }
    policy_curve_values = list(policy_curve_slopes.values())
    policy_curve_stats = _series_stats(policy_curve_values)
    policy_curve_within_share = (
        float(sum(-1.25 <= slope <= -0.75 for slope in policy_curve_values) / len(policy_curve_values))
        if policy_curve_values
        else 0.0
    )
    robust_median = float(np.median(np.asarray(policy_curve_values, dtype=float))) if policy_curve_values else 0.0
    policy_curve_spread = (
        float(max(policy_curve_values) - min(policy_curve_values))
        if policy_curve_values
        else 0.0
    )
    strong = (
        -1.25 <= robust_median <= -0.75
        and deviation_stats["mean"] <= 0.45
        and policy_curve_spread <= 1.0
    )
    weak = (
        -1.35 <= robust_median <= -0.65
        or within_share >= 0.5
        or deviation_stats["mean"] <= 0.7
        or (run_stats["ci95_low"] <= -1.0 <= run_stats["ci95_high"])
    )
    return {
        "status": _status(strong, weak),
        "description": "Final city sizes should approximate a Zipf slope near -1 in the structural city system; policy-to-policy dispersion is reported as a robustness check rather than the primary construct.",
        "scenario": "baseline",
        "evidence": {
            "run_level_zipf_slope": run_stats,
            "absolute_deviation_from_minus_one": deviation_stats,
            "run_level_within_reference_band_share": within_share,
            "policy_mean_curve_zipf_slope": policy_curve_stats,
            "policy_mean_curve_within_reference_band_share": policy_curve_within_share,
            "policy_mean_curve_median_slope": robust_median,
            "policy_mean_curve_spread": policy_curve_spread,
            "policy_mean_curve_slopes": policy_curve_slopes,
        },
    }


def _evaluate_h7(experiment: dict[str, Any]) -> dict[str, Any]:
    if "ucb1" not in experiment["results"] or "gaussian-thompson" not in experiment["results"]:
        return {
            "status": "not_supported",
            "description": "UCB1 should over-invest in the decaying boomtown arm.",
            "scenario": "ucb-bait",
            "evidence": {"reason": "Required policies missing."},
        }

    ucb_boomtown = _policy_metric(experiment, "ucb1", "boomtown_selection_share")
    ts_boomtown = _policy_metric(experiment, "gaussian-thompson", "boomtown_selection_share")
    ucb_hhi = _policy_metric(experiment, "ucb1", "selection_hhi")
    ts_hhi = _policy_metric(experiment, "gaussian-thompson", "selection_hhi")
    ts_reward = _policy_rewards(experiment, "gaussian-thompson")
    ucb_reward = _policy_rewards(experiment, "ucb1")

    boomtown_stats = _paired_stats(ucb_boomtown, ts_boomtown)
    hhi_stats = _paired_stats(ucb_hhi, ts_hhi)
    reward_stats = _paired_stats(ts_reward, ucb_reward)
    strong = boomtown_stats["ci95_low"] > 0.0 and hhi_stats["ci95_low"] > 0.0 and reward_stats["ci95_low"] > 0.0
    weak = boomtown_stats["mean"] > 0.0 and reward_stats["mean"] > 0.0
    return {
        "status": _status(strong, weak),
        "description": "UCB1 should over-allocate to the boomtown trap relative to a more adaptive Thompson policy.",
        "scenario": "ucb-bait",
        "evidence": {
            "ucb1_minus_thompson_boomtown_selection_share": boomtown_stats,
            "ucb1_minus_thompson_selection_hhi": hhi_stats,
            "thompson_minus_ucb1_cumulative_reward": reward_stats,
        },
    }


def analyze_hypothesis_suite(
    experiments: dict[str, dict[str, Any]],
    policies: list[str] | None = None,
    hypothesis_names: list[str] | tuple[str, ...] | None = None,
) -> dict[str, Any]:
    if not experiments:
        raise ValueError("At least one experiment is required.")
    policy_list = policies or list(DEFAULT_POLICIES)
    scenario_summaries = {name: _experiment_digest(experiment) for name, experiment in experiments.items()}
    pairwise = {
        name: _scenario_policy_comparisons(experiment, [policy for policy in policy_list if policy in experiment["results"]])
        for name, experiment in experiments.items()
    }
    requested = tuple(hypothesis_names or HYPOTHESIS_REQUIREMENTS.keys())
    hypotheses: dict[str, Any] = {}
    if "H1" in requested and all(name in experiments for name in HYPOTHESIS_REQUIREMENTS["H1"]):
        hypotheses["H1"] = _evaluate_h1(experiments["resource-curse"], policy_list)
    if "H2" in requested and all(name in experiments for name in HYPOTHESIS_REQUIREMENTS["H2"]):
        hypotheses["H2"] = _evaluate_h2(experiments["resource-curse"], experiments["botswana"], policy_list)
    if "H3" in requested and all(name in experiments for name in HYPOTHESIS_REQUIREMENTS["H3"]):
        hypotheses["H3"] = _evaluate_h3(experiments["baseline"], experiments["open-cluster"], policy_list)
    if "H5" in requested and all(name in experiments for name in HYPOTHESIS_REQUIREMENTS["H5"]):
        hypotheses["H5"] = _evaluate_h5({name: experiments[name] for name in HYPOTHESIS_SCENARIOS if name in experiments})
    if "H6" in requested and all(name in experiments for name in HYPOTHESIS_REQUIREMENTS["H6"]):
        hypotheses["H6"] = _evaluate_h6(experiments["baseline"], policy_list)
    if "H7" in requested and all(name in experiments for name in HYPOTHESIS_REQUIREMENTS["H7"]):
        hypotheses["H7"] = _evaluate_h7(experiments["ucb-bait"])
    return {
        "policies": policy_list,
        "scenarios": scenario_summaries,
        "pairwise_policy_comparisons": pairwise,
        "hypotheses": hypotheses,
    }


def run_hypothesis_suite(
    config: SimulationConfig,
    policies: list[str] | None = None,
    runs: int = 12,
    include_experiments: bool = False,
    scenario_overrides: dict[str, dict[str, Any]] | None = None,
    scenario_names: list[str] | tuple[str, ...] | None = None,
    hypothesis_names: list[str] | tuple[str, ...] | None = None,
) -> dict[str, Any]:
    policy_list = policies or list(DEFAULT_POLICIES)
    selected_scenarios = tuple(scenario_names or HYPOTHESIS_SCENARIOS)
    experiments = {
        scenario_name: run_experiment(
            config,
            policy_list,
            runs,
            scenario_name=scenario_name,
            scenario_overrides=(scenario_overrides or {}).get(scenario_name),
        )
        for scenario_name in selected_scenarios
    }
    report = analyze_hypothesis_suite(experiments, policy_list, hypothesis_names=hypothesis_names)
    report["runs"] = runs
    report["base_config"] = asdict(config)
    report["scenario_names"] = list(selected_scenarios)
    if include_experiments:
        report["experiments"] = experiments
    return report
