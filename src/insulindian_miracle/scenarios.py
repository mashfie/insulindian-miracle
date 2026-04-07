from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
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


def _get_scenarios_dir() -> Path:
    # Look for configs relative to the project root
    # Package is in src/insulindian_miracle/
    return Path(__file__).parent.parent.parent / "configs" / "scenarios"


def list_scenarios() -> list[ScenarioSpec]:
    scenarios = []
    config_dir = _get_scenarios_dir()
    if not config_dir.exists():
        return []
    
    for path in config_dir.glob("*.json"):
        try:
            with path.open("r", encoding="utf-8") as f:
                data = json.load(f)
                scenarios.append(ScenarioSpec(**data))
        except (json.JSONDecodeError, TypeError, KeyError):
            continue
    return sorted(scenarios, key=lambda s: s.name)


def get_scenario(name: str) -> ScenarioSpec:
    config_dir = _get_scenarios_dir()
    path = config_dir / f"{name}.json"
    if not path.exists():
        supported = ", ".join(sorted(s.name for s in list_scenarios()))
        raise ValueError(f"Unknown scenario '{name}'. Available scenarios: {supported}")
    
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
        return ScenarioSpec(**data)


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
