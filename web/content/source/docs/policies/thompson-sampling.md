---
tags: [policy, bayesian, bandit]
type: policy
related:
  - "[[multi-armed-bandits]]"
  - "[[explore-exploit-tradeoff]]"
  - "[[discounted-thompson]]"
  - "[[policies]]"
---

# Thompson Sampling (Gaussian)

Bayesian posterior sampling — maintain a Normal posterior over each arm's mean reward, sample from each posterior, and play the arm with the highest sample.

## Formulation

Prior: N(μ₀, σ₀²) for each arm.

After observing reward r from arm k with observation variance σ²_obs:
```
precision(k) += 1/σ²_obs
mean_precision(k) += r/σ²_obs
posterior_mean(k) = mean_precision(k) / precision(k)
posterior_var(k) = 1 / precision(k)
```

Selection:
```
θ(k) ~ N(posterior_mean(k), posterior_var(k))
A(t) = argmax θ(k)
```

## Implementation

`GaussianThompsonPolicy` in `policies.py:116–158`.

- **Prior**: μ₀ = 0, σ₀² = 16
- **Observation variance**: σ²_obs = 9.0
- **Posterior decay**: `counts *= decay` (default 0.995) — gently widens posteriors over time
- **Minimum exploration variance**: 0.3/√(counts+1) — prevents posterior collapse

## Strengths

- Near-optimal Bayesian regret — matches Lai-Robbins lower bound asymptotically
- Natural uncertainty quantification — explores proportionally to posterior uncertainty
- Posterior decay provides mild non-stationarity handling
- Randomised selection avoids deterministic cycling

## Weaknesses

- Requires tuning of observation variance and prior
- Posterior decay rate must match the rate of environmental change
- More computationally expensive than UCB (random sampling per step)

## Expected Performance

- **Baseline**: Excellent — posterior contracts around true mean quickly
- **Resource curse**: Good — posterior decay detects drift, but slowly if decay = 0.995
- **UCB bait**: Better than UCB1 — posterior sampling means occasional low samples from the boomtown, allowing exploration of alternatives
