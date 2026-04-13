---
tags: [module, scenarios]
type: module
related:
  - "[[configuration]]"
  - "[[hypotheses]]"
---

# Scenarios

Scenario mechanics are configured, not hard-coded.

- registry files live in `configs/scenarios/*.json`,
- merge logic lives in `rust/src/scenarios.rs`,
- the experiment suite consumes scenario paths directly.

Each scenario is a partial perturbation of `SimulationConfig::default()`.
