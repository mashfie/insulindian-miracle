"""Insulindian Miracle backend package."""

from .analysis import analyze_hypothesis_suite, run_hypothesis_suite
from .model import SimulationConfig
from .policies import (
    DiscountedGaussianThompsonPolicy,
    DiscountedUCBPolicy,
    EpsilonGreedyPolicy,
    GaussianThompsonPolicy,
    LinearThompsonPolicy,
    LinUCBPolicy,
    MyopicOraclePolicy,
    SlidingWindowUCBPolicy,
    UCB1Policy,
    WhittleIndexPolicy,
)
from .research import fetch_papers, synthesize_theory
from .scenarios import apply_scenario, list_scenarios
from .sim import run_benchmark, run_experiment, run_policy_comparison, run_simulation
from .terrain import TerrainConfig, generate_terrain, select_candidate_sites

__all__ = [
    "DiscountedGaussianThompsonPolicy",
    "DiscountedUCBPolicy",
    "EpsilonGreedyPolicy",
    "GaussianThompsonPolicy",
    "LinearThompsonPolicy",
    "LinUCBPolicy",
    "MyopicOraclePolicy",
    "SimulationConfig",
    "SlidingWindowUCBPolicy",
    "TerrainConfig",
    "UCB1Policy",
    "WhittleIndexPolicy",
    "analyze_hypothesis_suite",
    "apply_scenario",
    "fetch_papers",
    "generate_terrain",
    "run_benchmark",
    "run_experiment",
    "run_hypothesis_suite",
    "run_policy_comparison",
    "run_simulation",
    "list_scenarios",
    "select_candidate_sites",
    "synthesize_theory",
]
