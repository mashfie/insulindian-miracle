---
tags: [methodology, linear-algebra, optimization]
type: methodology
related:
  - "[[linucb]]"
  - "[[linear-thompson]]"
  - "[[numerical-analysis]]"
---

# Linear Algebra

The optimization layer uses small dense linear algebra at feature dimension

$$
d = 11.
$$

## Shared contextual feature map

For `linucb` and `linear-thompson`,

$$
x_i =
\begin{bmatrix}
1,
g_i,
rho_i,
e_i,
o_i,
a_i,
k_i,
\log(1+p_i),
N_i,
\mathbf{1}_{\text{boomtown}},
\mathbf{1}_{\text{trade-cluster}}
\end{bmatrix}^\top.
$$

This is a shared model across arms, not one regression per site.

## LinUCB

The code stores `V_t^{-1}` directly:

$$
V_t = \lambda I + \sum_{\tau \le t} x_{A_\tau} x_{A_\tau}^\top,
\qquad
b_t = \sum_{\tau \le t} y_\tau x_{A_\tau}.
$$

The parameter estimate is

$$
\hat\theta_t = V_t^{-1} b_t,
$$

and the score is

$$
x_i^\top \hat\theta_t + \alpha \sqrt{x_i^\top V_t^{-1} x_i}.
$$

The inverse is updated by Sherman-Morrison:

$$
(V + xx^\top)^{-1}
=
V^{-1} -
\frac{V^{-1} x x^\top V^{-1}}{1 + x^\top V^{-1} x}.
$$

This is exact for rank-1 updates and cheap at `d = 11`.

## Linear Thompson

The code stores the precision matrix

$$
\Lambda_t = \lambda I + \sigma^{-2} \sum_{\tau \le t} x_{A_\tau} x_{A_\tau}^\top,
\qquad
\eta_t = \sigma^{-2} \sum_{\tau \le t} y_\tau x_{A_\tau}.
$$

Then

$$
\Sigma_t = \Lambda_t^{-1},
\qquad
\mu_t = \Sigma_t \eta_t.
$$

A sampled parameter is

$$
\tilde\theta_t \sim \mathcal N(\mu_t, s^2 \Sigma_t),
$$

implemented as

$$
\tilde\theta_t = \mu_t + s L z,
\qquad
LL^\top \approx \Sigma_t,
\qquad
z \sim \mathcal N(0, I).
$$

`L` is obtained by Cholesky with diagonal jitter if needed.

## Network linear algebra

The simulator precomputes a dense decay matrix

$$
D_{ij} = \exp\left(-\frac{\|u_i-u_j\|}{\sigma_N}\right), \quad i \ne j,
$$

then uses matrix-vector products to compute trade mass:

$$
m = D q,
$$

where

$$
q_j = o_j (1 + \eta_p \log(1+p_j))(1 + \eta_k k_j).
$$

This is the main cross-site vectorized operation in the dynamics.

## What is not here

- no constrained optimization solver,
- no automatic differentiation,
- no sparse algebra,
- no large-scale factorization beyond tiny dense matrices.
