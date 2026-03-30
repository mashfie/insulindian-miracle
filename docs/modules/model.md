---
tags: [module, python]
type: module
related:
  - "[[reward-function]]"
  - "[[institutional-dynamics]]"
  - "[[simulation-loop]]"
  - "[[terrain]]"
---

# model.py

`src/insulindian_miracle/model.py` — 632 lines. Core data models, reward computation, and institutional evolution.

## Key Exports

| Export | Type | Purpose |
|--------|------|---------|
| `SimulationConfig` | dataclass | 90+ field configuration for all simulation behaviour |
| `InstitutionState` | dataclass | `extraction`, `openness`, `adaptability`, `reform_timer` |
| `SiteState` | dataclass | Mutable per-site state: institution, population, capital, shock history |
| `SiteOutcome` | dataclass | Post-simulation summary of a site's trajectory |
| `SimulationResult` | dataclass | Full run output: reward history, populations, site outcomes, metrics |
| `EvolveReport` | dataclass | Per-step output of `evolve_sites()`: rewards + shock target |
| `Observation` | dataclass | Step/site/reward record |
| `compute_reward()` | function | Instantaneous reward for a site — see [[reward-function]] |
| `evolve_sites()` | function | Full site evolution step — see [[institutional-dynamics]] |
| `initialize_site_states()` | function | Draw initial institutions from Beta distributions |
| `base_geography()` | function | Weighted sum of geographic features |
| `network_bonus()` | function | Spatial trade spillover calculation |
| `institutional_readiness()` | function | Shock resilience score |
| `sigmoid()` | function | Logistic sigmoid utility |

## Dependencies

- `terrain.Site`, `terrain.TerrainConfig` — geographic data structures
- `numpy` — array operations, random number generation
- `math`, `json`, `pathlib` — standard library

## Data Flow

```
TerrainConfig ──► SimulationConfig
                       │
                       ▼
Site[] ──► initialize_site_states() ──► SiteState[]
                                           │
                       ┌───────────────────┤
                       ▼                   ▼
              compute_reward()      evolve_sites()
                       │                   │
                       ▼                   ▼
                   float              EvolveReport
```
