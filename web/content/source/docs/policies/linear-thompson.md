---
tags: [policy, contextual, bayesian, bandit]
type: policy
related:
  - "[[linucb]]"
  - "[[thompson-sampling]]"
  - "[[multi-armed-bandits]]"
  - "[[policies]]"
---

# Linear Thompson Sampling

Contextual Thompson sampling — maintains a posterior over the linear model's weight vector and samples from it to select arms.

## Formulation

```
Posterior: θ ~ N(μ, Σ)
  μ = Σ · (Σ₀⁻¹ · μ₀ + σ⁻² · Σ xᵢrᵢ)
  Σ = (Σ₀⁻¹ + σ⁻² · Σ xᵢxᵢᵀ)⁻¹

Selection:
  θ̃ ~ N(μ, scale² · Σ)
  A(t) = argmax x(k)ᵀ · θ̃
```

## Implementation

`LinearThompsonPolicy` in `policies.py:267–305`.

- **Precision matrix**: `Σ⁻¹ = ridge · I + σ⁻² · Σ x·xᵀ`
- **Reward precision**: `σ⁻² · Σ r · x`
- **Sampling**: Cholesky decomposition of covariance + normal random vector
- **Observation variance**: `config.linear_thompson_observation_variance` (default 9.0)
- **Sampling scale**: `config.linear_thompson_sampling_scale` (default 1.0)

## Strengths

- Combines contextual features with Bayesian uncertainty
- Natural exploration through posterior sampling (no explicit exploration parameter)
- Adapts to non-stationarity via changing feature vectors

## Weaknesses

- Cholesky decomposition per step is O(d³) = O(11³) — modest but more expensive than LinUCB
- Assumes Gaussian noise and linear structure
- Sampling scale is a hyperparameter that affects exploration intensity

## Expected Performance

Similar to [[linucb]] but with more principled exploration. Posterior sampling means it occasionally explores aggressively (high-variance samples) which can help in non-stationary settings where LinUCB's deterministic confidence bound may be too conservative.
