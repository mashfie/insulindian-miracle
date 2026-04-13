---
tags: [scenario, resource-curse]
type: scenario
related:
  - "[[resource-curse]]"
  - "[[hypotheses]]"
---

# Resource Curse Scenario

## Mechanism

This scenario strengthens short-run rent extraction and weakens the institutional buffers that normally damp it.

Key overrides:

- higher `resource_capture_gain`,
- much higher `resource_curse_strength`,
- weaker `curse_openness_buffer` and `curse_capital_buffer`,
- stronger active extraction, depletion, and openness drag,
- high `initial_extraction_resource_bias`.

## Literature analogue

The intended analogue is the conditional resource-curse literature:

- [Sachs and Warner (1995)](https://www.nber.org/papers/w5398)
- [Mehlum, Moene, and Torvik (2006)](https://academic.oup.com/ej/article/116/508/1/5089390)

The scenario encodes their logic in reduced form: resource abundance is dangerous when institutions are vulnerable to grabber dynamics.

## Expected signatures

- positive `resource_extraction_correlation`,
- weaker long-run relationship between initial resources and population,
- larger performance gap between stationary and drift-aware policies.

## Caution

This is a stylized institutional-drift environment, not a structural macro model of a resource economy.
