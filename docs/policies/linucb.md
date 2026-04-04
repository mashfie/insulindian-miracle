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

Ridge regression estimate:

$$
\hat{\theta} = V^{-1} b
$$

where $V = \sum \varphi(k)\varphi(k)^\top + \lambda I$ and $b = \sum r \cdot \varphi(k)$.

Upper confidence bound in feature space:

$$
\text{score}(k) = \varphi(k)^\top \hat{\theta} + \alpha \sqrt{\varphi(k)^\top V^{-1} \varphi(k)}
$$

$$
A(t) = \arg\max_k \; \text{score}(k)
$$

The term $\sqrt{\varphi(k)^\top V^{-1} \varphi(k)}$ is the predictive standard deviation under the linear model — arms in under-explored regions of feature space receive a larger bonus.

## Implementation

`LinUCBPolicy` in `policies.py:233–264`.

- **Feature dim**: 11 (see [[policies#Contextual Feature Vector]])
- **$\alpha$**: `config.linucb_alpha` (default 1.15)
- **Ridge**: $\lambda$ = `config.linear_bandit_ridge` (default 1.0)
- **Shared model**: single covariance matrix and reward vector across all arms
- **Update**: rank-1 update: $V \leftarrow V + \varphi \varphi^\top$, $b \leftarrow b + r \varphi$

## Feature Vector

$$
\varphi(k) = [\text{bias},\; \text{geo},\; \text{rent},\; \text{extract},\; \text{open},\; \text{adapt},\; \text{capital},\; \ln(\text{pop}),\; \text{network},\; \mathbb{1}_{\text{boom}},\; \mathbb{1}_{\text{trade}}]
$$

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

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 2088 | 804 | 7/9 |
| resource-curse | 1412 | -283 | 6/9 |
| botswana | 4986 | 371 | 5/9 |
| ucb-bait | 1699 | -33 | 5/9 |
| merchant-republic | 4566 | 1062 | 6/9 |
| open-cluster | 4731 | 230 | 4/9 |
| megacity-trap | 2273 | 528 | 6/9 |
| shock-reform | 2969 | 153 | 5/9 |
| balanced-urban | 4626 | 378 | 5/9 |

Ranked 4th–7th across scenarios. The contextual features provide the same implicit adaptation as Linear Thompson but the deterministic confidence bound is less aggressive in exploration, resulting in slightly lower performance in most scenarios. Strongest in open-cluster (4th) where feature-space structure matters most.

## References

- Li, L., Chu, W., Langford, J. & Schapire, R. E. (2010). A contextual-bandit approach to personalized news article recommendation. *WWW 2010*, 661–670.
- Abbasi-Yadkori, Y., Pál, D. & Szepesvári, C. (2011). Improved algorithms for linear stochastic bandits. *NIPS 2011*.

[[linear-thompson]] · [[multi-armed-bandits]]
