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

Identical to Gaussian Thompson Sampling, but with `posterior_decay = 0.94` (vs 0.995). This means the effective sample size is roughly 1/(1−0.94) ≈ 17, compared to ~200 for standard Thompson.

## Implementation

`DiscountedGaussianThompsonPolicy` in `policies.py:228–229`.

Inherits from `GaussianThompsonPolicy` — only the `name` and default `posterior_decay` differ (set via `config.discounted_thompson_posterior_decay`).

## Strengths

- Rapidly adapts to changing reward distributions
- Posterior widens quickly, triggering re-exploration of abandoned arms
- Well-suited for scenarios with strong non-stationarity

## Weaknesses

- High variance in estimates — effective sample of ~17 means noisy posteriors
- May over-explore in stable environments
- The aggressive decay can cause "thrashing" — switching arms too frequently

## Expected Performance

- **Resource curse**: Strong — detects extraction drift within ~15 steps
- **UCB bait**: Strong — quickly revises boomtown estimate downward after collapse
- **Baseline**: Slightly worse than standard Thompson due to excess exploration noise
- **Shock reform**: Strong — rapidly forgets pre-shock baselines
