---
tags: [module, python, scenarios]
type: module
related:
  - "[[configuration]]"
  - "[[sim]]"
  - "[[hypotheses]]"
---

# scenarios.py

`src/insulindian_miracle/scenarios.py` — 267 lines. Nine pre-configured experiment variants as parameter override dicts.

## Key Exports

| Export | Purpose |
|--------|---------|
| `SCENARIOS` | Dict of `ScenarioSpec` instances keyed by name |
| `get_scenario(name)` | Lookup with error handling |
| `apply_scenario(config, name)` | Merge overrides into `SimulationConfig` |
| `list_scenarios()` | List all available `ScenarioSpec` instances |
| `ScenarioSpec` | Frozen dataclass: `name`, `description`, `overrides` |

## Scenario Registry

| Name | Overrides | Horizon | See Also |
|------|-----------|---------|----------|
| `baseline` | 0 | 300 | [[baseline]] |
| `resource-curse` | 16 | 420 | [[resource-curse-scenario]] |
| `botswana` | 12 | 420 | [[botswana]] |
| `open-cluster` | 13 | 360 | [[open-cluster]] |
| `merchant-republic` | 11 | 360 | [[merchant-republic]] |
| `megacity-trap` | 8 | 360 | [[megacity-trap]] |
| `balanced-urban-system` | 10 | 360 | [[balanced-urban]] |
| `shock-reform` | 28 | 420 | [[shock-reform]] |
| `ucb-bait` | 18 | 280 | [[ucb-bait]] |

## Override Mechanism

`apply_scenario()` is a simple dict merge:

```python
payload = asdict(config)
for key, value in scenario.overrides.items():
    payload[key] = value
return SimulationConfig.from_dict(payload)
```

Terrain sub-config can be overridden via `"terrain": {...}` in the overrides dict.
