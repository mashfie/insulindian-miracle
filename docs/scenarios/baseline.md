---
tags: [scenario, baseline]
type: scenario
related:
  - "[[scenarios]]"
  - "[[hypotheses]]"
  - "[[configuration]]"
---

# Baseline

Default peninsula dynamics with moderate resource rents and modest institutional drift.

## Real-World Analogy

A "normal" developing economy — moderate resources, no extreme institutional pathologies, gradual urbanisation. Think a middle-income Southeast Asian or Latin American country with balanced economic geography.

## Parameters

No overrides — all defaults from [[configuration]] apply.

| Key Parameter | Value |
|--------------|-------|
| Horizon | 300 |
| `resource_curse_strength` | 0.04 |
| `shock_probability` | 0.0 |
| `network_scale` | 0.35 |
| `secondary_city_bonus` | 0.75 |

## Hypotheses Tested

- **H3** (with [[open-cluster]]): Do network effects and openness create a cluster premium?
- **H5**: Cross-policy algorithm comparison under default conditions
- **H6**: Does a Zipf-like rank-size distribution emerge?

## Expected Behaviour

- Moderate institutional drift — extraction rises slowly, some sites reform
- Geography dominates early; institutions differentiate sites over time
- Most policies perform comparably — low non-stationarity rewards even naive approaches
- Population distribution should be moderately concentrated
