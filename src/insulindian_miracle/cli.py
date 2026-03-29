from __future__ import annotations

import argparse
import json
from pathlib import Path

from .analysis import run_hypothesis_suite
from .model import SimulationConfig
from .research import fetch_papers, synthesize_theory
from .scenarios import list_scenarios
from .sim import run_benchmark, run_experiment, run_simulation, run_sweep, write_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="insulindian-miracle")
    subparsers = parser.add_subparsers(dest="command", required=True)

    research_parser = subparsers.add_parser("research")
    research_subparsers = research_parser.add_subparsers(dest="research_command", required=True)

    fetch_parser = research_subparsers.add_parser("fetch")
    fetch_parser.add_argument("--manifest", default="research/index.json")
    fetch_parser.add_argument("--cache", required=True)

    synth_parser = research_subparsers.add_parser("synthesize")
    synth_parser.add_argument("--manifest", default="research/index.json")
    synth_parser.add_argument("--out", default="research/theory/corpus-synthesis.md")

    sim_parser = subparsers.add_parser("sim")
    sim_subparsers = sim_parser.add_subparsers(dest="sim_command", required=True)

    run_parser = sim_subparsers.add_parser("run")
    run_parser.add_argument("--config")
    run_parser.add_argument("--scenario", default=None)
    run_parser.add_argument("--policy", default="gaussian-thompson")
    run_parser.add_argument("--output")

    sweep_parser = sim_subparsers.add_parser("sweep")
    sweep_parser.add_argument("--config")
    sweep_parser.add_argument("--scenario", default=None)
    sweep_parser.add_argument("--policies", nargs="+", default=["epsilon-greedy", "ucb1", "gaussian-thompson", "whittle-index"])
    sweep_parser.add_argument("--runs", type=int, default=3)
    sweep_parser.add_argument("--output")

    benchmark_parser = sim_subparsers.add_parser("benchmark")
    benchmark_parser.add_argument("--seed", type=int, default=7)
    benchmark_parser.add_argument("--scenario", default="baseline")
    benchmark_parser.add_argument("--output")

    experiment_parser = sim_subparsers.add_parser("experiment")
    experiment_parser.add_argument("--config")
    experiment_parser.add_argument("--scenario", default="baseline")
    experiment_parser.add_argument("--policies", nargs="+", default=["epsilon-greedy", "ucb1", "gaussian-thompson", "whittle-index"])
    experiment_parser.add_argument("--runs", type=int, default=12)
    experiment_parser.add_argument("--output")

    hypotheses_parser = sim_subparsers.add_parser("hypotheses")
    hypotheses_parser.add_argument("--config")
    hypotheses_parser.add_argument("--policies", nargs="+", default=["epsilon-greedy", "ucb1", "gaussian-thompson", "whittle-index"])
    hypotheses_parser.add_argument("--runs", type=int, default=12)
    hypotheses_parser.add_argument("--include-experiments", action="store_true")
    hypotheses_parser.add_argument("--output")

    sim_subparsers.add_parser("scenarios")

    return parser


def _load_config(path: str | None) -> SimulationConfig:
    if path is None:
        return SimulationConfig()
    return SimulationConfig.from_path(Path(path))


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "research":
        if args.research_command == "fetch":
            report = fetch_papers(args.manifest, args.cache)
            print(json.dumps(report.to_dict(), indent=2))
            return 0
        if args.research_command == "synthesize":
            content = synthesize_theory(args.manifest, args.out)
            print(content)
            return 0

    if args.command == "sim":
        if args.sim_command == "run":
            config = _load_config(args.config)
            result = run_simulation(config, policy_name=args.policy, scenario_name=args.scenario)
            payload = result.to_dict()
            if args.output:
                write_json(args.output, payload)
            else:
                print(json.dumps(payload, indent=2))
            return 0
        if args.sim_command == "sweep":
            config = _load_config(args.config)
            payload = run_sweep(config, args.policies, args.runs, scenario_name=args.scenario)
            if args.output:
                write_json(args.output, payload)
            else:
                print(json.dumps(payload, indent=2))
            return 0
        if args.sim_command == "benchmark":
            payload = run_benchmark(seed=args.seed, scenario_name=args.scenario)
            if args.output:
                write_json(args.output, payload)
            else:
                print(json.dumps(payload, indent=2))
            return 0
        if args.sim_command == "experiment":
            config = _load_config(args.config)
            payload = run_experiment(config, args.policies, args.runs, scenario_name=args.scenario)
            if args.output:
                write_json(args.output, payload)
            else:
                print(json.dumps(payload, indent=2))
            return 0
        if args.sim_command == "hypotheses":
            config = _load_config(args.config)
            payload = run_hypothesis_suite(
                config,
                policies=args.policies,
                runs=args.runs,
                include_experiments=args.include_experiments,
            )
            if args.output:
                write_json(args.output, payload)
            else:
                print(json.dumps(payload, indent=2))
            return 0
        if args.sim_command == "scenarios":
            payload = [scenario.to_dict() for scenario in list_scenarios()]
            print(json.dumps(payload, indent=2))
            return 0

    parser.error("Unknown command.")
    return 2
