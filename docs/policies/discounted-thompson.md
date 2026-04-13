---
tags: [policy, bayesian, nonstationary]
type: policy
related:
  - "[[thompson-sampling]]"
  - "[[discounted-ucb]]"
---

# Discounted Thompson

## Rule

Before each update the policy shrinks arm-level sufficient statistics toward the prior:

$$
n_i \leftarrow \gamma n_i,
\qquad
\tau_i \leftarrow \tau_0 + \gamma(\tau_i - \tau_0),
\qquad
\eta_i \leftarrow \eta_0 + \gamma(\eta_i - \eta_0).
$$

It then performs the same Gaussian sampling step as [[thompson-sampling]].

## Implementation

- file: `rust/src/policies.rs`
- forgetting factor: `config.discounted_thompson_posterior_decay`

## Interpretation

This is an exponential-forgetting heuristic for drift. It is not an exact posterior for a state-space model.

## Literature

- [Qi, Guo, and Zhu (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11765042/)
