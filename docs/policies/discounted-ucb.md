---
tags: [policy, optimistic, nonstationary]
type: policy
related:
  - "[[ucb1]]"
  - "[[sliding-window-ucb]]"
---

# Discounted UCB

## Rule

The policy exponentially forgets old observations:

$$
n_i \leftarrow \gamma n_i, \qquad s_i \leftarrow \gamma s_i
$$

before adding the new reward, then scores

$$
\hat\mu_i + \sqrt{\frac{2 \ln(1 + M_t)}{\max(n_i, \epsilon)}},
$$

where `M_t` is the discounted total mass.

## Implementation

- file: `rust/src/policies.rs`
- `gamma = config.discounted_ucb_gamma`
- reward state is `(counts, reward_sums, total_mass)`

## Interpretation

This is a piecewise-stationary tracking heuristic, not a stationary regret-optimal policy.

## Literature

- [Garivier and Moulines (2011)](https://researchportal.ip-paris.fr/en/publications/on-upper-confidence-bound-policies-for-switching-bandit-problems/)
