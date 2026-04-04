---
tags: [policy, baseline, bandit]
type: policy
related:
  - "[[multi-armed-bandits]]"
  - "[[explore-exploit-tradeoff]]"
  - "[[policies]]"
---

# Epsilon-Greedy

The simplest bandit algorithm. With probability $\varepsilon$ (default 0.1), select a random arm; otherwise, select the arm with the highest estimated mean reward.

## Formulation

$$
A(t) = \begin{cases} \text{random arm} & \text{with probability } \varepsilon \\ \arg\max_k \hat{Q}(k) & \text{with probability } 1 - \varepsilon \end{cases}
$$

where $\hat{Q}(k)$ is the running average reward for arm $k$.

## Implementation

`EpsilonGreedyPolicy` in `policies.py:53–81`.

- **State**: `counts[K]`, `values[K]` (running averages)
- **Initialisation**: Pull each arm once (unseen arms are prioritised)
- **Update**: Incremental mean: $\hat{Q}(k) \leftarrow \hat{Q}(k) + \frac{r - \hat{Q}(k)}{n(k)}$

## Strengths

- Simple, minimal computation
- Guaranteed exploration at rate $\varepsilon$

## Weaknesses

- Fixed $\varepsilon$ does not decay — wastes exploration budget late in the horizon
- Explores uniformly — pulls clearly suboptimal arms as often as near-optimal ones
- No adaptation to non-stationarity — stale estimates persist indefinitely
- Achieves $O(\varepsilon T)$ regret rather than $O(\log T)$

## Expected Performance

- **Baseline**: Adequate — low non-stationarity means initial estimates remain informative
- **Resource curse / UCB bait**: Poor — cannot detect or respond to institutional decay
- **Shock reform**: Poor — fixed exploration rate does not respond to changed reward landscape

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 1791 | 1101 | 8/9 |
| resource-curse | 759 | 369 | 8/9 |
| botswana | 3230 | 2127 | 8/9 |
| ucb-bait | 965 | 701 | 9/9 |
| merchant-republic | 3501 | 2128 | 8/9 |
| open-cluster | 3095 | 1866 | 8/9 |
| megacity-trap | 1587 | 1215 | 9/9 |
| shock-reform | 1763 | 1358 | 9/9 |
| balanced-urban | 3450 | 1554 | 8/9 |

Consistently ranked 8th or 9th across all scenarios. Uniform exploration and lack of non-stationarity handling place it above only UCB1 in most settings.

## References

- Sutton, R. S. & Barto, A. G. (2018). *Reinforcement Learning: An Introduction*, Chapter 2.
- Auer, P., Cesa-Bianchi, N. & Fischer, P. (2002). Finite-time analysis of the multiarmed bandit problem. *Machine Learning*, 47(2–3), 235–256.

[[multi-armed-bandits]] · [[explore-exploit-tradeoff]]
