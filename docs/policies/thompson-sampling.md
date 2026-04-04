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

Prior for each arm $k$:

$$
\mu_k \sim \mathcal{N}(\mu_0, \sigma_0^2)
$$

After observing reward $r$ from arm $k$ with observation variance $\sigma_{\text{obs}}^2$:

$$
\tau_k \leftarrow \tau_k + \frac{1}{\sigma_{\text{obs}}^2}
$$

$$
\nu_k \leftarrow \nu_k + \frac{r}{\sigma_{\text{obs}}^2}
$$

$$
\mu_{\text{post}}(k) = \frac{\nu_k}{\tau_k}, \qquad \sigma_{\text{post}}^2(k) = \frac{1}{\tau_k}
$$

Selection:

$$
\theta(k) \sim \mathcal{N}\!\left(\mu_{\text{post}}(k),\; \sigma_{\text{post}}^2(k)\right)
$$

$$
A(t) = \arg\max_k \theta(k)
$$

## Implementation

`GaussianThompsonPolicy` in `policies.py:116–158`.

- **Prior**: $\mu_0 = 0$, $\sigma_0^2 = 16$
- **Observation variance**: $\sigma_{\text{obs}}^2 = 9.0$
- **Posterior decay**: $\text{counts} \leftarrow \text{counts} \times \delta$ (default $\delta = 0.995$) — gently widens posteriors over time
- **Minimum exploration variance**: $\frac{0.3}{\sqrt{n(k)+1}}$ — prevents posterior collapse

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
- **Resource curse**: Good — posterior decay detects drift, but slowly if $\delta = 0.995$
- **UCB bait**: Better than UCB1 — posterior sampling means occasional low samples from the boomtown, allowing exploration of alternatives

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 2155 | 736 | 6/9 |
| resource-curse | 1614 | -485 | 4/9 |
| botswana | 3933 | 1425 | 7/9 |
| ucb-bait | 1737 | -71 | 4/9 |
| merchant-republic | 4024 | 1605 | 7/9 |
| open-cluster | 3642 | 1319 | 7/9 |
| megacity-trap | 2253 | 548 | 7/9 |
| shock-reform | 2701 | 420 | 6/9 |
| balanced-urban | 3745 | 1259 | 7/9 |

Mid-table performance (ranks 4–7). The mild posterior decay ($\delta = 0.995$) is insufficient for the degree of non-stationarity in most scenarios. Beats the oracle in resource-curse and ucb-bait where stochastic exploration avoids traps, but the slow forgetting rate costs it dearly in structured environments.

## References

- Thompson, W. R. (1933). On the likelihood that one unknown probability exceeds another in view of the evidence of two samples. *Biometrika*, 25(3/4), 285–294.
- Agrawal, S. & Goyal, N. (2012). Analysis of Thompson sampling for the multi-armed bandit problem. *COLT 2012*.
- Russo, D. J. et al. (2018). A tutorial on Thompson sampling. *Foundations and Trends in Machine Learning*, 11(1), 1–96.

[[multi-armed-bandits]] · [[explore-exploit-tradeoff]] · [[discounted-thompson]]
