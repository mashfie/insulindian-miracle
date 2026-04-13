---
tags: [policy, restless, surrogate]
type: policy
related:
  - "[[restless-bandits]]"
  - "[[formal-model]]"
---

# Whittle Index

## Rule

The policy seeks a subsidy `lambda` that equalizes active and passive value:

$$
W(s) \approx \lambda^\star \text{ such that } V^{\text{active}}(s; \lambda^\star) \approx V^{\text{passive}}(s; \lambda^\star).
$$

The site with the highest approximate index is chosen.

## Implementation

- files: `rust/src/whittle.rs`, `rust/src/snapshot_physics.rs`
- state is discretized into bins over population, institutions, resource, capital, geography, legacy, and flags,
- first-step reward uses the actual snapshot reward,
- tail values use a discretized surrogate transition,
- binary search interval: `[-6, 6]`,
- iterations: `10`,
- rollout depth: `5`,
- internal discount: `0.92`.

## Repo-specific caveat

This is a Whittle-style heuristic, not a proof-backed index policy for the full simulator. The actual environment is coupled and continuous-state; the code uses a finite-depth discretized surrogate.

## Literature

- [Whittle (1988)](https://doi.org/10.2307/3214163)
- [Nino-Mora (2000)](https://doi.org/10.2139/ssrn.224565)
- [Akbarzadeh and Mahajan (2022)](https://www.cambridge.org/core/journals/advances-in-applied-probability/article/conditions-for-indexability-of-restless-bandits-and-an-mathcaloleftk3right-algorithm-to-compute-whittle-index/05749A3BD36DAC46166F96F9BEF8B9D7)
