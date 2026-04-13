---
tags: [theory, hypotheses]
type: theory
related:
  - "[[research-design]]"
  - "[[scenarios]]"
  - "[[RESULTS]]"
---

# Hypotheses

The hypothesis suite in `configs/experiments/hypothesis_suite.json` is the formal experiment contract of the repo.

## H1. Resource curse effect

**Claim**: high `rho_i` makes early allocation attractive but increases long-run extraction and can weaken terminal development.

**Primary scenarios**: [[resource-curse-scenario]]

**Relevant observables**:

- `resource_extraction_correlation`
- `resource_population_correlation`
- `mean_final_extraction`

**Academic anchor**:

- Sachs and Warner (1995)
- Mehlum, Moene, and Torvik (2006)

## H2. Institutional quality matters

**Claim**: high initial openness/adaptability and strong curse buffers convert resource abundance from a liability into a productive asset.

**Primary scenarios**: [[resource-curse-scenario]], [[botswana]]

**Relevant observables**:

- `mean_final_extraction`
- `mean_final_openness`
- `mean_reforms_triggered`
- `cumulative_reward`

**Academic anchor**:

- Acemoglu, Johnson, and Robinson (2001, 2005)
- Mehlum, Moene, and Torvik (2006)

## H3. Network effects and openness

**Claim**: trade-oriented clusters should outperform isolated sites when openness and network reach are strong.

**Primary scenarios**: [[baseline]], [[open-cluster]], [[merchant-republic]]

**Relevant observables**:

- concentration metrics,
- cluster-sensitive outcome summaries,
- cumulative reward.

**Academic anchor**:

- Krugman (1991)
- Duranton and Puga (2004)

## H5. Algorithm comparison

**Claim**: policies with explicit uncertainty handling or nonstationarity awareness should outperform naive baselines when the environment drifts.

**Primary scenarios**: all canonical scenarios

**Relevant observables**:

- `cumulative_reward`
- `oracle_regret`
- `empirical_regret`

**Academic anchor**:

- Auer, Cesa-Bianchi, and Fischer (2002)
- Russo et al. (2018)
- Garivier and Moulines (2011)
- Whittle (1988)

## H6. Zipf-like hierarchy

**Claim**: some parameter regions may produce an upper-tail city-size distribution compatible with a Zipf slope near `-1`.

**Primary scenarios**: [[baseline]], [[balanced-urban]], [[megacity-trap]]

**Relevant observables**:

- `zipf_slope`
- `population_gini`
- `population_hhi`

**Academic anchor**:

- Henderson (1974)
- Gabaix (1999)

## H7. UCB bait trap

**Claim**: optimistic stationary policies should overcommit to temporary boom sites when decay is delayed and then abrupt.

**Primary scenarios**: [[ucb-bait]]

**Relevant observables**:

- `boomtown_selection_share`
- `boomtown_pre_collapse_selection_share`
- `boomtown_collapse_selection_share`
- `cumulative_reward`

**Academic anchor**:

- Garivier and Moulines (2011)
- Arthur (1989)

## Documentation rule

The hypothesis notes should prefer:

- formulas and metric definitions,
- scenario-to-mechanism mapping,
- clearly labeled expected signatures,

over unsupported performance tables unless a current artifact is attached.
