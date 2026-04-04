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

## Historical Context

The baseline scenario has no specific city analogy. It represents a "normal" developing economy — moderate resources, no extreme institutional pathologies, gradual urbanisation. Think a middle-income Southeast Asian or Latin American country with balanced economic geography, where neither resource abundance nor institutional fragility dominates the development trajectory.

This is the control condition against which all other scenarios are measured.

## Model Mapping

All parameters take their defaults from [[configuration]]. No overrides are applied. The baseline encodes a world where the resource curse is mild ($\alpha_{\text{curse}} = 0.04$), shocks are absent ($p_{\text{shock}} = 0.0$), and network effects are moderate ($\gamma_{\text{net}} = 0.35$). The secondary city bonus is set at $0.75$, providing a modest incentive for distributed investment without forcing polycentrism.

| Key Parameter | Value |
|--------------|-------|
| Horizon | 300 |
| `resource_curse_strength` | 0.04 |
| `shock_probability` | 0.0 |
| `network_scale` | 0.35 |
| `secondary_city_bonus` | 0.75 |

## Experimental Results

| Rank | Policy | Cumulative Reward |
|------|--------|-------------------|
| — | Oracle | 2892 |
| 1 | SW-UCB | 2962 |
| 9 | UCB1 | 1588 |

All policies drive openness to $1.000$ and extraction near $0$. This is the institutional paradise: reforms always win, the curse is too weak to trap anyone, and even naive approaches converge on good outcomes. The narrow policy spread confirms that algorithm choice matters least when the environment is benign.

## Hypotheses Tested

- **H3** (with [[open-cluster]]): Do network effects and openness create a cluster premium?
- **H5**: Cross-policy algorithm comparison under default conditions
- **H6**: Does a Zipf-like rank-size distribution emerge?

## Expected Behaviour

- Moderate institutional drift — extraction rises slowly, some sites reform
- Geography dominates early; institutions differentiate sites over time
- Most policies perform comparably — low non-stationarity rewards even naive approaches
- Population distribution should be moderately concentrated
