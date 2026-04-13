---
tags: [theory, bandits]
type: theory
related:
  - "[[restless-bandits]]"
  - "[[policies]]"
  - "[[formal-model]]"
---

# Multi-Armed Bandits

The repo uses classical bandit theory as a baseline language, not as a complete description of the environment.

## Stationary benchmark

In the textbook stochastic MAB, arm `i` has fixed mean reward `mu_i`, and the objective is to minimize regret

$$
\text{Regret}(T) = T \mu^\star - \sum_{t=1}^T \mu_{A_t}.
$$

Lai and Robbins (1985) give the asymptotic lower bound; Auer, Cesa-Bianchi, and Fischer (2002) give the canonical finite-time UCB1 result.

## Why this repo only partially fits the template

- rewards depend on evolving institutional state,
- actions change future rewards,
- the state of one site affects others through networks and migration.

So the project uses stationary bandits as a comparison class, not as a full generative model.

## Policy families in this repo

- **Optimism under uncertainty**: [[ucb1]], [[discounted-ucb]], [[sliding-window-ucb]]
- **Posterior sampling**: [[thompson-sampling]], [[discounted-thompson]]
- **Contextual linear approximation**: [[linucb]], [[linear-thompson]]
- **Restless surrogate**: [[whittle-index]]

## Linear contextual form

For the contextual policies,

$$
\mathbb E[Y_t \mid x_{t,a}] \approx x_{t,a}^\top \theta,
$$

with confidence or posterior geometry defined by

$$
V_t = \lambda I + \sum_{\tau \le t} x_\tau x_\tau^\top.
$$

This approximation is useful, but the true simulator is more nonlinear than the theory assumes.
