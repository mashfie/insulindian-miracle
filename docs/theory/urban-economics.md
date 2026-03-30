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

**Christaller (1933)** proposed that settlements arrange hierarchically: large cities serve wide hinterlands, smaller towns serve local needs, and the pattern tiles the landscape in a hexagonal lattice. The key insight is that **economies of scale** in service provision create natural hierarchies.

In this simulation, the hierarchy emerges endogenously from the interaction of geography, institutions, and policy decisions. The `secondary_city_bonus` term in [[reward-function]] explicitly rewards mid-sized cities, encouraging a polycentric system rather than a single dominant metropolis.

## New Economic Geography

**Krugman (1991)** formalised agglomeration using increasing returns, transport costs, and factor mobility. Cities form because:

1. **Increasing returns** — larger markets attract more firms, which attract more workers, which expand the market (circular causation)
2. **Transport costs** — proximity to markets and suppliers matters, so activity clusters
3. **Centrifugal forces** — congestion, high rents, and commuting costs eventually limit city size

The simulation captures this through:

| Force | Model Term | Effect |
|-------|-----------|--------|
| Agglomeration | `(1 - extraction) * pop^0.52` | Increasing returns, gated by institutions |
| Network spillovers | `openness * local_market * (1 + density_gain * density)` | Trade benefits from proximity |
| Congestion | `congestion * pop²` | Quadratic cost of city size |
| Metropolitan overstretch | `penalty * max(0, pop - threshold)^1.35` | Hard ceiling on megacity growth |

## Zipf's Law

**Zipf's law** states that the rank-size distribution of cities follows a power law: the nth-largest city has population proportional to 1/n. This is a robust empirical regularity across countries and time periods.

The simulation measures Zipf compliance through:
- `zipf_slope` — log-log regression slope of rank vs population (should be ≈ -1.0)
- `population_gini` — inequality across sites
- `population_hhi` — Herfindahl-Hirschman concentration index

Hypothesis **H6** (see [[hypotheses]]) tests whether any scenario produces a Zipf-like distribution. The [[balanced-urban]] scenario is designed to encourage polycentric outcomes (high `secondary_city_bonus`, low congestion), while [[megacity-trap]] suppresses secondary cities.

## Geography as First-Mover Advantage

Geographic suitability — port access, river proximity, arability, defensibility, accessibility — provides the initial conditions for settlement. The [[terrain-generation]] system creates these features procedurally, and the `base_geography()` function converts them into a reward floor.

> [!note] Geography is necessary but not sufficient
> A site with excellent geography but extractive institutions will underperform a geographically modest site with inclusive institutions over the long run. This is the central tension between geography determinism and institutional primacy.
