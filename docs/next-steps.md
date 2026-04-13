---
tags: [roadmap, gaps]
type: roadmap
related:
  - "[[methodology]]"
  - "[[RESULTS]]"
  - "[[whittle-index]]"
---

# Next Steps

This note tracks the main gaps between academic idealization and current implementation.

## Theory vs implementation

1. **Exact RMAB theory vs coupled simulator**
   The Whittle literature assumes independently evolving arms under relaxation. The code couples sites through network spillovers, migration, and resource-biased shocks. `whittle-index` is therefore a heuristic surrogate, not an exact index policy.

2. **Linear-bandit theory vs nonlinear reward law**
   `linucb` and `linear-thompson` fit a shared linear approximation to a reward function with nonlinear congestion, exponential kernels, boomtown thresholds, and reform discontinuities.

3. **Institutional economics vs reduced-form state**
   The literature models institutions through political coalitions, state capacity, and historical persistence. The simulator compresses that into `extraction`, `openness`, `adaptability`, and `shock_reform_stock`.

4. **Urban general equilibrium vs stylized site competition**
   There are no wages, commuting costs, land rents, or endogenous trade prices. The city system is a discrete settlement-allocation analogue, not a full urban GE model.

## Numerical / software gaps

1. **Explicit inversion in linear Thompson**
   Safe at `d = 11`, but not the numerically strongest formulation.

2. **Approximate terrain numerics**
   The distance transform and river extraction are deliberately simple.

3. **Results provenance**
   The repo needs regenerated benchmark artifacts with manifests before strong empirical claims should live in the wiki.

4. **Calibration**
   No parameter block is presently estimated from real data.

## High-value follow-ups

1. regenerate the canonical experiment suite and archive manifests beside every summary table,
2. add a formal sensitivity-analysis workflow over key parameters,
3. test solve-based or factorized updates for linear Thompson,
4. decide whether the Whittle surrogate should be documented as a policy experiment only or elevated to a core benchmark.
