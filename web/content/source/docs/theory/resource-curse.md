---
tags: [theory, economics, resource-curse]
type: theory
related:
  - "[[institutional-economics]]"
  - "[[institutional-dynamics]]"
  - "[[reward-function]]"
  - "[[resource-curse-scenario]]"
  - "[[botswana]]"
---

# Resource Curse

The paradox that countries rich in natural resources often experience slower economic growth, weaker institutions, and more authoritarian governance than resource-poor peers.

## Core Literature

**Sachs & Warner (1995, 2001)** established the empirical regularity: controlling for initial income, openness, and investment, resource-abundant economies grew more slowly over 1970–1990. The initial explanation was **Dutch disease** — resource booms appreciate the real exchange rate, crowding out manufacturing and tradeable sectors.

**Ross (2001, 2015)** shifted the focus to the **institutional channel**: resource rents provide governments with revenue that does not require taxation, weakening the bargaining relationship between state and citizens. Elites can fund patronage networks and suppress opposition without building productive capacity.

**Mehlum, Moene & Torvik (2006)** showed the curse is conditional: countries with "grabber-friendly" institutions suffer, while those with "producer-friendly" institutions convert resource wealth into growth. The quality of institutions at the time resources are discovered determines the trajectory.

## The Botswana Exception

Botswana discovered diamonds in 1967 with pre-existing inclusive institutions (strong rule of law, fiscal discipline, parliamentary tradition from the Tswana kgotla system). It channelled diamond revenues through a sovereign wealth fund, invested in education and infrastructure, and avoided the extraction trap. Per-capita income grew from one of Africa's lowest to upper-middle-income status.

> [!tip] Model mapping
> The [[botswana]] scenario initialises sites with high openness and adaptability and low extraction bias. The curse strength is reduced and inclusive investment gains are amplified. The simulation tests whether good initial institutions can convert resource abundance into sustained growth.

## How the Simulation Models This

The resource curse operates through **extraction drift** in [[institutional-dynamics]]:

1. **Resource-rich sites generate high immediate reward** via the `resource_payoff` and `extractive_cashflow` terms in [[reward-function]]
2. **High reward suppresses reform pressure** — the reform trigger in `evolve_sites()` fires when reward *declines*; sustained high reward means the sigmoid crisis pressure stays low
3. **Without reform, extraction drifts upward**: `extraction += curse_strength * resource_rent * curse_modifier * (1 - extraction)`
4. **Rising extraction erodes long-run growth** through `extractive_drag`, `capital_erosion`, and `metropolitan_overstretch`

The key parameters controlling curse intensity:

| Parameter | Default | Resource-Curse Scenario |
|-----------|---------|------------------------|
| `resource_curse_strength` | 0.04 | 0.13 |
| `curse_openness_buffer` | 0.35 | 0.12 |
| `curse_capital_buffer` | 0.25 | 0.08 |
| `initial_extraction_resource_bias` | 2.5 | 5.2 |

## Connection to Bandit Theory

The resource curse creates a **non-stationary reward landscape** — the classic setup for [[restless-bandits]]. A site that looks optimal today may become a trap tomorrow. Algorithms must navigate the [[explore-exploit-tradeoff]] under conditions where exploitation itself degrades the arm being exploited.

The [[ucb-bait]] scenario is designed specifically to test whether optimistic algorithms (UCB1) fall for the trap: a boomtown site offers spike rewards early, then collapses as extraction locks in. [[thompson-sampling]] and [[whittle-index]] should recognise the non-stationarity faster.
