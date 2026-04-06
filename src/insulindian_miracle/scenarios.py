from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from .model import SimulationConfig


@dataclass(frozen=True, slots=True)
class ScenarioSpec:
    name: str
    description: str
    overrides: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "overrides": self.overrides,
        }


SCENARIOS: dict[str, ScenarioSpec] = {
    "baseline": ScenarioSpec(
        name="baseline",
        description="Default peninsula dynamics with moderate resource rents and modest institutional drift.",
        overrides={},
    ),
    "resource-curse": ScenarioSpec(
        name="resource-curse",
        description="Resource-rich sites start more extractive and remain tempting long enough to become traps.",
        overrides={
            "horizon": 420,
            "resource_capture_gain": 1.8,
            "resource_curse_strength": 0.13,
            "curse_openness_buffer": 0.12,
            "curse_capital_buffer": 0.08,
            "inclusive_investment_gain": 0.06,
            "inclusive_productivity_gain": 0.46,
            "extractive_capital_erosion": 0.09,
            "active_extraction_pressure": 0.18,
            "active_resource_depletion": 0.08,
            "active_openness_drag": 0.028,
            "active_decay_onset": 1,
            "initial_extraction_resource_bias": 5.2,
            "initial_openness_alpha": 1.8,
            "initial_openness_beta": 2.8,
            "initial_adaptability_alpha": 2.2,
            "initial_adaptability_beta": 3.4,
            "reform_sensitivity": 2.4,
            "network_scale": 0.28,
        },
    ),
    "botswana": ScenarioSpec(
        name="botswana",
        description="Resource rents remain high, but inclusive and adaptive initial institutions soften the curse.",
        overrides={
            "horizon": 420,
            "resource_capture_gain": 1.45,
            "resource_curse_strength": 0.035,
            "curse_openness_buffer": 0.7,
            "curse_capital_buffer": 0.62,
            "inclusive_investment_gain": 0.22,
            "inclusive_productivity_gain": 0.9,
            "extractive_capital_erosion": 0.022,
            "active_extraction_pressure": 0.015,
            "active_resource_depletion": 0.006,
            "active_openness_drag": 0.003,
            "active_decay_onset": 10,
            "initial_extraction_resource_bias": 0.15,
            "initial_openness_alpha": 3.6,
            "initial_openness_beta": 1.6,
            "initial_adaptability_alpha": 4.0,
            "initial_adaptability_beta": 2.0,
            "network_scale": 0.46,
            "network_capital_gain": 0.62,
        },
    ),
    "open-cluster": ScenarioSpec(
        name="open-cluster",
        description="Trade-oriented sites begin more open and get stronger spatial spillovers from nearby peers.",
        overrides={
            "horizon": 360,
            "initial_openness_alpha": 3.4,
            "initial_openness_beta": 1.7,
            "network_scale": 0.58,
            "network_population_gain": 0.18,
            "network_capital_gain": 0.75,
            "network_density_gain": 1.1,
            "inclusive_investment_gain": 0.15,
            "inclusive_productivity_gain": 0.72,
            "congestion": 0.0014,
            "resource_curse_strength": 0.03,
            "active_extraction_pressure": 0.015,
            "active_resource_depletion": 0.004,
            "active_decay_onset": 8,
            "trade_cluster_count": 5,
            "trade_cluster_radius": 0.28,
            "trade_cluster_openness_bonus": 0.34,
            "trade_cluster_capital_bonus": 0.38,
            "trade_cluster_accessibility_bonus": 0.16,
        },
    ),
    "merchant-republic": ScenarioSpec(
        name="merchant-republic",
        description="Port-led city clusters coordinate through trade and capital accumulation rather than extractive rents.",
        overrides={
            "horizon": 360,
            "initial_openness_alpha": 4.1,
            "initial_openness_beta": 1.4,
            "network_scale": 0.72,
            "network_population_gain": 0.16,
            "network_capital_gain": 0.92,
            "network_density_gain": 1.22,
            "inclusive_investment_gain": 0.19,
            "inclusive_productivity_gain": 0.82,
            "resource_curse_strength": 0.022,
            "congestion": 0.0018,
            "trade_cluster_count": 4,
            "trade_cluster_radius": 0.24,
            "trade_cluster_openness_bonus": 0.28,
            "trade_cluster_capital_bonus": 0.32,
            "trade_cluster_accessibility_bonus": 0.18,
        },
    ),
    "megacity-trap": ScenarioSpec(
        name="megacity-trap",
        description="One dominant metropolis absorbs activity early, then system-wide overstretch and weak secondary cities drag on long-run performance.",
        overrides={
            "horizon": 360,
            "network_scale": 0.42,
            "network_population_gain": 0.14,
            "network_capital_gain": 0.3,
            "network_density_gain": 0.38,
            "secondary_city_bonus": 0.18,
            "secondary_city_target": 24.0,
            "secondary_city_spread": 0.38,
            "metropolitan_overstretch_threshold": 15.0,
            "metropolitan_overstretch_penalty": 0.13,
            "congestion": 0.0022,
            "resource_curse_strength": 0.05,
        },
    ),
    "balanced-urban-system": ScenarioSpec(
        name="balanced-urban-system",
        description="Several midsize cities prosper together, producing a more stable hierarchy than either the baseline or a primate-city regime.",
        overrides={
            "horizon": 360,
            "initial_openness_alpha": 2.6,
            "initial_openness_beta": 2.0,
            "network_scale": 0.5,
            "network_population_gain": 0.14,
            "network_capital_gain": 0.58,
            "network_density_gain": 0.84,
            "secondary_city_bonus": 1.22,
            "secondary_city_target": 14.0,
            "secondary_city_spread": 1.08,
            "metropolitan_overstretch_threshold": 28.0,
            "metropolitan_overstretch_penalty": 0.02,
            "congestion": 0.0021,
            "inclusive_investment_gain": 0.14,
            "inclusive_productivity_gain": 0.76,
        },
    ),
    "shock-reform": ScenarioSpec(
        name="shock-reform",
        description="Early depletion shocks raise crisis pressure and create reform opportunities.",
        overrides={
            "horizon": 420,
            "shock_probability": 0.05,
            "depletion_rate": 0.3,
            "shock_target_resource_bias": 3.0,
            "reform_sensitivity": 3.0,
            "reform_step": 0.26,
            "resource_curse_strength": 0.13,
            "inclusive_investment_gain": 0.08,
            "inclusive_productivity_gain": 0.5,
            "extractive_capital_erosion": 0.07,
            "network_scale": 0.2,
            "network_capital_gain": 0.18,
            "network_density_gain": 0.45,
            "shock_reform_memory": 18,
            "shock_reform_bonus": 6.0,
            "shock_reform_step_bonus": 1.4,
            "shock_openness_bonus": 0.08,
            "shock_capital_rebuild": 0.14,
            "shock_transition_duration": 44,
            "shock_transition_adaptability_bonus": 0.24,
            "shock_transition_curse_buffer": 0.42,
            "shock_transition_extraction_decay": 0.035,
            "shock_transition_extraction_cap": 0.58,
            "shock_transition_openness_gain": 0.012,
            "shock_transition_capital_gain": 0.014,
            "shock_legacy_fade": 0.012,
            "shock_legacy_adaptability_bonus": 0.08,
            "shock_legacy_curse_buffer": 0.26,
            "shock_legacy_extraction_decay": 0.01,
            "shock_legacy_extraction_brake": 0.3,
            "shock_legacy_openness_gain": 0.004,
            "shock_readiness_weight": 1.6,
            "shock_lock_in_bonus": 0.1,
            "shock_snapback_pressure": 0.25,
            "active_extraction_pressure": 0.12,
            "active_resource_depletion": 0.04,
            "active_openness_drag": 0.025,
            "active_decay_onset": 2,
        },
    ),
    "ucb-bait": ScenarioSpec(
        name="ucb-bait",
        description="Short-run resource returns spike hard while institutional decay accelerates behind them.",
        overrides={
            "horizon": 280,
            "resource_capture_gain": 2.45,
            "resource_curse_strength": 0.14,
            "curse_openness_buffer": 0.12,
            "curse_capital_buffer": 0.08,
            "inclusive_investment_gain": 0.06,
            "inclusive_productivity_gain": 0.48,
            "extractive_capital_erosion": 0.09,
            "active_extraction_pressure": 0.28,
            "active_resource_depletion": 0.12,
            "active_openness_drag": 0.035,
            "active_decay_onset": 6,
            "boomtown_count": 1,
            "boomtown_resource_bonus": 0.65,
            "boomtown_geography_penalty": 0.05,
            "boomtown_initial_extraction_boost": 0.2,
            "boomtown_early_reward_bonus": 6.0,
            "boomtown_bonus_duration": 42,
            "boomtown_collapse_penalty": 0.5,
            "boomtown_collapse_threshold": 24,
            "boomtown_decay_multiplier": 6.0,
            "thompson_posterior_decay": 0.92,
            "initial_extraction_resource_bias": 5.75,
            "reform_sensitivity": 1.8,
            "reform_step": 0.12,
            "network_scale": 0.24,
        },
    ),
}


def list_scenarios() -> list[ScenarioSpec]:
    return list(SCENARIOS.values())


def get_scenario(name: str) -> ScenarioSpec:
    try:
        return SCENARIOS[name]
    except KeyError as exc:
        supported = ", ".join(sorted(SCENARIOS))
        raise ValueError(f"Unknown scenario '{name}'. Available scenarios: {supported}") from exc


def apply_scenario(config: SimulationConfig, name: str | None) -> SimulationConfig:
    if name is None:
        return config

    scenario = get_scenario(name)
    valid_keys = set(SimulationConfig.__dataclass_fields__) | {"terrain"}
    unknown = set(scenario.overrides) - valid_keys
    if unknown:
        raise ValueError(f"Scenario '{name}' has unknown config keys: {sorted(unknown)}")
    payload = asdict(config)
    for key, value in scenario.overrides.items():
        if key == "terrain":
            payload["terrain"] = {**payload["terrain"], **value}
            continue
        payload[key] = value
    return SimulationConfig.from_dict(payload)
