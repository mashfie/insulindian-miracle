---
tags: [theory, economics, institutions]
type: theory
related:
  - "[[resource-curse]]"
  - "[[institutional-dynamics]]"
  - "[[reward-function]]"
  - "[[botswana]]"
---

# Institutional Economics

The study of how formal and informal rules — property rights, legal frameworks, norms of governance — shape economic outcomes. Institutional quality is the central mediating variable in this simulation.

## Extractive vs Inclusive Institutions

**Acemoglu & Robinson (2012)** distinguish two institutional regimes:

- **Extractive institutions** concentrate power and wealth in a narrow elite. Property rights are weak, markets are restricted, and rents flow to incumbents. Short-run growth is possible (the Soviet Union industrialised under extractive institutions) but long-run innovation is suppressed.
- **Inclusive institutions** distribute power broadly, enforce property rights, allow creative destruction, and invest in public goods. They enable sustained growth through innovation and capital accumulation.

The critical insight is **path dependence**: once extractive institutions form, they create self-reinforcing feedback loops. Elites benefit from the status quo and resist reform. Reform requires a **critical juncture** — a crisis, external shock, or sufficiently large coalition of reformers.

## Model Representation

Each settlement site carries an `InstitutionState` with three continuous dimensions:

| Dimension | Range | Meaning |
|-----------|-------|---------|
| `extraction` | [0, 1] | Share of surplus captured by elites |
| `openness` | [0, 1] | Degree of trade, migration, knowledge diffusion |
| `adaptability` | [0, 1] | Institutional capacity to reform under pressure |

These are initialised from Beta distributions (see [[configuration]]) and evolve endogenously through the [[institutional-dynamics]] system.

> [!note] Path dependence in the model
> High extraction → high short-term reward → no crisis pressure → no reform → extraction drifts higher. This is the self-reinforcing loop that Acemoglu & Robinson describe. The only escape is an exogenous shock (see [[shock-reform]]) or sufficient `adaptability` to trigger reform even under moderate pressure.

## Connection to Geography

Institutional quality interacts with geography through the [[reward-function]]:

- **Inclusive growth** scales with `(1 - extraction) * pop^α * (1 + productivity_gain * capital)` — only sites with low extraction benefit from agglomeration economies
- **Network spillovers** scale with `openness` — closed institutions cannot benefit from trade with neighbours
- **Capital accumulation** is eroded by `extractive_capital_erosion * extraction` — extractive elites consume rather than invest

This creates a divergence: initially similar sites can end up on radically different trajectories depending on their institutional path. Sites with good initial institutions (high openness, high adaptability, low extraction) compound advantages over time, while resource-rich sites with poor institutions enter the [[resource-curse]] trap.

## Critical Junctures and Reform

The simulation models reform as a stochastic process gated by `adaptability` and `crisis_pressure`:

```
reform_probability = adaptability * sigmoid(-delta * sensitivity + shock_bonus + ...)
```

Reform reduces `extraction` by `reform_step` (default 0.18) and increases `openness` by 0.08. It has a cooldown (`reform_duration` = 5 steps) and an ongoing cost (`reform_cost` = 0.2 per step during reform).

This captures the idea that institutional change is costly, uncertain, and requires both the capacity for reform (adaptability) and the motivation (declining performance).
