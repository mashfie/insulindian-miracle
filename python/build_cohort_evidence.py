from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
CONFIGS_DIR = ROOT / "configs"
SCENARIOS_DIR = CONFIGS_DIR / "scenarios"
RESULTS_DIR = ROOT / "results"
COHORTS_DIR = RESULTS_DIR / "cohorts"
WEB_RESULTS_DIR = ROOT / "web" / "content" / "source" / "results"

REPORT_DATE = "2026-04-13"
LEGACY_TOTAL = 1_000_008
HISTORICAL_TOTAL = 90_000
STRESS_TOTAL = 500_000
PLANNED_TOTAL = LEGACY_TOTAL + HISTORICAL_TOTAL + STRESS_TOTAL

NON_ORACLE_POLICIES = [
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

ORACLE_BACKED_POLICIES = ["myopic-oracle", *NON_ORACLE_POLICIES]

SCENARIO_QUOTAS = {
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

SCENARIO_ALIASES = {
    "balanced-urban-system": "balanced-urban",
    "resource-curse": "resource-curse-scenario",
}

SCENARIO_SEQUENCE = [
    "baseline",
    "resource-curse",
    "botswana",
    "open-cluster",
    "merchant-republic",
    "megacity-trap",
    "balanced-urban-system",
    "shock-reform",
    "ucb-bait",
]

SCALE_FIELDS = [
    "initial_extraction_resource_bias",
    "resource_capture_gain",
    "inclusive_productivity_gain",
    "extractive_capital_erosion",
    "network_scale",
    "agglomeration_alpha",
    "secondary_city_bonus",
    "reform_sensitivity",
    "reform_step",
]

BOUNDED_FIELDS = [
    "resource_curse_strength",
    "curse_openness_buffer",
    "curse_capital_buffer",
    "congestion",
    "thompson_posterior_decay",
    "discounted_ucb_gamma",
    "discounted_thompson_posterior_decay",
    "linucb_alpha",
    "linear_thompson_sampling_scale",
]

SCENARIO_SPECIFIC_FIELDS = {
    "ucb-bait": [
        ("boomtown_early_reward_bonus", "scale"),
        ("boomtown_decay_multiplier", "scale"),
        ("active_extraction_pressure", "bounded"),
    ],
    "resource-curse": [
        ("active_extraction_pressure", "bounded"),
        ("active_resource_depletion", "bounded"),
        ("active_openness_drag", "bounded"),
    ],
    "shock-reform": [
        ("shock_probability", "bounded"),
        ("shock_reform_bonus", "scale"),
        ("shock_capital_rebuild", "scale"),
    ],
    "open-cluster": [
        ("trade_cluster_openness_bonus", "scale"),
        ("trade_cluster_capital_bonus", "scale"),
        ("trade_cluster_accessibility_bonus", "scale"),
    ],
    "merchant-republic": [
        ("trade_cluster_openness_bonus", "scale"),
        ("trade_cluster_capital_bonus", "scale"),
        ("trade_cluster_accessibility_bonus", "scale"),
    ],
}

SCALE_BUCKETS = [0.85, 0.925, 1.0, 1.075, 1.15]
BOUNDED_BUCKETS = [-0.08, -0.04, 0.0, 0.04, 0.08]
INTEGER_BUCKETS = [-12, -6, 0, 6, 12]

METRIC_FIELDS = [
    "cumulative_reward",
    "oracle_reward",
    "oracle_regret",
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


@dataclass(frozen=True)
class CohortSpec:
    cohort: str
    total_executions: int
    policies: list[str]
    input_path: Path
    output_path: Path
    manifest_path: Path


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def stable_index(*parts: Any, modulo: int) -> int:
    digest = hashlib.sha256("|".join(str(part) for part in parts).encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big") % modulo


def clip01(value: float) -> float:
    return max(0.0, min(1.0, value))


def perturb_value(field: str, value: Any, cohort_index: int, scenario: str) -> Any:
    if field in SCALE_FIELDS and isinstance(value, (int, float)):
        factor = SCALE_BUCKETS[stable_index(field, cohort_index, scenario, modulo=len(SCALE_BUCKETS))]
        return round(float(value) * factor, 6)

    if field in BOUNDED_FIELDS and isinstance(value, (int, float)):
        delta = BOUNDED_BUCKETS[stable_index(field, cohort_index, scenario, modulo=len(BOUNDED_BUCKETS))]
        return round(clip01(float(value) + delta), 6)

    if isinstance(value, int) and field in {"horizon", "boomtown_bonus_duration", "boomtown_collapse_threshold"}:
        delta = INTEGER_BUCKETS[stable_index(field, cohort_index, scenario, modulo=len(INTEGER_BUCKETS))]
        return max(1, int(value + delta))

    return value


def apply_scenario(base_config: dict[str, Any], scenario_name: str) -> tuple[dict[str, Any], dict[str, Any]]:
    scenario_path = SCENARIOS_DIR / f"{scenario_name}.json"
    scenario_payload = load_json(scenario_path)
    merged = json.loads(json.dumps(base_config))
    for key, value in scenario_payload.get("overrides", {}).items():
        merged[key] = value
    return merged, scenario_payload


def prepare_legacy_manifest() -> CohortSpec:
    input_path = CONFIGS_DIR / "sweep_configs.jsonl"
    output_path = COHORTS_DIR / "legacy_1m" / "legacy_1m.parquet"
    manifest_path = COHORTS_DIR / "legacy_1m" / "manifest.json"
    manifest = {
        "cohort": "legacy_1m",
        "date": REPORT_DATE,
        "description": "Legacy seed-only baseline sweep inferred from the checked-in million-run generator.",
        "input_path": str(input_path.relative_to(ROOT)),
        "output_path": str(output_path.relative_to(ROOT)),
        "policies": NON_ORACLE_POLICIES,
        "rows": LEGACY_TOTAL,
        "configs": 111_112,
        "scenario_label": "sweep",
    }
    write_json(manifest_path, manifest)
    return CohortSpec("legacy_1m", LEGACY_TOTAL, NON_ORACLE_POLICIES, input_path, output_path, manifest_path)


def prepare_historical_manifest() -> CohortSpec:
    input_path = COHORTS_DIR / "historical_90k" / "historical_90k.jsonl"
    output_path = COHORTS_DIR / "historical_90k" / "historical_90k.parquet"
    manifest_path = COHORTS_DIR / "historical_90k" / "manifest.json"
    base_config = load_json(CONFIGS_DIR / "default.json")

    input_path.parent.mkdir(parents=True, exist_ok=True)
    with input_path.open("w", encoding="utf-8") as handle:
        run_id = 0
        for scenario_name in SCENARIO_SEQUENCE:
            scenario_config, _scenario_payload = apply_scenario(base_config, scenario_name)
            for seed in range(1_000):
                config = json.loads(json.dumps(scenario_config))
                config["seed"] = seed
                config["run_id"] = run_id
                config["lod"] = "LOW"
                record = {"scenario": scenario_name, "config": config}
                handle.write(json.dumps(record) + "\n")
                run_id += 1

    manifest = {
        "cohort": "historical_90k",
        "date": REPORT_DATE,
        "description": "Historical canonical scenario suite reconstructed as 9 scenarios × 1,000 seeds × 10 policies.",
        "input_path": str(input_path.relative_to(ROOT)),
        "output_path": str(output_path.relative_to(ROOT)),
        "policies": ORACLE_BACKED_POLICIES,
        "rows": HISTORICAL_TOTAL,
        "configs": 9_000,
        "scenario_counts": {name: 1_000 for name in SCENARIO_SEQUENCE},
    }
    write_json(manifest_path, manifest)
    return CohortSpec("historical_90k", HISTORICAL_TOTAL, ORACLE_BACKED_POLICIES, input_path, output_path, manifest_path)


def prepare_stress_manifest() -> CohortSpec:
    input_path = COHORTS_DIR / "stress_500k" / "stress_500k.jsonl"
    output_path = COHORTS_DIR / "stress_500k" / "stress_500k.parquet"
    manifest_path = COHORTS_DIR / "stress_500k" / "manifest.json"
    base_config = load_json(CONFIGS_DIR / "default.json")

    input_path.parent.mkdir(parents=True, exist_ok=True)
    with input_path.open("w", encoding="utf-8") as handle:
        run_id = 0
        for scenario_name, quota in SCENARIO_QUOTAS.items():
            scenario_config, scenario_payload = apply_scenario(base_config, scenario_name)
            for cohort_index in range(quota):
                config = json.loads(json.dumps(scenario_config))
                config["seed"] = cohort_index
                config["run_id"] = run_id
                config["lod"] = "LOW"

                for field in SCALE_FIELDS + BOUNDED_FIELDS:
                    if field in config:
                        config[field] = perturb_value(field, config[field], cohort_index, scenario_name)

                for field, mode in SCENARIO_SPECIFIC_FIELDS.get(scenario_name, []):
                    if field in config:
                        if mode == "scale":
                            factor = SCALE_BUCKETS[
                                stable_index(field, scenario_name, cohort_index, "scale", modulo=len(SCALE_BUCKETS))
                            ]
                            config[field] = round(float(config[field]) * factor, 6)
                        elif mode == "bounded":
                            delta = BOUNDED_BUCKETS[
                                stable_index(field, scenario_name, cohort_index, "bounded", modulo=len(BOUNDED_BUCKETS))
                            ]
                            config[field] = round(clip01(float(config[field]) + delta), 6)

                record = {"scenario": scenario_name, "config": config}
                handle.write(json.dumps(record) + "\n")
                run_id += 1

    manifest = {
        "cohort": "stress_500k",
        "date": REPORT_DATE,
        "description": "Stress-heavy stratified sweep weighted toward trap, curse, and shock regimes.",
        "input_path": str(input_path.relative_to(ROOT)),
        "output_path": str(output_path.relative_to(ROOT)),
        "policies": ORACLE_BACKED_POLICIES,
        "rows": STRESS_TOTAL,
        "configs": 50_000,
        "scenario_counts": SCENARIO_QUOTAS,
    }
    write_json(manifest_path, manifest)
    return CohortSpec("stress_500k", STRESS_TOTAL, ORACLE_BACKED_POLICIES, input_path, output_path, manifest_path)


def prepare_all() -> list[CohortSpec]:
    return [
        prepare_legacy_manifest(),
        prepare_historical_manifest(),
        prepare_stress_manifest(),
    ]


def parquet_available(spec: CohortSpec) -> bool:
    return spec.output_path.exists() and spec.output_path.stat().st_size > 0


def run_cohort(spec: CohortSpec, binary: Path, limit: int | None = None) -> None:
    command = [
        str(binary),
        "sweep",
        "--input",
        str(spec.input_path),
    ]
    for policy in spec.policies:
        command.extend(["-p", policy])
    command.extend(["--output", str(spec.output_path)])
    if limit is not None:
        command.extend(["--limit", str(limit)])
    subprocess.run(command, check=True, cwd=ROOT)


def metric_summary(frame: pd.DataFrame, fields: list[str]) -> dict[str, Any]:
    output: dict[str, Any] = {"runs": float(len(frame))}
    for field in fields:
        if field not in frame.columns:
            continue
        series = frame[field].dropna()
        if series.empty:
            continue
        output[f"mean_{field}"] = float(series.mean())
        output[f"std_{field}"] = float(series.std(ddof=1)) if len(series) > 1 else 0.0
    return output


def bootstrap_ci(values: np.ndarray, seed: int = 7, draws: int = 1_000) -> tuple[float, float]:
    if values.size == 0:
        return (math.nan, math.nan)
    if values.size == 1:
        only = float(values[0])
        return (only, only)
    rng = np.random.default_rng(seed)
    samples = rng.choice(values, size=(draws, values.size), replace=True).mean(axis=1)
    return (float(np.quantile(samples, 0.025)), float(np.quantile(samples, 0.975)))


def load_frontend_suite() -> tuple[dict[str, Any], dict[str, Any]]:
    scenarios: dict[str, Any] = {}

    for path in sorted(WEB_RESULTS_DIR.glob("*-experiment*.json")):
        payload = load_json(path)
        scenario_name = payload.get("scenario", {}).get("name")
        if not scenario_name:
            continue
        current = {
            "file_slug": path.stem,
            "runs": payload.get("runs", 0),
            "scenario": payload.get("scenario", {}),
            "oracle_summary": payload.get("oracle_summary", {}),
            "summary": payload.get("summary", {}),
        }
        previous = scenarios.get(scenario_name)
        if previous is None or (
            int(current["runs"]) * len(current["summary"]) > int(previous["runs"]) * len(previous["summary"])
        ):
            scenarios[scenario_name] = current

    policy_matrix: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for scenario_name, payload in scenarios.items():
        for policy_name, metrics in payload.get("summary", {}).items():
            policy_matrix[policy_name].append(
                {
                    "scenario": scenario_name,
                    "mean_cumulative_reward": metrics.get("mean_cumulative_reward"),
                    "mean_oracle_regret": metrics.get("mean_oracle_regret"),
                    "mean_final_extraction": metrics.get("mean_final_extraction"),
                    "mean_selection_hhi": metrics.get("mean_selection_hhi"),
                    "mean_zipf_slope": metrics.get("mean_zipf_slope"),
                }
            )
    return scenarios, policy_matrix


def build_policy_dossiers(frontend_policy_matrix: dict[str, list[dict[str, Any]]], cohort_frames: dict[str, pd.DataFrame]) -> dict[str, Any]:
    dossiers: dict[str, Any] = {}
    for policy, scenario_rows in frontend_policy_matrix.items():
        ordered = sorted(
            [row for row in scenario_rows if row.get("mean_cumulative_reward") is not None],
            key=lambda row: row["mean_cumulative_reward"],
            reverse=True,
        )
        cohort_metrics: dict[str, Any] = {}
        for cohort_name, frame in cohort_frames.items():
            sub = frame.loc[frame["policy"] == policy]
            if sub.empty:
                continue
            cohort_metrics[cohort_name] = {
                "rows": int(len(sub)),
                "mean_cumulative_reward": float(sub["cumulative_reward"].mean()),
                "mean_oracle_regret": float(sub["oracle_regret"].dropna().mean()) if "oracle_regret" in sub else None,
                "mean_population_hhi": float(sub["population_hhi"].mean()),
            }
        dossiers[policy] = {
            "policy": policy,
            "best_checked_in_scenarios": ordered[:4],
            "worst_checked_in_scenarios": ordered[-4:],
            "cohorts": cohort_metrics,
        }
    return {
        "generated_at": REPORT_DATE,
        "policies": dossiers,
    }


def summarize_cohort_frames(specs: list[CohortSpec]) -> tuple[dict[str, Any], dict[str, pd.DataFrame]]:
    front_scenarios, front_policy_matrix = load_frontend_suite()
    cohort_frames: dict[str, pd.DataFrame] = {}
    cohort_payloads: dict[str, Any] = {}

    for spec in specs:
        if parquet_available(spec):
            frame = pd.read_parquet(spec.output_path)
            cohort_frames[spec.cohort] = frame
            cohort_payloads[spec.cohort] = {
                "status": "materialized",
                "rows": int(len(frame)),
                "input_path": str(spec.input_path.relative_to(ROOT)),
                "output_path": str(spec.output_path.relative_to(ROOT)),
            }
        else:
            cohort_payloads[spec.cohort] = {
                "status": "manifest_ready",
                "rows": spec.total_executions,
                "input_path": str(spec.input_path.relative_to(ROOT)),
                "output_path": str(spec.output_path.relative_to(ROOT)),
            }

    combined_frame = (
        pd.concat(
            [
                frame.assign(cohort=cohort_name)
                for cohort_name, frame in cohort_frames.items()
            ],
            ignore_index=True,
        )
        if cohort_frames
        else pd.DataFrame()
    )

    checked_in_total = 0
    checked_in_rankings: list[dict[str, Any]] = []
    policy_accumulator: dict[str, list[float]] = defaultdict(list)
    for scenario in front_scenarios.values():
        scenario_runs = int(scenario.get("runs", 0))
        summary = scenario.get("summary", {})
        checked_in_total += scenario_runs * (len(summary) + 1)
        for policy_name, metrics in summary.items():
            if metrics.get("mean_cumulative_reward") is not None:
                policy_accumulator[policy_name].append(float(metrics["mean_cumulative_reward"]))

    for policy_name, values in policy_accumulator.items():
        checked_in_rankings.append(
            {
                "policy": policy_name,
                "checked_in_mean_cumulative_reward": float(np.mean(values)),
            }
        )

    checked_in_rankings.sort(
        key=lambda row: row["checked_in_mean_cumulative_reward"],
        reverse=True,
    )

    combined_summary: dict[str, Any] = {
        "planned_total_executions": PLANNED_TOTAL,
        "planned_breakdown": {
            "legacy_1m": LEGACY_TOTAL,
            "historical_90k": HISTORICAL_TOTAL,
            "stress_500k": STRESS_TOTAL,
        },
        "materialized_checked_in_suite": {
            "executions": checked_in_total,
            "scenarios": sorted(front_scenarios.keys()),
            "policy_ranking": checked_in_rankings,
        },
        "materialized_cohort_rows": int(len(combined_frame)),
    }

    if not combined_frame.empty:
        policy_rows: list[dict[str, Any]] = []
        for policy_name, group in combined_frame.groupby("policy"):
            entry = {
                "policy": policy_name,
                "rows": int(len(group)),
                "mean_cumulative_reward": float(group["cumulative_reward"].mean()),
                "mean_population_hhi": float(group["population_hhi"].mean()),
            }
            paired = group["oracle_regret"].dropna().to_numpy(dtype=float)
            if paired.size:
                entry["oracle_regret_ci95"] = list(bootstrap_ci(paired))
                entry["mean_oracle_regret"] = float(paired.mean())
            policy_rows.append(entry)
        combined_summary["materialized_cohort_policy_ranking"] = sorted(
            policy_rows,
            key=lambda row: row["mean_cumulative_reward"],
            reverse=True,
        )

    payload = {
        "generated_at": REPORT_DATE,
        "cohorts": cohort_payloads,
        "combined": combined_summary,
        "checked_in_frontend_suite": {
            "scenario_count": len(front_scenarios),
            "scenarios": front_scenarios,
        },
    }

    write_json(WEB_RESULTS_DIR / "cohort-evidence.json", payload)
    write_json(WEB_RESULTS_DIR / "policy-dossiers.json", build_policy_dossiers(front_policy_matrix, cohort_frames))
    return payload, cohort_frames


def main() -> None:
    parser = argparse.ArgumentParser(description="Build cohort manifests and synthesize frontend evidence.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("prepare", help="Generate manifests and JSONL inputs for all cohorts.")

    run_parser = subparsers.add_parser("run", help="Execute a single cohort with the Rust release binary.")
    run_parser.add_argument("cohort", choices=["legacy_1m", "historical_90k", "stress_500k"])
    run_parser.add_argument("--limit", type=int, default=None)
    run_parser.add_argument(
        "--binary",
        type=Path,
        default=ROOT / "target" / "release" / "insulindian-miracle.exe",
    )

    subparsers.add_parser("synthesize", help="Build frontend evidence payloads from manifests and available artifacts.")

    args = parser.parse_args()
    specs = {spec.cohort: spec for spec in prepare_all()}

    if args.command == "prepare":
        return
    if args.command == "run":
        run_cohort(specs[args.cohort], args.binary, args.limit)
        return
    if args.command == "synthesize":
        summarize_cohort_frames(list(specs.values()))
        return


if __name__ == "__main__":
    main()
