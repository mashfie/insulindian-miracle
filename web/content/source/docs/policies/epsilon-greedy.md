---
tags: [policy, baseline, bandit]
type: policy
related:
  - "[[multi-armed-bandits]]"
  - "[[explore-exploit-tradeoff]]"
  - "[[policies]]"
---

# Epsilon-Greedy

The simplest bandit algorithm. With probability ε (default 0.1), select a random arm; otherwise, select the arm with the highest estimated mean reward.

## Formulation

```
A(t) = {  random arm      with probability ε
       {  argmax Q̂(k)     with probability 1 − ε
```

where Q̂(k) is the running average reward for arm k.

## Implementation

`EpsilonGreedyPolicy` in `policies.py:53–81`.

- **State**: `counts[K]`, `values[K]` (running averages)
- **Initialisation**: Pull each arm once (unseen arms are prioritised)
- **Update**: Incremental mean: `Q̂(k) += (r − Q̂(k)) / n(k)`

## Strengths

- Simple, minimal computation
- Guaranteed exploration at rate ε

## Weaknesses

- Fixed ε does not decay — wastes exploration budget late in the horizon
- Explores uniformly — pulls clearly suboptimal arms as often as near-optimal ones
- No adaptation to non-stationarity — stale estimates persist indefinitely
- Achieves O(εT) regret rather than O(log T)

## Expected Performance

- **Baseline**: Adequate — low non-stationarity means initial estimates remain informative
- **Resource curse / UCB bait**: Poor — cannot detect or respond to institutional decay
- **Shock reform**: Poor — fixed exploration rate does not respond to changed reward landscape
