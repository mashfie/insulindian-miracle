---
tags: [methodology, formal-model]
type: methodology
related:
  - "[[reward-function]]"
  - "[[institutional-dynamics]]"
  - "[[restless-bandits]]"
---

# Formal Model

Let `i in {1, ..., n}` index candidate sites. The global state at time `t` is

$$
S_t = (s_{1,t}, \dots, s_{n,t}),
$$

with per-site state

$$
s_{i,t} = (x_i, y_i, g_i, rho_{i,t}, e_{i,t}, o_{i,t}, a_{i,t}, k_{i,t}, p_{i,t}, ell_{i,t}, b_i, c_i),
$$

where `(x_i, y_i)` are coordinates, `g_i` is fixed geography, `rho` is resource rent, `e` extraction, `o` openness, `a` adaptability, `k` productive capital, `p` population, `ell` post-shock legacy, `b` boomtown flag, and `c` trade-cluster flag.

## Action

At each step the planner chooses exactly one site:

$$
A_t \in \{1, \dots, n\}.
$$

Operationally the code increments `p_{A_t,t}` by one before the transition update.

## Reward

The realized per-step reward is the instantaneous reward of the chosen site after `evolve_sites()` has recomputed rewards:

$$
Y_t = R_{A_t}(S_t, A_t).
$$

`R_i` is defined in [[reward-function]].

## Transition

The simulator applies a coupled stochastic map

$$
S_{t+1} = F(S_t, A_t, \xi_t),
$$

where `xi_t` contains Beta-distributed initial draws only at `t = 0` and Bernoulli shock events afterward. The transition is coupled because:

- `N_i(S_t)` depends on all sites through the decay matrix,
- migration reallocates population between two sites based on global momentum ranking,
- shock targeting can depend on the full cross-site resource vector.

## What class of control problem is this?

It is not exactly any of the following:

- **Classical stationary MAB**: arm rewards are not iid and sufficient statistics are not arm-local.
- **Pure contextual bandit**: actions change future state.
- **Exact RMAB**: arms are coupled by network spillovers and migration, so independence assumptions behind Whittle relaxations fail.

The correct description is:

$$
\text{stylized spatial political-economy simulator} + \text{sequential allocation heuristic}.
$$

## Consequence for policy interpretation

- `ucb1` and Gaussian TS are stationary reference baselines.
- discounted and sliding-window variants are piecewise-stationary tracking heuristics.
- `linucb` and `linear-thompson` are shared-parameter linear approximations over evolving state features.
- `whittle-index` is a finite-state surrogate for a coupled continuous-state process.
