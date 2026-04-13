---
tags: [policy, contextual, linear]
type: policy
related:
  - "[[linear-thompson]]"
  - "[[linear-algebra]]"
---

# LinUCB

## Rule

With shared feature vector `x_i`,

$$
\hat\theta_t = V_t^{-1} b_t,
\qquad
\text{score}_i = x_i^\top \hat\theta_t + \alpha \sqrt{x_i^\top V_t^{-1} x_i}.
$$

## Implementation

- file: `rust/src/policies.rs`
- feature dimension: `11`
- ridge: `config.linear_bandit_ridge`
- exploration scale: `config.linucb_alpha`
- inverse covariance updated by Sherman-Morrison

## Repo-specific caveat

The true reward law is nonlinear and globally coupled, so the linear-bandit interpretation is approximate. The model is still useful because the features expose evolving institutional state directly.

## Literature

- [Li, Chu, Langford, and Schapire (2010)](https://www.microsoft.com/en-us/research/publication/a-contextual-bandit-approach-to-personalized-news-article-recommendation-3/?lang=ja)
- [Chu et al. (2011)](https://proceedings.mlr.press/v15/chu11a.html)
- [Abbasi-Yadkori, Pal, and Szepesvari (2011)](https://papers.nips.cc/paper/4417-improved-algorithms-for-linear-stochastic-bandits)
