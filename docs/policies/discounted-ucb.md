---
tags: [policy, optimistic, bandit, non-stationary]
type: policy
related:
  - "[[ucb1]]"
  - "[[sliding-window-ucb]]"
  - "[[multi-armed-bandits]]"
  - "[[policies]]"
---

# Discounted UCB

An extension of [[ucb1]] that exponentially discounts past observations, giving more weight to recent rewards.

## Formulation

At each step, all counts and reward sums are multiplied by γ (default 0.97):

```
n̂(k) = γ · n̂(k) + 𝟙[A(t)=k]
R̂(k) = γ · R̂(k) + r(t) · 𝟙[A(t)=k]
Q̂(k) = R̂(k) / n̂(k)
A(t) = argmax [ Q̂(k) + √(c · ln(N̂) / n̂(k)) ]
```

where N̂ is the discounted total mass.

## Implementation

`DiscountedUCBPolicy` in `policies.py:161–194`.

- **State**: `counts[K]` (float), `reward_sums[K]` (float), `total_mass` (float)
- **Discount**: γ = `config.discounted_ucb_gamma` (default 0.97)

## Strengths

- Adapts to non-stationary rewards — recent observations dominate
- Same optimistic exploration as UCB1
- Smooth forgetting (no hard window boundary)

## Weaknesses

- Effective sample size shrinks as 1/(1−γ) ≈ 33, so estimates are noisier
- γ must be tuned to the rate of change — too low = too much noise, too high = too slow to adapt
- Still based on mean estimates, not posterior distributions

## Expected Performance

- **Resource curse**: Better than UCB1 — detects extraction drift within ~30 steps
- **Shock reform**: Good — discount naturally forgets pre-shock reward levels
- **Baseline**: Slightly worse than UCB1 due to noisier estimates
