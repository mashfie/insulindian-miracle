---
tags: [policy, optimistic]
type: policy
related:
  - "[[discounted-ucb]]"
  - "[[sliding-window-ucb]]"
---

# UCB1

## Rule

The code uses

$$
A_t = \arg\max_i \left[ \hat\mu_i + \sqrt{\frac{2 \ln t}{n_i}} \right].
$$

This matches the classical UCB1 form with exploration constant `2.0`.

## Implementation

- file: `rust/src/policies.rs`
- unseen arms are sampled first,
- reward means are updated by the standard online average.

## Repo-specific caveat

The underlying rewards are nonstationary and action-dependent, so UCB1 is deliberately misspecified here. Its value is comparative: it shows what optimism under stationary assumptions does in a drifting environment.

## Literature

- [Auer, Cesa-Bianchi, and Fischer (2002)](https://doi.org/10.1023/A:1013689704352)
