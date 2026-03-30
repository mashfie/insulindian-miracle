---
tags: [scenario, institutions, resource-curse]
type: scenario
related:
  - "[[resource-curse]]"
  - "[[institutional-economics]]"
  - "[[scenarios]]"
  - "[[hypotheses]]"
---

# Botswana

Resource rents remain high, but inclusive and adaptive initial institutions soften the curse.

## Real-World Analogy

Botswana — discovered diamonds in 1967 with pre-existing inclusive institutions (Tswana kgotla, fiscal discipline, parliamentary tradition). Channelled revenues through a sovereign wealth fund, invested in education and infrastructure, and grew from one of Africa's poorest to upper-middle income.

## Key Overrides (12 parameters)

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 420 | Longer to show divergence |
| `resource_curse_strength` | 0.04 | 0.035 | Slightly weaker curse |
| `curse_openness_buffer` | 0.35 | 0.70 | Openness strongly protects |
| `curse_capital_buffer` | 0.25 | 0.62 | Capital strongly protects |
| `inclusive_investment_gain` | 0.12 | 0.22 | More productive reinvestment |
| `inclusive_productivity_gain` | 0.65 | 0.90 | Higher returns to capital |
| `initial_extraction_resource_bias` | 2.5 | 0.15 | Resources don't corrupt initial institutions |
| `initial_openness_alpha` | 2.2 | 3.6 | Sites start more open |
| `initial_adaptability_alpha` | 3.0 | 4.0 | Sites start more adaptive |
| `network_scale` | 0.35 | 0.46 | Stronger trade spillovers |

## Hypotheses Tested

- **H2** (with [[resource-curse-scenario]]): Good institutions convert resource abundance into growth
- **H5**: Algorithm comparison — does the "easy" institutional landscape reduce policy differences?

## Expected Behaviour

- Resource-rich sites remain productive because buffers suppress extraction drift
- Mean cumulative reward should be higher than [[resource-curse-scenario]]
- Policy differences should be smaller — even naive approaches succeed when institutions are good
- Reform frequency should be lower (institutions don't decay enough to trigger crisis)
