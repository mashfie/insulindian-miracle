---
tags: [scenario, shocks, reform, institutions]
type: scenario
related:
  - "[[institutional-dynamics]]"
  - "[[institutional-economics]]"
  - "[[resource-curse]]"
  - "[[scenarios]]"
---

# Shock Reform

Early depletion shocks raise crisis pressure and create reform opportunities. The most parameter-intensive scenario with 28 overrides.

## Real-World Analogy

Post-crisis institutional reform — think South Korea after the 1997 Asian financial crisis (reformed corporate governance, banking regulation), or Chile after the copper price collapse (diversified economy, strengthened institutions). The shock destroys short-term wealth but creates a window for institutional improvement.

## Key Overrides (28 parameters, highlights)

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 420 | Long horizon to see reform payoff |
| `shock_probability` | 0.0 | 0.05 | 5% shock chance per step |
| `depletion_rate` | 0.18 | 0.30 | Severe resource depletion |
| `shock_target_resource_bias` | 0.0 | 3.0 | Shocks target resource-rich sites |
| `shock_reform_memory` | 0 | 18 | 18-step reform window |
| `shock_reform_bonus` | 0.0 | 6.0 | Strong reform pressure from shocks |
| `shock_transition_duration` | 0 | 44 | Long institutional transition period |
| `shock_readiness_weight` | 0.0 | 1.6 | Readiness amplifies shock response |
| `shock_lock_in_bonus` | 0.0 | 0.1 | Good reforms become self-reinforcing |
| `shock_snapback_pressure` | 0.0 | 0.25 | Bad institutions resist change |

## Shock Mechanics

1. **Shock hits** → resource depleted, capital eroded
2. **Readiness check** → high-readiness sites immediately reform (extraction drops, openness rises)
3. **Transition window** (44 steps) → ongoing institutional support, extraction capped, curse buffered
4. **Legacy stock** → accumulated reform capital that persists after transition
5. **Snapback vs lock-in** → low-readiness sites regress; high-readiness sites lock in gains

## Expected Behaviour

- Resource-rich sites get hit most often (bias = 3.0)
- Sites with good initial institutions (high readiness) reform on shock and improve permanently
- Sites with poor initial institutions absorb damage without reforming → spiral downward
- Creates a natural experiment within the simulation: "does crisis help or hurt?"
- [[whittle-index]] should excel — explicitly models shock transitions in its surrogate
