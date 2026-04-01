---
tags: [scenario, urban, polycentric]
type: scenario
related:
  - "[[urban-economics]]"
  - "[[megacity-trap]]"
  - "[[scenarios]]"
  - "[[hypotheses]]"
---

# Balanced Urban System

Several midsize cities prosper together, producing a more stable hierarchy than either the baseline or a primate-city regime.

## Real-World Analogy

Germany, the Netherlands, Switzerland — polycentric urban systems with multiple mid-sized cities of comparable importance (Munich, Hamburg, Frankfurt, Cologne; Amsterdam, Rotterdam, The Hague, Utrecht). No single primate city dominates; the system is resilient and balanced.

## Key Overrides (10 parameters)

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 360 | Extended horizon |
| `secondary_city_bonus` | 0.75 | 1.22 | Strong mid-city reward |
| `secondary_city_target` | 16 | 14 | Bonus peaks at smaller cities |
| `secondary_city_spread` | 0.72 | 1.08 | Wide bonus window |
| `metropolitan_overstretch_threshold` | 22 | 28 | Overstretch starts later |
| `metropolitan_overstretch_penalty` | 0.05 | 0.02 | Mild overstretch |
| `network_scale` | 0.35 | 0.50 | Moderate trade radius |
| `network_density_gain` | 0.7 | 0.84 | Good density effects |
| `inclusive_productivity_gain` | 0.65 | 0.76 | Higher capital returns |

## Expected Behaviour

- Multiple sites receive investment — the strong secondary city bonus rewards distribution
- Population spread across 4–6 sites of comparable size
- Lower `population_hhi`, more moderate `zipf_slope` (closer to -1.0)
- Less sensitivity to algorithm choice — the reward landscape naturally guides investment distribution
