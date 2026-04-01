---
tags: [system, configuration]
type: system
related:
  - "[[model]]"
  - "[[scenarios]]"
  - "[[architecture-overview]]"
---

# Configuration

All simulation behaviour is controlled through `SimulationConfig` (`model.py:53–159`), a dataclass with 90+ fields. Defaults produce the [[baseline]] scenario.

## Loading

```python
# From defaults
config = SimulationConfig()

# From JSON file
config = SimulationConfig.from_path("configs/default.json")

# From dict (e.g., scenario overrides)
config = SimulationConfig.from_dict(payload)
```

## Parameter Categories

### Terrain

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `terrain.width` | 64 | Grid columns |
| `terrain.height` | 64 | Grid rows |
| `terrain.seed` | 7 | RNG seed for Perlin noise |
| `terrain.octaves` | 4 | Fractal noise layers |
| `terrain.persistence` | 0.5 | Octave amplitude decay |
| `terrain.lacunarity` | 2.0 | Octave frequency multiplier |
| `terrain.sea_level` | 0.08 | Land/sea threshold |

### Simulation

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `horizon` | 300 | Total timesteps |
| `num_sites` | 15 | Candidate settlement count |
| `min_site_spacing` | 0.12 | Minimum distance between sites |
| `seed` | 7 | RNG seed for institutions and shocks |

### Institutional Initialisation

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `initial_extraction_alpha/beta` | 2.0 / 5.0 | Beta distribution for extraction |
| `initial_extraction_resource_bias` | 2.5 | Resource-rich sites start more extractive |
| `initial_openness_alpha/beta` | 2.2 / 2.2 | Beta distribution for openness |
| `initial_adaptability_alpha/beta` | 3.0 / 3.0 | Beta distribution for adaptability |

### Reward Function

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `agglomeration_alpha` | 0.52 | Inclusive growth exponent |
| `extraction_drag` | 0.08 | Linear penalty per extraction·pop |
| `congestion` | 0.003 | Quadratic congestion coefficient |
| `geography_weights` | (0.28, 0.18, 0.20, 0.16, 0.18) | Port, river, arability, defense, access |

### Network Effects

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `network_scale` | 0.35 | Distance decay for trade spillovers |
| `network_population_gain` | 0.12 | Population contribution to trade mass |
| `network_capital_gain` | 0.45 | Capital contribution to trade mass |
| `network_density_gain` | 0.7 | Density amplification of network |

### Resource Curse

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `resource_curse_strength` | 0.04 | Extraction drift rate |
| `curse_openness_buffer` | 0.35 | Openness protection against drift |
| `curse_capital_buffer` | 0.25 | Capital protection against drift |
| `resource_base_payoff` | 0.2 | Resource revenue floor |
| `resource_capture_gain` | 1.35 | Resource revenue scaling with extraction |

### Reform

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `reform_sensitivity` | 3.0 | How strongly reward decline triggers reform |
| `reform_step` | 0.18 | Extraction reduction per reform |
| `reform_duration` | 5 | Cooldown steps after reform |
| `reform_cost` | 0.2 | Reward penalty during reform |

### Shock System

28 parameters controlling shock frequency, targeting, and institutional response. Most are zero by default (shocks disabled). The [[shock-reform]] scenario activates the full shock system. Key parameters:

- `shock_probability` — per-step chance of a shock (0.05 in shock-reform)
- `depletion_rate` — resource loss per shock (0.18–0.30)
- `shock_reform_memory` — steps of elevated reform probability after shock
- `shock_transition_duration` — steps of institutional support post-shock

### Policy Hyperparameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `thompson_posterior_decay` | 0.995 | Gaussian Thompson posterior decay |
| `discounted_ucb_gamma` | 0.97 | D-UCB discount factor |
| `sliding_window_ucb_window` | 40 | SW-UCB window size |
| `discounted_thompson_posterior_decay` | 0.94 | Discounted Thompson decay |
| `linucb_alpha` | 1.15 | LinUCB exploration coefficient |
| `linear_bandit_ridge` | 1.0 | Ridge regularisation for linear policies |

### Scenario-Specific

Parameters for boomtowns, trade clusters, secondary cities, metropolitan overstretch, and active effects. See [[scenarios]] for how each scenario overrides these.

## Scenario Override Mechanism

Scenarios are applied via `apply_scenario()`:

```python
payload = asdict(config)
for key, value in scenario.overrides.items():
    payload[key] = value
return SimulationConfig.from_dict(payload)
```

This is a simple dict merge — any `SimulationConfig` field can be overridden.
