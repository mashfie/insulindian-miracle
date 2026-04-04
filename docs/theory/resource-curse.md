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

[Sachs & Warner (1995)](https://www.nber.org/papers/w5398) established the empirical regularity: controlling for initial income, openness, and investment, resource-abundant economies grew more slowly over 1970–1990. The initial explanation was **Dutch disease** — resource booms appreciate the real exchange rate, crowding out manufacturing and tradeable sectors.

[Ross (2001)](https://doi.org/10.1353/wp.2001.0011) shifted the focus to the **institutional channel**: resource rents provide governments with revenue that does not require taxation, weakening the bargaining relationship between state and citizens. Elites can fund patronage networks and suppress opposition without building productive capacity.

[Mehlum, Moene & Torvik (2006)](https://doi.org/10.1111/j.1468-0297.2006.01045.x) showed the curse is conditional: countries with "grabber-friendly" institutions suffer, while those with "producer-friendly" institutions convert resource wealth into growth. The quality of institutions at the time resources are discovered determines the trajectory. Their model predicts a threshold effect — growth is a function of both resource abundance $R$ and institutional quality $Q$:

$$
g = f(R, Q) \quad \text{where} \quad \frac{\partial g}{\partial R} > 0 \iff Q > Q^*
$$

Below the institutional threshold $Q^*$, additional resources *reduce* growth. Above it, resources augment growth — the Botswana path.

## The Botswana Exception

Botswana discovered diamonds in 1967 with pre-existing inclusive institutions (strong rule of law, fiscal discipline, parliamentary tradition from the Tswana kgotla system). It channelled diamond revenues through a sovereign wealth fund, invested in education and infrastructure, and avoided the extraction trap. Per-capita income grew from one of Africa's lowest to upper-middle-income status.

> [!tip] Model mapping
> The [[botswana]] scenario initialises sites with high openness and adaptability and low extraction bias. The curse strength is reduced and inclusive investment gains are amplified. The simulation tests whether good initial institutions can convert resource abundance into sustained growth. In experiment results, Botswana-scenario sites maintain extraction at 0.002 and openness at 1.000 — institutions hold across all policies.

## How the Simulation Models This

The resource curse operates through **extraction drift** in [[institutional-dynamics]]:

1. **Resource-rich sites generate high immediate reward** via the `resource_payoff` and `extractive_cashflow` terms in [[reward-function]]
2. **High reward suppresses reform pressure** — the reform trigger in `evolve_sites()` fires when reward *declines*; sustained high reward means the sigmoid crisis pressure stays low
3. **Without reform, extraction drifts upward** according to:

$$
e_{t+1} = e_t + \gamma \cdot r_t \cdot c_m \cdot (1 - e_t)
$$

where $e_t$ is extraction at time $t$, $\gamma$ is `resource_curse_strength`, $r_t$ is resource rent, and $c_m$ is the `curse_modifier`. The $(1 - e_t)$ term produces logistic saturation — extraction accelerates in the middle range and slows as it approaches 1.

4. **Rising extraction erodes long-run growth** through `extractive_drag`, `capital_erosion`, and `metropolitan_overstretch`

The key parameters controlling curse intensity:

| Parameter | Default | Resource-Curse Scenario |
|-----------|---------|------------------------|
| `resource_curse_strength` | 0.04 | 0.13 |
| `curse_openness_buffer` | 0.35 | 0.12 |
| `curse_capital_buffer` | 0.25 | 0.08 |
| `initial_extraction_resource_bias` | 2.5 | 5.2 |

In the resource-curse scenario, extraction across sites ranges from 0.09 to 0.21 — substantially higher than the baseline where extraction converges near 0.

## Connection to Bandit Theory

The resource curse creates a **non-stationary reward landscape** — the classic setup for [[restless-bandits]]. A site that looks optimal today may become a trap tomorrow. Algorithms must navigate the [[explore-exploit-tradeoff]] under conditions where exploitation itself degrades the arm being exploited.

The reward of a resource-rich arm decays roughly as:

$$
\mu_k(t) \approx \mu_k(0) \cdot (1 - e_k(t))^\alpha
$$

where $\alpha \approx 0.52$ is the agglomeration exponent. As $e_k(t)$ drifts upward, the effective mean collapses — but slowly enough that optimistic algorithms continue selecting the arm.

The [[ucb-bait]] scenario is designed specifically to test whether optimistic algorithms (UCB1) fall for the trap: a boomtown site offers spike rewards early, then collapses as extraction locks in. In experiments, UCB1 makes 12/18 boom selections during the decay window, while [[thompson-sampling]] makes only 1/18 and [[whittle-index]] makes 0/280 total. SW-UCB achieves cumulative reward of 2357 in the resource-curse scenario — more than double the oracle's 1129 — while Whittle scores only 273 (worst), suggesting that forward-looking models overreact to extraction signals in this regime.
