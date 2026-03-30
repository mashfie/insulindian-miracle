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

```
A(t) = argmax [ Q̂(k) + √(c · ln(t) / n(k)) ]
```

where c = 2 (exploration parameter), t = total steps, n(k) = pulls of arm k.

## Implementation

`UCB1Policy` in `policies.py:83–113`.

- **State**: `counts[K]`, `values[K]`, `steps`
- **Initialisation**: Pull each arm once
- **Bonus**: `√(2 · log(steps) / counts[k])`

## Strengths

- Achieves O(K log T) regret — theoretically near-optimal for stationary bandits
- Deterministic (no randomness in selection after initialisation)
- Under-explored arms are guaranteed attention

## Weaknesses

- Assumes stationarity — confidence intervals only narrow, never widen
- Slow to abandon a declining arm — the bonus remains large while the estimate averages in the decline
- Susceptible to the [[ucb-bait]] trap: a boomtown with early high rewards gets a high Q̂ that takes many pulls to revise downward

## Expected Performance

- **Baseline**: Good — near-stationary rewards make UCB1 effective
- **UCB bait**: Poor — H7 predicts UCB1 over-invests in the boomtown
- **Resource curse**: Moderate — slow to detect extraction drift
