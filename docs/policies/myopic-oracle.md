---
tags: [policy, oracle]
type: policy
related:
  - "[[reward-function]]"
  - "[[RESULTS]]"
---

# Myopic Oracle

## Rule

For each site `i`, evaluate

$$
R_i^{\text{snap}} = \texttt{compute\_reward\_snapshot}(i, \text{states}, \text{config}, 1),
$$

then choose the largest one-step reward.

## Implementation

- file: `rust/src/policies.rs`
- requires snapshots,
- `update()` is a no-op.

## Important caveat

This is not a perfect-information dynamic oracle. It does not solve the full coupled finite-horizon control problem. In the docs it should be called a **myopic baseline oracle**.
