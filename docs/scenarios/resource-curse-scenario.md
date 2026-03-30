---
tags: [scenario, resource-curse]
type: scenario
related:
  - "[[resource-curse]]"
  - "[[institutional-economics]]"
  - "[[scenarios]]"
  - "[[hypotheses]]"
---

# Resource Curse Scenario

Resource-rich sites start more extractive and remain tempting long enough to become traps.

## Real-World Analogy

Nigeria, Venezuela, Angola — resource-abundant economies where mineral wealth funded patronage networks, suppressed institutional reform, and produced long-run stagnation despite high short-term revenues.

## Key Overrides (16 parameters)

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 420 | Longer to see decay |
| `resource_capture_gain` | 1.35 | 1.80 | Higher resource revenue |
| `resource_curse_strength` | 0.04 | 0.13 | 3× faster extraction drift |
| `curse_openness_buffer` | 0.35 | 0.12 | Openness protects less |
| `curse_capital_buffer` | 0.25 | 0.08 | Capital protects less |
| `initial_extraction_resource_bias` | 2.5 | 5.2 | Resource-rich sites start extractive |
| `active_extraction_pressure` | 0.0 | 0.18 | Active use worsens institutions |
| `active_resource_depletion` | 0.0 | 0.08 | Active use depletes resources |

## Hypotheses Tested

- **H1**: Resource-rich sites attract early investment but suffer long-run decline
- **H2** (with [[botswana]]): Institutional quality matters more than resource endowment
- **H5**: Algorithm comparison — which policies avoid the trap?

## Expected Behaviour

- Resource-rich sites offer high immediate reward → algorithms invest early
- Extraction drifts rapidly → rewards decline → but algorithms may not detect it fast enough
- Sites with low resources but good institutions outperform over the full 420 steps
- [[thompson-sampling]] and [[whittle-index]] should detect the decline faster than [[ucb1]] and [[epsilon-greedy]]
