---
tags: [policy, bayesian]
type: policy
related:
  - "[[discounted-thompson]]"
  - "[[linear-thompson]]"
---

# Thompson Sampling

## Rule

The implementation is a Gaussian mean-tracking policy. For each arm it samples

$$
\tilde\mu_i \sim \mathcal N(m_i, v_i),
$$

and selects the arm with the largest draw.

## Implementation

- file: `rust/src/policies.rs`
- prior mean `0`, prior variance `16`,
- observation variance `9`,
- a minimum exploration variance floor is enforced,
- unseen arms are forced early.

The posterior update is precision-based:

$$
\tau_i \leftarrow \tau_i + \sigma^{-2}, \qquad
\eta_i \leftarrow \eta_i + y_t \sigma^{-2}.
$$

## Repo-specific caveat

This is a practical Gaussian TS baseline for continuous rewards, not a domain-calibrated Bayesian model.

## Literature

- [Russo et al. (2018)](https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf)
- [Chapelle and Li (2011)](https://proceedings.neurips.cc/paper/4321-an-empirical-evaluation-of-thompson-sampling)
