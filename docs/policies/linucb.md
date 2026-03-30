---
tags: [policy, contextual, bandit]
type: policy
related:
  - "[[linear-thompson]]"
  - "[[multi-armed-bandits]]"
  - "[[policies]]"
---

# LinUCB

Contextual bandit with regularised linear regression. Observes an 11-dimensional feature vector per arm and selects based on predicted reward plus a confidence bonus in feature space.

## Formulation

```
θ̂ = A⁻¹ · b                           # Ridge regression estimate
score(k) = x(k)ᵀ · θ̂ + α · √(x(k)ᵀ · A⁻¹ · x(k))
A(t) = argmax score(k)
```

where A = Σ x(k)x(k)ᵀ + λI (covariance), b = Σ r·x(k) (reward-weighted features), α controls exploration.

## Implementation

`LinUCBPolicy` in `policies.py:233–264`.

- **Feature dim**: 11 (see [[policies#Contextual Feature Vector]])
- **α**: `config.linucb_alpha` (default 1.15)
- **Ridge**: `config.linear_bandit_ridge` (default 1.0)
- **Shared model**: single covariance matrix and reward vector across all arms
- **Update**: rank-1 update: `A += x·xᵀ`, `b += r·x`

## Feature Vector

```
[bias, geography, resource_rent, extraction, openness, adaptability,
 capital, log_pop, network_bonus, is_boomtown, is_trade_cluster]
```

Because features include *current* institutional state (extraction, openness, capital), the model implicitly adapts to non-stationarity — the same arm yields different feature vectors as its institutions evolve.

## Strengths

- Uses contextual information — can distinguish arms by their current institutional and geographic state
- Implicit non-stationarity handling via changing features
- Confidence bonus is calibrated to feature-space uncertainty

## Weaknesses

- Assumes linear reward structure — may underfit complex reward interactions
- Shared model means all arms contribute to the same regression, which may be noisy if reward functions differ across arm types
- Computationally more expensive than index-based policies (matrix inverse per step)

## Expected Performance

- **Open cluster / Merchant republic**: Strong — features capture trade cluster membership and openness
- **Resource curse**: Good — changing extraction feature signals institutional decay
- **Baseline**: Competitive — contextual information helps even in stable environments
