---
tags: [theory, hypotheses, experiments]
type: theory
related:
  - "[[analysis]]"
  - "[[resource-curse]]"
  - "[[institutional-economics]]"
  - "[[multi-armed-bandits]]"
---

# Hypotheses

The simulation is designed to test seven hypotheses about the interaction between resource endowments, institutional dynamics, and bandit algorithm performance.

## H1: Resource Curse Effect

> Resource-rich sites attract disproportionate early investment but end up with higher extraction and lower long-run population.

**Scenarios**: [[resource-curse-scenario]]

**Metrics**: `resource_extraction_correlation` (positive), `resource_population_correlation` (negative or weak), `top_resource_site_share` (declining over horizon)

**Theory**: The [[resource-curse]] channel — high initial reward from resources masks institutional decay until it becomes irreversible.

## H2: Institutional Quality Matters

> Sites with better initial institutions (lower extraction, higher openness and adaptability) achieve higher long-run populations, even when resource-poor.

**Scenarios**: [[resource-curse-scenario]], [[botswana]]

**Metrics**: Compare `initial_extraction_population_correlation` (negative) across scenarios. Botswana should show higher mean reward and more reforms than resource-curse.

**Theory**: [[institutional-economics]] — inclusive institutions compound advantages through capital accumulation and network effects.

## H3: Network Effects and Openness

> Open, trade-oriented city clusters outperform isolated settlements, and the cluster premium increases with network scale.

**Scenarios**: [[baseline]], [[open-cluster]]

**Metrics**: `cluster_premium` (population gap between high-openness clustered sites and isolated sites), trade cluster treatment premium.

**Theory**: [[urban-economics]] — agglomeration economies are amplified by spatial proximity and institutional openness.

## H5: Algorithm Comparison

> Thompson Sampling and Whittle Index outperform UCB1 and epsilon-greedy in cumulative reward, especially in non-stationary scenarios.

**Scenarios**: All five hypothesis scenarios

**Metrics**: Pairwise `cumulative_reward` comparisons (Thompson vs UCB1, Whittle vs epsilon-greedy, etc.), `oracle_regret`.

**Theory**: [[multi-armed-bandits]] — Bayesian and restless-aware algorithms should handle non-stationarity better. The advantage should be largest in [[resource-curse-scenario]] and [[ucb-bait]] where the trap is strongest.

## H6: Zipf's Law Emergence

> At least one scenario produces a rank-size distribution approximating Zipf's law (slope ≈ -1.0).

**Scenarios**: [[baseline]]

**Metrics**: `zipf_slope`, `population_gini`, rank-size curve shape.

**Theory**: [[urban-economics]] — Zipf's law is a robust empirical regularity. The simulation tests whether it emerges from the interaction of agglomeration, congestion, and network effects, or requires specific parameter tuning.

## H7: UCB Bait Trap

> UCB1 is disproportionately attracted to the boomtown site and suffers the largest regret when it collapses.

**Scenarios**: [[ucb-bait]]

**Metrics**: `boomtown_selection_share` (UCB1 vs others), `boomtown_population_share`, `cumulative_reward` (UCB1 should be lowest).

**Theory**: [[explore-exploit-tradeoff]] — UCB's optimistic bonus makes it slow to abandon a declining arm because the confidence interval remains wide. Thompson sampling detects the decline faster through posterior updating.

---

## Hypothesis-Scenario Matrix

| Hypothesis | baseline | resource-curse | botswana | open-cluster | ucb-bait |
|-----------|----------|---------------|----------|-------------|---------|
| H1 | | required | | | |
| H2 | | required | required | | |
| H3 | required | | | required | |
| H5 | required | required | required | required | required |
| H6 | required | | | | |
| H7 | | | | | required |

> [!note] H4 is omitted
> The original hypothesis set included H4 (shock-reform dynamics), but it was folded into the shock-reform scenario analysis rather than a standalone test.
