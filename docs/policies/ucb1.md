---
tags: [policy, optimistic, bandit]
type: policy
related:
  - "[[multi-armed-bandits]]"
  - "[[explore-exploit-tradeoff]]"
  - "[[policies]]"
  - "[[discounted-ucb]]"
  - "[[sliding-window-ucb]]"
---

# UCB1

Upper Confidence Bound — selects the arm with the highest estimated mean plus an exploration bonus that shrinks as the arm is pulled more.

## Formulation

$$
A(t) = \arg\max_k \left[ \hat{Q}(k) + \sqrt{\frac{c \ln t}{n(k)}} \right]
$$

where $c = 2$ (exploration parameter), $t$ = total steps, $n(k)$ = pulls of arm $k$.

## Implementation

`UCB1Policy` in `policies.py:83–113`.

- **State**: `counts[K]`, `values[K]`, `steps`
- **Initialisation**: Pull each arm once
- **Bonus**: $\sqrt{\frac{2 \ln(\text{steps})}{\text{counts}[k]}}$

## Strengths

- Achieves $O(K \log T)$ regret — theoretically near-optimal for stationary bandits
- Deterministic (no randomness in selection after initialisation)
- Under-explored arms are guaranteed attention

## Weaknesses

- Assumes stationarity — confidence intervals only narrow, never widen
- Slow to abandon a declining arm — the bonus remains large while the estimate averages in the decline
- Susceptible to the [[ucb-bait]] trap: a boomtown with early high rewards gets a high $\hat{Q}$ that takes many pulls to revise downward

## Expected Performance

- **Baseline**: Good — near-stationary rewards make UCB1 effective
- **UCB bait**: Poor — H7 predicts UCB1 over-invests in the boomtown
- **Resource curse**: Moderate — slow to detect extraction drift

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 1588 | 1304 | 9/9 |
| resource-curse | 1204 | -75 | 7/9 |
| botswana | 3018 | 2339 | 9/9 |
| ucb-bait | 1155 | 511 | 8/9 |
| merchant-republic | 2962 | 2666 | 9/9 |
| open-cluster | 2719 | 2242 | 9/9 |
| megacity-trap | 1600 | 1201 | 8/9 |
| shock-reform | 1891 | 1230 | 8/9 |
| balanced-urban | 2739 | 2266 | 9/9 |

Last or second-to-last in every scenario. The stationary assumption is consistently punished in this non-stationary environment. The sole negative regret (resource-curse) is modest at $-75$, likely from exploration stumbling onto better arms by accident.

## References

- Auer, P., Cesa-Bianchi, N. & Fischer, P. (2002). Finite-time analysis of the multiarmed bandit problem. *Machine Learning*, 47(2–3), 235–256.
- Lai, T. L. & Robbins, H. (1985). Asymptotically efficient adaptive allocation rules. *Advances in Applied Mathematics*, 6(1), 4–22.

[[multi-armed-bandits]] · [[explore-exploit-tradeoff]]
