---
tags: [policy, bayesian, bandit, non-stationary]
type: policy
related:
  - "[[thompson-sampling]]"
  - "[[multi-armed-bandits]]"
  - "[[policies]]"
---

# Discounted Thompson Sampling

A more aggressive non-stationary variant of [[thompson-sampling]] with stronger posterior decay.

## Formulation

Identical to Gaussian Thompson Sampling, but with $\delta = 0.94$ (vs 0.995). At each step, the precision is decayed:

$$
\tau_k \leftarrow \delta \cdot \tau_k, \qquad \nu_k \leftarrow \delta \cdot \nu_k
$$

The effective sample size is approximately $\frac{1}{1-\delta} \approx 17$, compared to $\sim 200$ for standard Thompson ($\delta = 0.995$).

Selection proceeds identically:

$$
\theta(k) \sim \mathcal{N}\!\left(\frac{\nu_k}{\tau_k},\; \frac{1}{\tau_k}\right)
$$

$$
A(t) = \arg\max_k \theta(k)
$$

## Implementation

`DiscountedGaussianThompsonPolicy` in `policies.py:228–229`.

Inherits from `GaussianThompsonPolicy` — only the `name` and default `posterior_decay` differ (set via `config.discounted_thompson_posterior_decay`).

## Strengths

- Rapidly adapts to changing reward distributions
- Posterior widens quickly, triggering re-exploration of abandoned arms
- Well-suited for scenarios with strong non-stationarity

## Weaknesses

- High variance in estimates — effective sample of $\sim 17$ means noisy posteriors
- May over-explore in stable environments
- The aggressive decay can cause "thrashing" — switching arms too frequently

## Expected Performance

- **Resource curse**: Strong — detects extraction drift within $\sim 15$ steps
- **UCB bait**: Strong — quickly revises boomtown estimate downward after collapse
- **Baseline**: Slightly worse than standard Thompson due to excess exploration noise
- **Shock reform**: Strong — rapidly forgets pre-shock baselines

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 2753 | 139 | 4/9 |
| resource-curse | 1962 | -833 | 3/9 |
| botswana | 4776 | 582 | 6/9 |
| ucb-bait | 1793 | -127 | 3/9 |
| merchant-republic | 4891 | 737 | 4/9 |
| open-cluster | 4444 | 517 | 6/9 |
| megacity-trap | 2737 | 64 | 4/9 |
| shock-reform | 3289 | -167 | 3/9 |
| balanced-urban | 4650 | 354 | 4/9 |

Ranked 3rd–6th across scenarios. The aggressive decay ($\delta = 0.94$) substantially outperforms standard Thompson ($\delta = 0.995$), confirming that the environment's non-stationarity demands fast forgetting. Beats the oracle in resource-curse ($-833$), ucb-bait ($-127$), and shock-reform ($-167$).

## References

- Raj, V. & Kalyani, S. (2017). Taming non-stationary bandits: a Bayesian approach. *arXiv:1707.09727*.
- Russo, D. J. et al. (2018). A tutorial on Thompson sampling. *Foundations and Trends in Machine Learning*, 11(1), 1–96.

[[thompson-sampling]] · [[multi-armed-bandits]]
