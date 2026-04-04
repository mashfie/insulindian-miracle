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

At each step, all counts and reward sums are multiplied by $\gamma$ (default 0.97):

$$
\hat{n}(k) = \gamma \cdot \hat{n}(k) + \mathbb{1}[A(t) = k]
$$

$$
\hat{R}(k) = \gamma \cdot \hat{R}(k) + r(t) \cdot \mathbb{1}[A(t) = k]
$$

$$
\hat{Q}(k) = \frac{\hat{R}(k)}{\hat{n}(k)}
$$

$$
A(t) = \arg\max_k \left[ \hat{Q}(k) + \sqrt{\frac{c \ln \hat{N}}{\hat{n}(k)}} \right]
$$

where $\hat{N} = \sum_k \hat{n}(k)$ is the discounted total mass.

## Implementation

`DiscountedUCBPolicy` in `policies.py:161–194`.

- **State**: `counts[K]` (float), `reward_sums[K]` (float), `total_mass` (float)
- **Discount**: $\gamma$ = `config.discounted_ucb_gamma` (default 0.97)

## Strengths

- Adapts to non-stationary rewards — recent observations dominate
- Same optimistic exploration as UCB1
- Smooth forgetting (no hard window boundary)

## Weaknesses

- Effective sample size shrinks as $\frac{1}{1-\gamma} \approx 33$, so estimates are noisier
- $\gamma$ must be tuned to the rate of change — too low = too much noise, too high = too slow to adapt
- Still based on mean estimates, not posterior distributions

## Expected Performance

- **Resource curse**: Better than UCB1 — detects extraction drift within ~30 steps
- **Shock reform**: Good — discount naturally forgets pre-shock reward levels
- **Baseline**: Slightly worse than UCB1 due to noisier estimates

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 2886 | 6 | 2/9 |
| resource-curse | 2336 | -1207 | 2/9 |
| botswana | 5359 | -1 | 3/9 |
| ucb-bait | 1825 | -159 | 2/9 |
| merchant-republic | 5634 | -6 | 3/9 |
| open-cluster | 5057 | -96 | 3/9 |
| megacity-trap | 2922 | -121 | 3/9 |
| shock-reform | 3429 | -308 | 2/9 |
| balanced-urban | 4995 | 10 | 3/9 |

Consistently ranked 2nd or 3rd. Beats the myopic oracle in 6 of 9 scenarios — the discount factor allows it to adapt faster than the oracle's greedy strategy, particularly in resource-curse ($-1207$ regret) and shock-reform ($-308$).

## References

- Garivier, A. & Moulines, E. (2011). On upper-confidence bound policies for switching bandit problems. *ALT 2011*, LNCS 6925, 174–188.
- Kocsis, L. & Szepesvári, C. (2006). Discounted UCB. *Proceedings of the 2nd PASCAL Challenges Workshop*.

[[ucb1]] · [[sliding-window-ucb]] · [[multi-armed-bandits]]
