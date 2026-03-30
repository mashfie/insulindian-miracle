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

A non-stationary variant of [[ucb1]] that retains only the last W observations per arm.

## Formulation

```
Q̂(k) = mean(last W rewards for arm k)
n(k) = min(total pulls of k, W)
A(t) = argmax [ Q̂(k) + √(c · ln(N) / n(k)) ]
```

## Implementation

`SlidingWindowUCBPolicy` in `policies.py:197–224`.

- **State**: `reward_windows[K]` — deque of maxlen W per arm
- **Window**: W = `config.sliding_window_ucb_window` (default 40)
- **Bonus**: Based on windowed count, not total

## Strengths

- Hard forgetting — old data is completely discarded, so stale estimates cannot persist
- Simple and interpretable — "use only the last W observations"
- Good when change is abrupt (regime shifts, shocks)

## Weaknesses

- Window size W is a hyperparameter that must be tuned to the timescale of change
- Small W = high variance; large W = slow adaptation
- Wasteful — discards potentially useful data from within the window

## Expected Performance

- **Shock reform**: Good — window naturally forgets pre-shock performance
- **UCB bait**: Moderate — if W < boomtown_bonus_duration (42), the window only sees declining rewards
- **Baseline**: Slightly worse than UCB1 due to smaller effective sample
