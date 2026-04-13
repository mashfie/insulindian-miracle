---
tags: [system, reward]
type: system
related:
  - "[[formal-model]]"
  - "[[institutional-dynamics]]"
---

# Reward Function

`compute_all_rewards()` and `compute_reward_snapshot()` implement the same economic decomposition.

## Main equation

For site `i`,

$$
\begin{aligned}
R_i
=\;& g_i \\
&+ \rho_i(\beta_0 + \beta_e e_i) \\
&+ \beta_x \rho_i e_i \max(0.55, 1 - 0.2 k_i) \\
&+ (1-e_i) p_i^{\alpha} (1 + \beta_k k_i) \\
&+ \beta_I \rho_i (1-e_i)(0.45 + o_i + 0.35 k_i) \\
&+ \beta_S N_i \exp\!\left(
-\frac{(\log(1+p_i)-\log(1+\tau_S))^2}{2\sigma_S^2}
\right) \\
&- \beta_D e_i p_i \\
&- \beta_C p_i^2 \\
&- \beta_M [p_i-\tau_M]_+^{1.35} \\
&- c_{\text{reform}} \mathbf 1_{\text{reform timer} > 0} \\
&+ b_i^{\text{early}} - b_i^{\text{collapse}}.
\end{aligned}
$$

## Interpretation of the terms

- `g_i`: fixed geography payoff.
- `rho_i(beta_0 + beta_e e_i)`: resource rents become more immediately lucrative under higher extraction.
- `beta_x ...`: extractive cashflow premium.
- `(1-e_i) p_i^alpha (1 + beta_k k_i)`: inclusive agglomeration with capital complementarity.
- `beta_I ...`: reinvestment dividend from inclusive use of resources.
- secondary-city bonus: rewards midsize rather than only maximal cities.
- `beta_D e_i p_i`: extraction drag.
- `beta_C p_i^2`: congestion.
- overstretch term: additional superlinear cost for very large cities.

## Network bonus

The reward uses

$$
N_i = o_i \bar q_i \left(1 + \eta_d \delta_i\right),
$$

where

$$
\bar q_i = \frac{\sum_{j \ne i} D_{ij} q_j}{\sum_{j \ne i} D_{ij}},
\qquad
q_j = o_j(1+\eta_p \log(1+p_j))(1+\eta_k k_j),
\qquad
D_{ij} = \exp(-d_{ij}/\sigma_N).
$$

## Boomtown terms

If a site is tagged as a boomtown:

- it receives a temporary early bonus over `boomtown_bonus_duration`,
- after `boomtown_collapse_threshold`, it pays a linear collapse penalty,
- active use accelerates resource depletion through `boomtown_decay_multiplier`.

## Oracle semantics

The so-called myopic oracle evaluates `compute_reward_snapshot(i, states, config, 1)` and selects the largest one-step reward. It is a one-step counterfactual oracle, not a long-horizon planner.
