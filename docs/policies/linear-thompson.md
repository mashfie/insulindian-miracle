---
tags: [policy, contextual, bayesian, linear]
type: policy
related:
  - "[[linucb]]"
  - "[[linear-algebra]]"
---

# Linear Thompson

## Rule

Using the shared linear model,

$$
\Sigma_t = \Lambda_t^{-1},
\qquad
\mu_t = \Sigma_t \eta_t,
\qquad
\tilde\theta_t \sim \mathcal N(\mu_t, s^2 \Sigma_t),
$$

then choose

$$
A_t = \arg\max_i x_i^\top \tilde\theta_t.
$$

## Implementation

- file: `rust/src/policies.rs`
- precision matrix updated directly,
- covariance recovered by explicit inversion,
- Cholesky uses diagonal jitter if needed,
- observation variance and sampling scale come from config.

## Repo-specific caveat

At `d = 11` the explicit inversion is acceptable. At larger `d` the numerically preferred implementation would be solve-based or factorized rather than inversion-first.

## Literature

- [Agrawal and Goyal (2013)](https://proceedings.mlr.press/v28/agrawal13.html)
