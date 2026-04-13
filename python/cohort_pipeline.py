from __future__ import annotations

import argparse
import copy
import json
import math
import subprocess
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Iterable

import numpy as np
import pandas as pd
import pyarrow.parquet as pq


REPO_ROOT = Path(__file__).resolve().parents[1]
RESULTS_ROOT = REPO_ROOT / "results" / "cohorts"
MANIFEST_ROOT = RESULTS_ROOT / "manifests"
FRONTEND_RESULTS_ROOT = REPO_ROOT / "web" / "content" / "source" / "results"
REPORT_PATH = REPO_ROOT / "docs" / "reports" / "2026-04-13-combined-evidence-report.md"
DEFAULT_CONFIG_PATH = REPO_ROOT / "configs" / "default.json"
SCENARIO_DIR = REPO_ROOT / "configs" / "scenarios"

LEGACY_POLICIES = [
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
SCENARIO_POLICIES = [ORACLE_POLICY, *LEGACY_POLICIES]

SCENARIO_FILES = [
    "baseline.json",
    "resource-curse.json",
    "botswana.json",
    "open-cluster.json",
    "merchant-republic.json",
    "megacity-trap.json",
    "balanced-urban-system.json",
    "shock-reform.json",
    "ucb-bait.json",
]

STRESS_SCENARIO_QUOTAS = {
    "ucb-bait": 10_000,
    "resource-curse": 8_000,
    "shock-reform": 7_000,
    "megacity-trap": 7_000,
    "merchant-republic": 5_000,
    "open-cluster": 4_000,
    "balanced-urban-system": 4_000,
    "botswana": 3_000,
    "baseline": 2_000,
}

SHORT_POLICY_NAMES = {
    "epsilon-greedy": "Eps",
    "ucb1": "UCB1",
    "discounted-ucb": "D-UCB",
    "sliding-window-ucb": "SW-UCB",
    "gaussian-thompson": "Gauss TS",
    "discounted-gaussian-thompson": "D-TS",
    "linucb": "LinUCB",
    "linear-thompson": "LinTS",
    "whittle-index": "Whittle",
    "myopic-oracle": "Oracle",
}

SUMMARY_METRICS = [
    "cumulative_reward",
    "oracle_reward",
    "oracle_regret",
    "empirical_best_reward",
    "empirical_regret",
    "mean_final_extraction",
    "mean_final_openness",
    "mean_final_adaptability",
    "mean_final_resource_rent",
    "mean_productive_capital",
    "mean_reforms_triggered",
    "mean_shock_hits",
    "population_hhi",
    "population_gini",
    "zipf_slope",
    "resource_extraction_correlation",
    "resource_population_correlation",
    "boomtown_population_share",
    "boomtown_selection_share",
    "boomtown_pre_collapse_selection_share",
    "boomtown_collapse_selection_share",
    "land_share",
    "river_share",
]

HEATMAP_METRICS = [
    ("cumulative_reward", False),
    ("oracle_regret", True),
    ("mean_final_extraction", True),
    ("population_hhi", True),
    ("zipf_slope", False),
]

SCALE_BUCKETS = [0.85, 0.925, 1.0, 1.075, 1.15]
SHIFT_BUCKETS = [-0.08, -0.04, 0.0, 0.04, 0.08]


@dataclass(frozen=True)
class ScenarioSpec:
    file_name: str
    name: str
    description: str
    overrides: dict[str, Any]


@dataclass(frozen=True)
class CohortSpec:
    name: str
    description: str
    policies: list[str]
    config_count: int
    executions: int
    scenario_supported: bool
    oracle_supported: bool


def ensure_output_dirs() -> None:
    RESULTS_ROOT.mkdir(parents=True, exist_ok=True)
    MANIFEST_ROOT.mkdir(parents=True, exist_ok=True)
    FRONTEND_RESULTS_ROOT.mkdir(parents=True, exist_ok=True)


def load_default_config() -> dict[str, Any]:
    with DEFAULT_CONFIG_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_scenario_specs() -> list[ScenarioSpec]:
    specs: list[ScenarioSpec] = []
    for file_name in SCENARIO_FILES:
        path = SCENARIO_DIR / file_name
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        specs.append(
            ScenarioSpec(
                file_name=file_name,
                name=payload["name"],
                description=payload["description"],
                overrides=payload.get("overrides", {}),
            )
        )
    return specs


def scenario_specs_by_name() -> dict[str, ScenarioSpec]:
    return {spec.name: spec for spec in load_scenario_specs()}


def cohort_specs() -> dict[str, CohortSpec]:
    return {
        "legacy_1m": CohortSpec(
            name="legacy_1m",
            description="Legacy million-scale baseline sweep reconstructed from configs/sweep_configs.jsonl semantics.",
            policies=LEGACY_POLICIES,
            config_count=111_112,
            executions=111_112 * len(LEGACY_POLICIES),
            scenario_supported=False,
            oracle_supported=False,
        ),
        "historical_90k": CohortSpec(
            name="historical_90k",
            description="Canonical nine-scenario suite with 1,000 matched seeds per scenario and oracle support.",
            policies=SCENARIO_POLICIES,
            config_count=9_000,
            executions=9_000 * len(SCENARIO_POLICIES),
            scenario_supported=True,
            oracle_supported=True,
        ),
        "stress_500k": CohortSpec(
            name="stress_500k",
            description="Stress-heavy scenario sweep with deterministic perturbations and scenario-weighted quotas.",
            policies=SCENARIO_POLICIES,
            config_count=50_000,
            executions=50_000 * len(SCENARIO_POLICIES),
            scenario_supported=True,
            oracle_supported=True,
        ),
    }


def cohort_paths(cohort_name: str) -> dict[str, Path]:
    return {
        "input": RESULTS_ROOT / f"{cohort_name}_configs.jsonl",
        "parquet": RESULTS_ROOT / f"{cohort_name}.parquet",
        "manifest": MANIFEST_ROOT / f"{cohort_name}.manifest.json",
        "summary": MANIFEST_ROOT / f"{cohort_name}.summary.json",
    }


def short_policy_name(policy: str) -> str:
    return SHORT_POLICY_NAMES.get(policy, policy)


def apply_overrides(base: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    config = copy.deepcopy(base)
    for key, value in overrides.items():
        config[key] = value
    return config


def clip(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def scale_param(config: dict[str, Any], key: str, factor: float, lower: float, upper: float) -> None:
    config[key] = clip(float(config[key]) * factor, lower, upper)


def shift_param(config: dict[str, Any], key: str, delta: float, lower: float, upper: float) -> None:
    config[key] = clip(float(config[key]) + delta, lower, upper)


def shift_int(config: dict[str, Any], key: str, delta: int, lower: int, upper: int) -> None:
    config[key] = int(max(lower, min(upper, int(config[key]) + delta)))


def set_seed_fields(config: dict[str, Any], seed: int, run_id: int, terrain_seed_matches: bool) -> dict[str, Any]:
    config["seed"] = seed
    if terrain_seed_matches:
        config.setdefault("terrain", {})["seed"] = seed
    config["run_id"] = run_id
    config["lod"] = "LOW"
    return config


def apply_shared_stress_perturbations(
    config: dict[str, Any],
    scenario_name: str,
    serial: int,
) -> dict[str, Any]:
    stressed = copy.deepcopy(config)
    scale_a = SCALE_BUCKETS[serial % len(SCALE_BUCKETS)]
    scale_b = SCALE_BUCKETS[(serial * 3 + 1) % len(SCALE_BUCKETS)]
    shift_a = SHIFT_BUCKETS[(serial * 5 + 2) % len(SHIFT_BUCKETS)]
    shift_b = SHIFT_BUCKETS[(serial * 7 + 3) % len(SHIFT_BUCKETS)]
    shift_c = SHIFT_BUCKETS[(serial * 11 + 4) % len(SHIFT_BUCKETS)]

    scale_param(stressed, "initial_extraction_resource_bias", scale_a, 0.5, 8.5)
    scale_param(stressed, "resource_capture_gain", scale_b, 0.2, 4.0)
    scale_param(stressed, "resource_curse_strength", scale_b, 0.0, 0.35)
    scale_param(stressed, "network_scale", scale_a, 0.05, 1.1)
    scale_param(stressed, "network_density_gain", scale_a, 0.1, 1.5)
    scale_param(stressed, "agglomeration_alpha", scale_a, 0.1, 1.2)
    scale_param(stressed, "secondary_city_bonus", scale_b, 0.0, 1.5)
    scale_param(stressed, "inclusive_productivity_gain", scale_a, 0.1, 1.25)
    shift_param(stressed, "curse_openness_buffer", shift_a, 0.02, 0.8)
    shift_param(stressed, "curse_capital_buffer", shift_b, 0.02, 0.8)
    shift_param(stressed, "extractive_cashflow_premium", shift_b, 0.0, 1.0)
    shift_param(stressed, "depletion_rate", shift_c, 0.02, 0.5)
    shift_param(stressed, "congestion", shift_b * 0.03, 0.0005, 0.02)
    shift_param(stressed, "metropolitan_overstretch_penalty", shift_c * 0.15, 0.0, 0.3)
    shift_param(stressed, "reform_sensitivity", shift_a * 4.0, 0.4, 6.0)
    shift_param(stressed, "reform_step", shift_b * 0.6, 0.02, 0.5)

    if scenario_name == "ucb-bait":
        scale_param(stressed, "boomtown_resource_bonus", scale_a, 0.1, 1.0)
        scale_param(stressed, "boomtown_early_reward_bonus", scale_b, 1.0, 10.0)
        scale_param(stressed, "boomtown_decay_multiplier", scale_b, 1.0, 8.0)
        shift_int(stressed, "boomtown_bonus_duration", int(round(shift_a * 40)), 12, 64)
        shift_int(stressed, "boomtown_collapse_threshold", int(round(shift_b * 30)), 8, 64)
        shift_param(stressed, "active_extraction_pressure", shift_c, 0.05, 0.5)
    elif scenario_name == "resource-curse":
        shift_param(stressed, "active_resource_depletion", shift_b, 0.02, 0.25)
        shift_param(stressed, "active_openness_drag", shift_c * 0.5, 0.0, 0.08)
        scale_param(stressed, "extractive_capital_erosion", scale_b, 0.01, 0.2)
    elif scenario_name == "shock-reform":
        shift_param(stressed, "shock_probability", 0.04 + abs(shift_a) * 0.4, 0.02, 0.35)
        shift_param(stressed, "shock_reform_bonus", 0.08 + shift_b, 0.0, 0.5)
        shift_param(stressed, "shock_openness_bonus", 0.05 + shift_c, 0.0, 0.4)
        shift_param(stressed, "shock_capital_rebuild", 0.06 + shift_a, 0.0, 0.45)
        shift_int(stressed, "shock_transition_duration", int(round(8 + shift_b * 20)), 2, 24)
    elif scenario_name in {"merchant-republic", "open-cluster", "balanced-urban-system"}:
        shift_int(stressed, "trade_cluster_count", int(round(shift_a * 8)), 2, 8)
        shift_param(stressed, "trade_cluster_radius", shift_b * 0.3, 0.08, 0.5)
        shift_param(stressed, "trade_cluster_openness_bonus", 0.04 + shift_c, 0.0, 0.4)
        shift_param(stressed, "trade_cluster_capital_bonus", 0.05 + shift_a, 0.0, 0.45)
        shift_param(stressed, "trade_cluster_accessibility_bonus", 0.03 + shift_b, 0.0, 0.4)
    elif scenario_name == "megacity-trap":
        shift_param(stressed, "secondary_city_spread", shift_a, 0.2, 1.2)
        shift_param(stressed, "metropolitan_overstretch_threshold", shift_b * 12.0, 8.0, 40.0)
        shift_param(stressed, "metropolitan_overstretch_penalty", 0.03 + shift_c * 0.2, 0.01, 0.3)
        scale_param(stressed, "congestion", scale_b, 0.001, 0.02)
    elif scenario_name == "botswana":
        shift_param(stressed, "curse_openness_buffer", 0.06 + shift_a, 0.1, 0.9)
        shift_param(stressed, "curse_capital_buffer", 0.06 + shift_b, 0.1, 0.9)
        shift_param(stressed, "inclusive_investment_gain", 0.05 + shift_c, 0.02, 0.4)
    else:
        shift_param(stressed, "inclusive_investment_gain", shift_a * 0.25, 0.02, 0.3)
        shift_param(stressed, "resource_base_payoff", shift_b * 0.25, 0.05, 0.5)

    return stressed


def legacy_1m_records() -> Iterable[dict[str, Any]]:
    base = load_default_config()
    for i in range(111_112):
        config = copy.deepcopy(base)
        config["seed"] = i
        config["run_id"] = i
        config["lod"] = "LOW"
        yield config


def historical_90k_records() -> Iterable[dict[str, Any]]:
    base = load_default_config()
    specs = load_scenario_specs()
    run_id = 1_000_000
    for scenario_index, spec in enumerate(specs):
        scenario_base = apply_overrides(base, spec.overrides)
        for seed_index in range(1_000):
            seed = scenario_index * 10_000 + seed_index
            config = set_seed_fields(copy.deepcopy(scenario_base), seed=seed, run_id=run_id, terrain_seed_matches=True)
            yield {"scenario": spec.name, "config": config}
            run_id += 1


def stress_500k_records() -> Iterable[dict[str, Any]]:
    base = load_default_config()
    specs = scenario_specs_by_name()
    run_id = 2_000_000
    seed = 5_000_000
    for scenario_name, quota in STRESS_SCENARIO_QUOTAS.items():
        scenario_base = apply_overrides(base, specs[scenario_name].overrides)
        for serial in range(quota):
            stressed = apply_shared_stress_perturbations(scenario_base, scenario_name, serial)
            config = set_seed_fields(copy.deepcopy(stressed), seed=seed, run_id=run_id, terrain_seed_matches=True)
            yield {"scenario": scenario_name, "config": config}
            run_id += 1
            seed += 1


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    count = 0
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row))
            handle.write("\n")
            count += 1
    return count


def generate_cohort_inputs(selected: Iterable[str] | None = None) -> dict[str, dict[str, Any]]:
    ensure_output_dirs()
    selected_names = set(selected or cohort_specs().keys())
    outputs: dict[str, dict[str, Any]] = {}
    for cohort_name, spec in cohort_specs().items():
        if cohort_name not in selected_names:
            continue
        paths = cohort_paths(cohort_name)
        if cohort_name == "legacy_1m":
            config_count = write_jsonl(paths["input"], legacy_1m_records())
            scenario_names: list[str] = []
        elif cohort_name == "historical_90k":
            config_count = write_jsonl(paths["input"], historical_90k_records())
            scenario_names = [scenario.name for scenario in load_scenario_specs()]
        else:
            config_count = write_jsonl(paths["input"], stress_500k_records())
            scenario_names = list(STRESS_SCENARIO_QUOTAS.keys())

        manifest = {
            "cohort": spec.name,
            "description": spec.description,
            "config_count": config_count,
            "execution_count": spec.executions,
            "policies": spec.policies,
            "policy_count": len(spec.policies),
            "scenario_supported": spec.scenario_supported,
            "oracle_supported": spec.oracle_supported,
            "input_jsonl": str(paths["input"].relative_to(REPO_ROOT)),
            "output_parquet": str(paths["parquet"].relative_to(REPO_ROOT)),
            "scenarios": scenario_names,
        }
        with paths["manifest"].open("w", encoding="utf-8") as handle:
            json.dump(manifest, handle, indent=2)
        outputs[cohort_name] = manifest
    return outputs


def run_cohort(cohort_name: str, limit: int | None = None) -> None:
    spec = cohort_specs()[cohort_name]
    paths = cohort_paths(cohort_name)
    binary = REPO_ROOT / "target" / "release" / "insulindian-miracle.exe"
    if not binary.exists():
        subprocess.run(["cargo", "build", "--release"], cwd=REPO_ROOT, check=True)
    cmd = [
        str(binary),
        "sweep",
        "--input",
        str(paths["input"]),
        "--output",
        str(paths["parquet"]),
    ]
    for policy in spec.policies:
        cmd.extend(["--policies", policy])
    if limit is not None:
        cmd.extend(["--limit", str(limit)])
    subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def load_parquet(path: Path) -> pd.DataFrame:
    table = pq.read_table(path)
    frame = table.to_pandas()
    for column in ("policy", "scenario"):
        if column in frame.columns:
            frame[column] = frame[column].astype(str)
    return frame


def metric_summary(frame: pd.DataFrame) -> dict[str, dict[str, float]]:
    if frame.empty:
        return {}
    output: dict[str, dict[str, float]] = {}
    for policy, group in frame.groupby("policy", observed=True):
        summary: dict[str, float] = {"runs": float(len(group))}
        for metric in SUMMARY_METRICS:
            if metric not in group.columns:
                continue
            series = pd.to_numeric(group[metric], errors="coerce").dropna()
            if series.empty:
                continue
            summary[f"mean_{metric}"] = float(series.mean())
            if metric in {"cumulative_reward", "oracle_regret", "population_hhi", "mean_final_extraction"}:
                summary[f"std_{metric}"] = float(series.std(ddof=1)) if len(series) > 1 else 0.0
        output[str(policy)] = summary
    return output


def oracle_summary(frame: pd.DataFrame) -> dict[str, float]:
    oracle_frame = frame[frame["policy"] == ORACLE_POLICY]
    summary = metric_summary(oracle_frame)
    return summary.get(ORACLE_POLICY, {})


def bootstrap_ci(values: np.ndarray, iterations: int = 400, seed: int = 20260413) -> tuple[float, float]:
    if values.size == 0:
        return (math.nan, math.nan)
    if values.size == 1:
        scalar = float(values[0])
        return (scalar, scalar)
    rng = np.random.default_rng(seed)
    samples = rng.choice(values, size=(iterations, values.size), replace=True)
    means = samples.mean(axis=1)
    return (float(np.quantile(means, 0.025)), float(np.quantile(means, 0.975)))


def paired_policy_effects(
    frame: pd.DataFrame,
    baseline_policy: str,
    policy_list: list[str],
) -> list[dict[str, Any]]:
    if frame.empty:
        return []
    pivot = frame.pivot_table(
        index=["scenario", "seed", "cohort"],
        columns="policy",
        values="cumulative_reward",
        aggfunc="first",
    )
    output: list[dict[str, Any]] = []
    for policy in policy_list:
        if policy == baseline_policy or policy not in pivot.columns or baseline_policy not in pivot.columns:
            continue
        diff = (pivot[policy] - pivot[baseline_policy]).dropna().to_numpy(dtype=float)
        if diff.size == 0:
            continue
        ci_low, ci_high = bootstrap_ci(diff)
        output.append(
            {
                "policy": policy,
                "baseline": baseline_policy,
                "mean_gap": float(diff.mean()),
                "ci_low": ci_low,
                "ci_high": ci_high,
                "win_rate": float((diff > 0).mean()),
                "matches": int(diff.size),
            }
        )
    return output


def histogram_bins(values: pd.Series, bins: int = 8) -> list[dict[str, Any]]:
    clean = pd.to_numeric(values, errors="coerce").dropna()
    if clean.empty:
        return []
    edges = np.histogram_bin_edges(clean.to_numpy(dtype=float), bins=bins)
    counts, _ = np.histogram(clean.to_numpy(dtype=float), bins=edges)
    output = []
    for left, right, count in zip(edges[:-1], edges[1:], counts, strict=False):
        output.append({"label": f"{left:.1f}-{right:.1f}", "count": int(count)})
    return output


def heatmap_payload(frame: pd.DataFrame, policy_order: list[str]) -> dict[str, Any]:
    labels_x = ["Reward", "Gap", "Extraction", "HHI", "Zipf"]
    labels_y: list[str] = []
    matrix: list[list[float]] = []
    grouped = frame.groupby("policy", observed=True)
    for policy in policy_order:
        if policy not in grouped.groups:
            continue
        labels_y.append(short_policy_name(policy))
        group = grouped.get_group(policy)
        row: list[float] = []
        for metric, invert in HEATMAP_METRICS:
            values = pd.to_numeric(group.get(metric), errors="coerce").dropna()
            score = float(values.mean()) if not values.empty else 0.0
            row.append(-score if invert else score)
        matrix.append(row)
    if not matrix:
        return {"labelsX": labels_x, "labelsY": labels_y, "data": []}

    raw = np.array(matrix, dtype=float)
    norm = raw.copy()
    for col in range(norm.shape[1]):
        column = norm[:, col]
        min_value = float(column.min())
        max_value = float(column.max())
        if math.isclose(min_value, max_value):
            norm[:, col] = 50.0
        else:
            norm[:, col] = (column - min_value) / (max_value - min_value) * 100.0
    return {
        "labelsX": labels_x,
        "labelsY": labels_y,
        "data": norm.round(2).tolist(),
    }


def scenario_payload(
    scenario_name: str,
    frame: pd.DataFrame,
    cohort_frames: dict[str, pd.DataFrame],
    spec: ScenarioSpec,
) -> dict[str, Any]:
    canonical = frame[frame["policy"] != ORACLE_POLICY]
    combined_summary = metric_summary(canonical)
    oracle = oracle_summary(frame)
    ranking = sorted(
        (
            {
                "label": short_policy_name(policy),
                "value": summary.get("mean_cumulative_reward", 0.0),
                "policy": policy,
            }
            for policy, summary in combined_summary.items()
        ),
        key=lambda item: item["value"],
        reverse=True,
    )
    cohort_breakdown: dict[str, Any] = {}
    dumbbell_items: list[dict[str, Any]] = []
    for cohort_name, cohort_frame in cohort_frames.items():
        scenario_frame = cohort_frame[cohort_frame["scenario"] == scenario_name]
        if scenario_frame.empty:
            continue
        scenario_canonical = scenario_frame[scenario_frame["policy"] != ORACLE_POLICY]
        summary = metric_summary(scenario_canonical)
        cohort_breakdown[cohort_name] = {
            "runs": int(scenario_canonical["seed"].nunique()),
            "summary": summary,
            "oracle_summary": oracle_summary(scenario_frame),
        }
    for policy in LEGACY_POLICIES[:6]:
        historical_gap = cohort_breakdown.get("historical_90k", {}).get("summary", {}).get(policy, {}).get("mean_oracle_regret", 0.0)
        stress_gap = cohort_breakdown.get("stress_500k", {}).get("summary", {}).get(policy, {}).get("mean_oracle_regret", 0.0)
        if historical_gap or stress_gap:
            dumbbell_items.append(
                {
                    "label": short_policy_name(policy),
                    "start": float(historical_gap),
                    "end": float(stress_gap),
                }
            )

    return {
        "scenario": {
            "name": scenario_name,
            "description": spec.description,
            "overrides": spec.overrides,
        },
        "runs": int(canonical["seed"].nunique()),
        "policies": LEGACY_POLICIES,
        "oracle_policy": ORACLE_POLICY,
        "oracle_summary": oracle,
        "summary": combined_summary,
        "cohorts": cohort_breakdown,
        "visuals": {
            "ranking": ranking[:6],
            "oracle_gap_dumbbell": dumbbell_items,
            "metric_heatmap": heatmap_payload(canonical, [item["policy"] for item in ranking[:6]]),
            "reward_histogram": histogram_bins(canonical["cumulative_reward"]),
        },
        "paired_effects": paired_policy_effects(frame, ORACLE_POLICY, LEGACY_POLICIES),
    }


def policy_dossiers(frame: pd.DataFrame) -> dict[str, Any]:
    dossiers: dict[str, Any] = {}
    for policy in LEGACY_POLICIES:
        policy_frame = frame[frame["policy"] == policy]
        if policy_frame.empty:
            continue
        cohort_items = []
        for cohort_name, cohort_group in policy_frame.groupby("cohort", observed=True):
            cohort_items.append(
                {
                    "label": cohort_name,
                    "value": float(cohort_group["cumulative_reward"].mean()),
                }
            )
        gap_items = []
        grouped = frame[frame["policy"].isin([policy, "ucb1"])].pivot_table(
            index=["scenario", "seed", "cohort"],
            columns="policy",
            values="cumulative_reward",
            aggfunc="first",
        )
        if policy in grouped.columns and "ucb1" in grouped.columns:
            cohort_levels = set(grouped.index.get_level_values(2))
            for scenario_name in frame["scenario"].dropna().astype(str).unique():
                historical_gap = 0.0
                stress_gap = 0.0
                if "historical_90k" in cohort_levels:
                    subset = grouped.xs("historical_90k", level=2, drop_level=False)
                    subset = subset[subset.index.get_level_values(0) == scenario_name]
                    if not subset.empty:
                        historical_gap = float((subset[policy] - subset["ucb1"]).mean())
                if "stress_500k" in cohort_levels:
                    subset = grouped.xs("stress_500k", level=2, drop_level=False)
                    subset = subset[subset.index.get_level_values(0) == scenario_name]
                    if not subset.empty:
                        stress_gap = float((subset[policy] - subset["ucb1"]).mean())
                if historical_gap or stress_gap:
                    gap_items.append(
                        {
                            "label": scenario_name,
                            "start": historical_gap,
                            "end": stress_gap,
                        }
                    )
        dossiers[policy] = {
            "policy": policy,
            "summary": {
                "mean_cumulative_reward": float(policy_frame["cumulative_reward"].mean()),
                "mean_oracle_regret": float(policy_frame["oracle_regret"].dropna().mean()) if policy_frame["oracle_regret"].notna().any() else None,
                "mean_population_hhi": float(policy_frame["population_hhi"].mean()),
                "mean_final_extraction": float(policy_frame["mean_final_extraction"].mean()),
                "scenario_count": int(policy_frame["scenario"].nunique()),
            },
            "cohort_reward_items": cohort_items,
            "distribution_bins": histogram_bins(policy_frame["cumulative_reward"]),
            "heatmap": heatmap_payload(policy_frame, [policy]),
            "scenario_gap_items": gap_items[:8],
            "paired_vs_oracle": paired_policy_effects(frame, ORACLE_POLICY, [policy]),
        }
    return dossiers


def landing_payload(
    cohort_frames: dict[str, pd.DataFrame],
    combined_frame: pd.DataFrame,
) -> dict[str, Any]:
    cohort_breakdown = []
    for cohort_name, spec in cohort_specs().items():
        frame = cohort_frames.get(cohort_name, pd.DataFrame())
        cohort_breakdown.append(
            {
                "cohort": cohort_name,
                "label": cohort_name.replace("_", " "),
                "executions": int(len(frame)),
                "config_count": int(frame["run_id"].nunique()) if not frame.empty else spec.config_count,
                "policy_count": len(spec.policies),
            }
        )
    legacy_frame = cohort_frames.get("legacy_1m", pd.DataFrame())
    legacy_summary = metric_summary(legacy_frame)
    combined_summary = metric_summary(combined_frame[combined_frame["policy"] != ORACLE_POLICY])
    combined_ranking = sorted(
        (
            {
                "label": short_policy_name(policy),
                "value": summary.get("mean_cumulative_reward", 0.0),
                "policy": policy,
            }
            for policy, summary in combined_summary.items()
        ),
        key=lambda item: item["value"],
        reverse=True,
    )
    legacy_ranking = sorted(
        (
            {
                "label": short_policy_name(policy),
                "value": summary.get("mean_cumulative_reward", 0.0),
                "policy": policy,
            }
            for policy, summary in legacy_summary.items()
        ),
        key=lambda item: item["value"],
        reverse=True,
    )
    scenario_winners = []
    for scenario_name, scenario_frame in combined_frame[combined_frame["policy"] != ORACLE_POLICY].groupby("scenario", observed=True):
        grouped = scenario_frame.groupby("policy", observed=True)["cumulative_reward"].mean().sort_values(ascending=False)
        if grouped.empty:
            continue
        policy = str(grouped.index[0])
        scenario_winners.append(
            {
                "label": scenario_name,
                "value": float(grouped.iloc[0]),
                "color": policy,
            }
        )
    return {
        "generated_at": pd.Timestamp.now("UTC").isoformat(),
        "headline_totals": {
            "legacy_1m": 1_000_008,
            "historical_90k": 90_000,
            "stress_500k": 500_000,
            "total": 1_590_008,
        },
        "cohort_breakdown": cohort_breakdown,
        "legacy_ranking": legacy_ranking[:6],
        "combined_ranking": combined_ranking[:6],
        "scenario_heatmap": heatmap_payload(combined_frame[combined_frame["policy"] != ORACLE_POLICY], [item["policy"] for item in combined_ranking[:6]]),
        "scenario_winners": scenario_winners,
        "paired_vs_ucb1": paired_policy_effects(combined_frame, "ucb1", LEGACY_POLICIES),
        "paired_vs_oracle": paired_policy_effects(combined_frame, ORACLE_POLICY, LEGACY_POLICIES),
    }


def synthesize_frontend_outputs(selected: Iterable[str] | None = None) -> dict[str, Any]:
    ensure_output_dirs()
    selected_names = list(selected or cohort_specs().keys())
    cohort_frames: dict[str, pd.DataFrame] = {}
    summaries: dict[str, Any] = {}
    for cohort_name in selected_names:
        paths = cohort_paths(cohort_name)
        frame = load_parquet(paths["parquet"])
        frame["cohort"] = cohort_name
        cohort_frames[cohort_name] = frame
        summaries[cohort_name] = {
            "rows": int(len(frame)),
            "policy_summary": metric_summary(frame),
            "scenario_count": int(frame["scenario"].nunique()) if "scenario" in frame.columns else 0,
        }
        with paths["summary"].open("w", encoding="utf-8") as handle:
            json.dump(summaries[cohort_name], handle, indent=2)

    scenario_specs = scenario_specs_by_name()
    scenario_cohorts = [cohort_frames[name] for name in ("historical_90k", "stress_500k") if name in cohort_frames]
    combined_frame = pd.concat(scenario_cohorts, ignore_index=True) if scenario_cohorts else pd.DataFrame()

    landing = landing_payload(cohort_frames, combined_frame)
    with (FRONTEND_RESULTS_ROOT / "cohort-synthesis.json").open("w", encoding="utf-8") as handle:
        json.dump(landing, handle, indent=2)

    dossiers = policy_dossiers(combined_frame) if not combined_frame.empty else {}
    with (FRONTEND_RESULTS_ROOT / "policy-dossiers.json").open("w", encoding="utf-8") as handle:
        json.dump(dossiers, handle, indent=2)

    scenario_outputs: dict[str, Any] = {}
    if not combined_frame.empty:
        cohort_sources = {
            name: cohort_frame
            for name, cohort_frame in cohort_frames.items()
            if name in {"historical_90k", "stress_500k"}
        }
        for scenario_name, scenario_frame in combined_frame.groupby("scenario", observed=True):
            spec = scenario_specs.get(str(scenario_name))
            if spec is None:
                continue
            payload = scenario_payload(
                scenario_name=str(scenario_name),
                frame=scenario_frame,
                cohort_frames=cohort_sources,
                spec=spec,
            )
            scenario_outputs[str(scenario_name)] = payload
            file_slug = f"{scenario_name}-cohort"
            with (FRONTEND_RESULTS_ROOT / f"{file_slug}.json").open("w", encoding="utf-8") as handle:
                json.dump(payload, handle, indent=2)

    return {
        "landing": landing,
        "dossiers": dossiers,
        "scenarios": scenario_outputs,
        "cohort_summaries": summaries,
    }


def write_combined_report(synthesis: dict[str, Any]) -> None:
    landing = synthesis.get("landing", {})
    totals = landing.get("headline_totals", {})
    combined_ranking = landing.get("combined_ranking", [])
    leader = combined_ranking[0] if combined_ranking else {"policy": "n/a", "value": 0.0}
    cohort_breakdown = landing.get("cohort_breakdown", [])

    lines = [
        "---",
        "tags: [report, evidence, synthesis]",
        "type: report",
        "date: 2026-04-13",
        "---",
        "",
        "# Combined Evidence Report",
        "",
        "This report consolidates three cohorts rather than treating the archive as a single sweep. The exact execution count is",
        "",
        "$$",
        rf"1{{,}}000{{,}}008 + 90{{,}}000 + 500{{,}}000 = {int(totals.get('total', 0)):,}.",
        "$$",
        "",
        "## Cohort Logic",
        "",
        "The legacy million-run cohort is a broad baseline sweep and should not be misread as scenario-resolved evidence. Scenario and oracle claims are taken from the historical ninety-thousand and stress five-hundred-thousand cohorts, which preserve explicit scenario labels and matched policy comparisons.",
        "",
        "## Estimand",
        "",
        "For matched policy comparisons we use the paired mean gap",
        "",
        "$$",
        r"\Delta_{\pi,\pi'} = \frac{1}{n}\sum_{i=1}^{n}\left(R_{i,\pi} - R_{i,\pi'}\right),",
        "$$",
        "",
        "with a paired nonparametric bootstrap interval over the matched run index.",
        "",
        "## Cohort Totals",
        "",
    ]
    for item in cohort_breakdown:
        lines.append(
            f"- `{item['cohort']}`: {int(item['executions']):,} executions, {int(item['config_count']):,} configs, {int(item['policy_count'])} policies"
        )
    lines.extend(
        [
            "",
            "## Lead Result",
            "",
            f"The current combined scenario-resolved leader is `{leader['policy']}` with mean cumulative reward {float(leader['value']):.2f}. This is not a claim of universal dominance across incompatible cohort designs; it is the top pooled result across the scenario-backed cohorts.",
            "",
            "## Frontend Use",
            "",
            "The frontend should expose the total count, cohort provenance, and cohort-specific scope. Landing material may cite the full 1.59m executions. Scenario and policy pages should cite the ninety-thousand and five-hundred-thousand cohorts for scenario-specific comparisons, with the million-run cohort retained as legacy baseline context.",
        ]
    )
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate cohort inputs, run cohorts, and synthesize frontend outputs.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    generate_parser = subparsers.add_parser("generate", help="Generate cohort JSONL inputs.")
    generate_parser.add_argument(
        "--cohort",
        choices=["legacy_1m", "historical_90k", "stress_500k", "all"],
        default="all",
    )

    run_parser = subparsers.add_parser("run", help="Run a generated cohort through the Rust sweep.")
    run_parser.add_argument("cohort", choices=["legacy_1m", "historical_90k", "stress_500k"])
    run_parser.add_argument("--limit", type=int, default=None)

    synth_parser = subparsers.add_parser("synthesize", help="Build frontend-facing cohort aggregates and the combined report.")
    synth_parser.add_argument(
        "--cohorts",
        nargs="*",
        choices=["legacy_1m", "historical_90k", "stress_500k"],
        default=None,
    )

    args = parser.parse_args()

    if args.command == "generate":
        if args.cohort == "all":
            manifests = generate_cohort_inputs()
        else:
            manifests = generate_cohort_inputs([args.cohort])
        print(json.dumps(manifests, indent=2))
        return 0

    if args.command == "run":
        run_cohort(args.cohort, limit=args.limit)
        return 0

    synthesis = synthesize_frontend_outputs(args.cohorts)
    write_combined_report(synthesis)
    print(json.dumps({"report": str(REPORT_PATH.relative_to(REPO_ROOT))}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
