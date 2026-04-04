---
tags: [policy, optimistic, bandit, non-stationary]
type: policy
related:
  - "[[ucb1]]"
  - "[[discounted-ucb]]"
  - "[[multi-armed-bandits]]"
  - "[[policies]]"
---

# Sliding Window UCB

A non-stationary variant of [[ucb1]] that retains only the last $W$ observations per arm.

## Formulation

$$
\hat{Q}(k) = \frac{1}{n_W(k)} \sum_{i \in \mathcal{W}_k} r_i
$$

$$
n_W(k) = \min\bigl(n(k),\; W\bigr)
$$

$$
A(t) = \arg\max_k \left[ \hat{Q}(k) + \sqrt{\frac{c \ln N_W}{n_W(k)}} \right]
$$

where $\mathcal{W}_k$ denotes the last $W$ observations of arm $k$ and $N_W = \sum_k n_W(k)$.

## Implementation

`SlidingWindowUCBPolicy` in `policies.py:197–224`.

- **State**: `reward_windows[K]` — deque of maxlen $W$ per arm
- **Window**: $W$ = `config.sliding_window_ucb_window` (default 40)
- **Bonus**: Based on windowed count, not total

## Strengths

- Hard forgetting — old data is completely discarded, so stale estimates cannot persist
- Simple and interpretable — "use only the last $W$ observations"
- Good when change is abrupt (regime shifts, shocks)

## Weaknesses

- Window size $W$ is a hyperparameter that must be tuned to the timescale of change
- Small $W$ = high variance; large $W$ = slow adaptation
- Wasteful — discards potentially useful data from within the window

## Expected Performance

- **Shock reform**: Good — window naturally forgets pre-shock performance
- **UCB bait**: Moderate — if $W < \text{boomtown\_bonus\_duration}$ (42), the window only sees declining rewards
- **Baseline**: Slightly worse than UCB1 due to smaller effective sample

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 2962 | -70 | 1/9 |
| resource-curse | 2357 | -1228 | 1/9 |
| botswana | 5513 | -156 | 1/9 |
| ucb-bait | 1832 | -166 | 1/9 |
| merchant-republic | 5849 | -220 | 1/9 |
| open-cluster | 5217 | -256 | 2/9 |
| megacity-trap | 2951 | -150 | 1/9 |
| shock-reform | 3470 | -349 | 1/9 |
| balanced-urban | 5197 | -193 | 2/9 |

The dominant policy in this environment. Ranked 1st in 7 of 9 scenarios and 2nd in the remaining two. Beats the myopic oracle in every scenario — the hard window boundary is well-calibrated to the institutional dynamics timescale, discarding stale data exactly when it becomes misleading.

## References

- Garivier, A. & Moulines, E. (2011). On upper-confidence bound policies for switching bandit problems. *ALT 2011*, LNCS 6925, 174–188.
- Auer, P., Cesa-Bianchi, N. & Fischer, P. (2002). Finite-time analysis of the multiarmed bandit problem. *Machine Learning*, 47(2–3), 235–256.

[[ucb1]] · [[discounted-ucb]] · [[multi-armed-bandits]]
