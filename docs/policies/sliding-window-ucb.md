---
tags: [policy, optimistic, nonstationary]
type: policy
related:
  - "[[ucb1]]"
  - "[[discounted-ucb]]"
---

# Sliding Window UCB

## Rule

Only the most recent `w` observations are retained. Scores are computed from windowed counts and means:

$$
\hat\mu_i^{(w)} + \sqrt{\frac{2 \ln(1 + w_t)}{\max(n_i^{(w)}, 1)}}.
$$

## Implementation

- file: `rust/src/policies.rs`
- history structure: `VecDeque<(arm, reward)>`
- window: `config.sliding_window_ucb_window`

## Interpretation

Compared with discounted UCB, forgetting is hard rather than exponential. This is appropriate when regime changes are abrupt rather than smooth.

## Literature

- [Garivier and Moulines (2011)](https://researchportal.ip-paris.fr/en/publications/on-upper-confidence-bound-policies-for-switching-bandit-problems/)
