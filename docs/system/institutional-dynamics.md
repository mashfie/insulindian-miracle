---
tags: [system, institutions, dynamics]
type: system
related:
  - "[[reward-function]]"
  - "[[shock-reform]]"
  - "[[restless-bandits]]"
---

# Institutional Dynamics

Every site evolves every step. That is the mechanism that makes the problem restless.

## Readiness

The readiness score is

$$
\text{readiness}_i
=
0.28(1-e_i)+0.28o_i+0.26a_i+0.18\min(k_i/1.5,1).
$$

It is computed at initialization and reused in shock handling as stored `shock_readiness`.

## Reform vs curse drift

If `reform_timer == 0`, the code computes

$$
\text{crisis}_i =
\sigma\!\left(
-\Delta R_i \cdot \gamma_r
 + \beta_s \text{shock memory}_i
 + 2 \cdot \text{transition}_i
 + \ell_i
\right),
$$

then

$$
P(\text{reform}_i) = \min(1, a^{\text{eff}}_i \cdot \text{crisis}_i).
$$

If reform occurs:

- `e_i` falls,
- `o_i` rises,
- `k_i` can be rebuilt,
- `reform_timer` is set,
- `reforms_triggered` increments.

Otherwise extraction drifts upward:

$$
e_i'
=
e_i +
\kappa_{\text{curse}}
\rho_i
\left[
1-\beta_o o_i-\beta_k k_i-\beta_t \text{transition}_i-\beta_\ell \ell_i
\right]_+
(1-e_i).
$$

## Active-site degradation

If site `i` is chosen this step, active use increases extraction and depletes resources:

$$
e_i' \leftarrow e_i' + \kappa_A L_i \rho_i \max(e_i', 0.1)(1-e_i'),
$$

$$
\rho_i' \leftarrow \rho_i \left(1 - \delta_A L_i \rho_i (0.35 + e_i')\right),
$$

$$
o_i' \leftarrow o_i' - \chi_A L_i e_i'.
$$

Here `L_i` is the activity-load term based on post-selection population and `active_decay_onset`.

## Capital law of motion

Capital follows

$$
k_i' =
\text{clip}\left(
k_i + s_i I_i + 0.015 N_i - E_i,
0, 1.5
\right),
$$

where

$$
I_i = 0.25 \beta_I \rho_i (1-e_i)(0.4 + o_i + 0.25 N_i),
\qquad
E_i = \beta_E e_i(0.35+\rho_i).
$$

`s_i = 1` on the active site and `passive_investment_scale` otherwise.

## Shocks

With probability `shock_probability`:

1. a site is chosen, optionally resource-biased,
2. resource rent and capital are reduced immediately,
3. shock memory, transition timer, and legacy channels are activated,
4. readiness-scaled reform support may fire instantly.

This is a reduced-form crisis-and-reform channel, not a structural political model.

## Migration

After local updates the engine compares population momentum across sites and can move one resident from the lowest-momentum populated site to the highest-momentum site when both exceed threshold conditions.

That makes the dynamics globally coupled even if the policy activates only one site.
