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

Bayesian linear regression with Gaussian prior $\theta \sim \mathcal{N}(\mu_0, \Sigma_0)$ and observation noise $\sigma^2$. After $t$ observations:

$$
V = \Sigma_0^{-1} + \sigma^{-2} \sum_{i=1}^{t} \varphi_i \varphi_i^\top
$$

$$
\hat{\mu} = V^{-1} \left( \Sigma_0^{-1} \mu_0 + \sigma^{-2} \sum_{i=1}^{t} r_i \varphi_i \right)
$$

Selection via posterior sampling:

$$
\tilde{\theta} \sim \mathcal{N}\!\left(\hat{\mu},\; s^2 V^{-1}\right)
$$

$$
A(t) = \arg\max_k \; \varphi(k)^\top \tilde{\theta}
$$

where $\varphi(k) \in \mathbb{R}^{11}$ is the feature vector for arm $k$ and $s$ is the sampling scale.

## Implementation

`LinearThompsonPolicy` in `policies.py:267–305`.

- **Precision matrix**: $V = \lambda I + \sigma^{-2} \sum \varphi \varphi^\top$
- **Reward precision**: $\sigma^{-2} \sum r \varphi$
- **Sampling**: Cholesky decomposition of $V^{-1}$ + normal random vector
- **Observation variance**: `config.linear_thompson_observation_variance` (default 9.0)
- **Sampling scale**: `config.linear_thompson_sampling_scale` (default 1.0)

## Strengths

- Combines contextual features with Bayesian uncertainty
- Natural exploration through posterior sampling (no explicit exploration parameter)
- Adapts to non-stationarity via changing feature vectors

## Weaknesses

- Cholesky decomposition per step is $O(d^3) = O(11^3)$ — modest but more expensive than LinUCB
- Assumes Gaussian noise and linear structure
- Sampling scale is a hyperparameter that affects exploration intensity

## Expected Performance

Similar to [[linucb]] but with more principled exploration. Posterior sampling means it occasionally explores aggressively (high-variance samples) which can help in non-stationary settings where LinUCB's deterministic confidence bound may be too conservative.

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 2279 | 612 | 5/9 |
| resource-curse | 1591 | -462 | 5/9 |
| botswana | 5002 | 355 | 4/9 |
| ucb-bait | 1667 | -1 | 6/9 |
| merchant-republic | 4839 | 790 | 5/9 |
| open-cluster | 4705 | 255 | 5/9 |
| megacity-trap | 2567 | 234 | 5/9 |
| shock-reform | 3035 | 86 | 4/9 |
| balanced-urban | 4557 | 447 | 6/9 |

Consistently mid-table (ranks 4–6). The contextual features provide implicit non-stationarity handling: as institutions evolve, the feature vector $\varphi(k)$ changes, so the model does not require explicit forgetting. Beats the oracle in resource-curse ($-462$) and ucb-bait ($-1$).

## References

- Agrawal, S. & Goyal, N. (2013). Thompson sampling for contextual bandits with linear payoffs. *ICML 2013*.
- Russo, D. J. & Van Roy, B. (2014). Learning to optimize via posterior sampling. *Mathematics of Operations Research*, 39(4), 1221–1243.

[[linucb]] · [[thompson-sampling]] · [[multi-armed-bandits]]
