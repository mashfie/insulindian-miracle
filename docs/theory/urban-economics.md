---
tags: [theory, economics, urban, geography]
type: theory
related:
  - "[[reward-function]]"
  - "[[terrain-generation]]"
  - "[[simulation-loop]]"
  - "[[megacity-trap]]"
  - "[[balanced-urban]]"
---

# Urban Economics

The simulation models city formation through the lens of new economic geography and central place theory — why do cities form where they do, and what determines their relative sizes?

## Central Place Theory

Christaller (1933), *Die zentralen Orte in Süddeutschland*, proposed that settlements arrange hierarchically: large cities serve wide hinterlands, smaller towns serve local needs, and the pattern tiles the landscape in a hexagonal lattice. The key insight is that **economies of scale** in service provision create natural hierarchies.

[Henderson (1974)](https://www.jstor.org/stable/1813316) formalised the tradeoff: city size is determined by the balance between internal increasing returns (which favour large cities) and external costs of city size (commuting, congestion, pollution). The equilibrium city size $n^*$ satisfies:

$$
\frac{\partial}{\partial n}\left[A \cdot n^\alpha - c \cdot n^\beta\right] = 0 \implies n^* = \left(\frac{\alpha \cdot A}{\beta \cdot c}\right)^{\frac{1}{\beta - \alpha}}
$$

where $A$ is the agglomeration productivity parameter, $\alpha < 1$ is the agglomeration elasticity, $c$ is the congestion cost coefficient, and $\beta > 1$ is the congestion elasticity.

In this simulation, the hierarchy emerges endogenously from the interaction of geography, institutions, and policy decisions. The `secondary_city_bonus` term in [[reward-function]] explicitly rewards mid-sized cities, encouraging a polycentric system rather than a single dominant metropolis.

## New Economic Geography

[Krugman (1991)](https://doi.org/10.1086/261763) formalised agglomeration using increasing returns, transport costs, and factor mobility. Cities form because:

1. **Increasing returns** — larger markets attract more firms, which attract more workers, which expand the market (circular causation)
2. **Transport costs** — proximity to markets and suppliers matters, so activity clusters
3. **Centrifugal forces** — congestion, high rents, and commuting costs eventually limit city size

The simulation captures this through:

| Force | Model Term | Effect |
|-------|-----------|--------|
| Agglomeration | $(1 - e) \cdot p^{0.52}$ | Increasing returns, gated by institutions |
| Network spillovers | $o \cdot M_{\text{local}} \cdot (1 + \delta \cdot d)$ | Trade benefits from proximity |
| Congestion | $c \cdot p^2$ | Quadratic cost of city size |
| Metropolitan overstretch | $\lambda \cdot \max(0,\; p - \bar{p})^{1.35}$ | Hard ceiling on megacity growth |

The agglomeration exponent $\alpha = 0.52$ sits within the empirical range (0.03–0.08 for wages, but higher when measuring total urban output inclusive of network effects). The quadratic congestion term $c \cdot p^2$ ensures that net returns to city size eventually turn negative, preventing unbounded concentration.

## Zipf's Law

Zipf (1949), *Human Behavior and the Principle of Least Effort*, observed that the rank-size distribution of cities follows a power law. If cities are ranked by population, the $n$th-largest city has population:

$$
P(n) \propto n^{-\zeta}
$$

where $\zeta \approx 1$ is the Zipf exponent. Equivalently, plotting $\ln(\text{rank})$ against $\ln(\text{population})$ yields a slope of approximately $-1$. This is a robust empirical regularity across countries and time periods.

The simulation measures Zipf compliance through:
- `zipf_slope` — log-log regression slope of rank vs population (should be $\approx -1.0$)
- `population_gini` — inequality across sites
- `population_hhi` — Herfindahl-Hirschman concentration index:

$$
\text{HHI} = \sum_{i=1}^{K} s_i^2, \quad s_i = \frac{p_i}{\sum_j p_j}
$$

Hypothesis **H6** (see [[hypotheses]]) tests whether any scenario produces a Zipf-like distribution. In experiments, UCB1 consistently produces Zipf slopes of $-1.6$ to $-2.8$ — indicating excessive concentration (primacy). Whittle and SW-UCB produce slopes of $-0.3$ to $-0.8$, closer to a polycentric distribution. Neither end perfectly matches the Zipf ideal of $-1.0$, suggesting the simulation's parameter space contains a narrow corridor of Zipf-consistent outcomes between primacy and polycentricity.

The [[balanced-urban]] scenario is designed to encourage polycentric outcomes (high `secondary_city_bonus`, low congestion), while [[megacity-trap]] suppresses secondary cities.

## Geography as First-Mover Advantage

Geographic suitability — port access, river proximity, arability, defensibility, accessibility — provides the initial conditions for settlement. The [[terrain-generation]] system creates these features procedurally, and the `base_geography()` function converts them into a reward floor.

> [!note] Geography is necessary but not sufficient
> A site with excellent geography but extractive institutions will underperform a geographically modest site with inclusive institutions over the long run. This is the central tension between geography determinism and institutional primacy — the same debate that runs through [Acemoglu, Johnson & Robinson (2001)](https://www.jstor.org/stable/2677930) vs [Sachs & Warner (1995)](https://www.nber.org/papers/w5398).
