---
tags: [system, configuration]
type: system
related:
  - "[[scenarios]]"
  - "[[formal-model]]"
---

# Configuration

`SimulationConfig` in `rust/src/types.rs` is the single source of truth for engine parameters.

## Parameter families

- **terrain**: raster size, octaves, persistence, lacunarity, sea level, river-source quantile.
- **initial state**: Beta parameters for extraction, openness, adaptability.
- **reward law**: agglomeration, congestion, extraction drag, network gains, secondary-city terms.
- **resource curse**: curse strength, openness buffer, capital buffer.
- **active use**: extraction pressure, depletion, openness drag, decay onset.
- **scenario geometry**: boomtown and trade-cluster modifiers.
- **policy hyperparameters**: forgetting rates, window size, ridge, LinUCB alpha, Thompson variances.
- **shock-reform**: crisis memory, transition windows, extraction caps, legacy fade, readiness weights.
- **population adjustment**: passive investment scale, structural growth weight, migration threshold.

## Defaults vs overrides

- `SimulationConfig::default()` is the base model.
- a scenario file contributes a JSON object with `"overrides"`.
- `apply_scenario_rust()` merges that object into the base config.

## Practical rule for docs

When discussing a scenario:

1. state the base mechanism,
2. list the smallest set of overrides that changes it,
3. avoid implying that untouched parameters were re-specified.
