---
tags: [policy, restless, bandit, dynamic-programming]
type: policy
related:
  - "[[restless-bandits]]"
  - "[[multi-armed-bandits]]"
  - "[[institutional-dynamics]]"
  - "[[policies]]"
---

# Whittle Index

The most sophisticated policy — models each arm as a restless bandit with explicit state transitions. Computes a per-arm index via binary search over a subsidy parameter, with 5-step lookahead rollouts.

## Formulation

For each arm $k$ in state $s$, the Whittle index is the infimal subsidy $\lambda$ that makes passivity weakly preferable to activity:

$$
W(s) = \inf \left\{ \lambda : V_{\text{passive}}(s, \lambda) \geq V_{\text{active}}(s, \lambda) \right\}
$$

where $V_{\text{active}}(s, \lambda)$ and $V_{\text{passive}}(s, \lambda)$ are the expected values under the active and passive policies respectively, with $\lambda$ added to the passive reward at each step.

The arm with the highest Whittle index is activated:

$$
A(t) = \arg\max_k \; W(s_k)
$$

A higher index means the arm is more valuable to activate — equivalently, it requires a larger subsidy to justify leaving it idle.

## Implementation

`WhittleIndexPolicy` in `policies.py:308–727`. The most complex policy at 420 lines.

### State Discretisation

Continuous state is binned for tractable dynamic programming:

| Dimension | Bins | Boundaries |
|-----------|------|-----------|
| Population | 7 | 1, 3, 6, 10, 16, 24, 30+ |
| Extraction | 5 | 0.15, 0.35, 0.55, 0.75 |
| Openness | 5 | 0.15, 0.35, 0.55, 0.75 |
| Adaptability | 5 | 0.15, 0.35, 0.55, 0.75 |
| Resource | 5 | 0.15, 0.35, 0.55, 0.75 |
| Capital | 5 | 0.15, 0.35, 0.65, 1.0 |
| Legacy | 5 | 0.05, 0.2, 0.45, 0.7 |
| Geography | 6 | 0.12, 0.24, 0.36, 0.48, 0.62 |
| Network ref. | 6 | 0.1, 0.3, 0.55, 0.85, 1.2 |
| Boomtown | 2 | binary |
| Trade cluster | 2 | binary |

Total state space: $7 \times 5^6 \times 5 \times 6^2 \times 2^2 \approx 39.4\text{M}$ states (but only a tiny fraction are reachable).

### Surrogate Reward

A simplified `compute_reward()` that uses the discretised state dict rather than full `SiteState` objects. Includes all major terms (geography, resource, extraction, inclusive growth, network, congestion, boomtown) plus a path-dependence dividend not in the real reward.

### Surrogate Transition

Deterministic state evolution model:

- **Reform**: if $\sigma(\text{reform\_signal}) > 0.58$ then reduce extraction, boost openness and capital
- **Curse drift**: otherwise, extraction increases as in the real model
- **Active effects**: extraction pressure, resource depletion, openness drag (scaled by activity load)
- **Capital dynamics**: investment and erosion
- **Legacy fade**: gradual decay of shock reform stock

### Index Computation

For each arm:

1. Observe exact state, round to cache key
2. Binary search $\lambda \in [-6, +6]$ over 10 iterations
3. At each $\lambda$: compute $V_{\text{active}}$ and $V_{\text{passive}}$ via 5-step rollout with memoisation
4. Root action values use the real `compute_reward()` for the first step, then switch to surrogate
5. Add spatial anchor: geography-weighted bonus ensuring strong locations maintain priority

$$
\text{anchor} = 5.5 g^2 + 24 p^2 + 0.35 n + 2.4 g^2 \ln(\text{pop}) + 0.04 [\ln(\text{pop})]^2 - 0.04 \max(0, \text{pop} - \tau)^{1.2}
$$

where $g$ = geography score, $p$ = premium, $n$ = network bonus, $\tau$ = congestion threshold.

### Caching

- `index_cache`: exact (rounded) state $\to$ computed index. Never cleared.
- Per-rollout `cache`: $(\text{state\_key}, \text{depth}, \lambda) \to \text{value}$. Local to each `_compute_index()` call.

## Strengths

- Only policy that explicitly models non-stationarity and future state transitions
- Forward-looking — can anticipate institutional decay before it manifests in rewards
- Spatial anchor captures geography-institutional interactions

## Weaknesses

- Computationally expensive — $\sim 10$ binary search iterations $\times$ 5-step rollouts per arm per step
- Surrogate model is approximate — may diverge from real dynamics in edge cases
- State discretisation loses fine-grained institutional distinctions
- No learning from observed rewards — `update()` is a no-op

## Expected Performance

- **Resource curse**: Strong — explicitly models extraction drift and reform probability
- **Shock reform**: Strong — legacy and transition factors are modelled in surrogate
- **UCB bait**: Strong — forward rollout predicts boomtown collapse
- **Baseline**: Good but overkill — simpler policies suffice when non-stationarity is low

## Empirical Performance

12-run experiments across 9 scenarios. Regret is relative to the myopic oracle; negative regret indicates the policy outperformed the oracle.

| Scenario | Reward | Regret | Rank |
|----------|--------|--------|------|
| baseline | 2770 | 122 | 3/9 |
| resource-curse | 273 | 856 | 9/9 |
| botswana | 5380 | -23 | 2/9 |
| ucb-bait | 1218 | 448 | 7/9 |
| merchant-republic | 5833 | -205 | 2/9 |
| open-cluster | 5267 | -306 | 1/9 |
| megacity-trap | 2948 | -146 | 2/9 |
| shock-reform | 2603 | 519 | 7/9 |
| balanced-urban | 5201 | -196 | 1/9 |

Highly variable performance — ranks 1st in open-cluster and balanced-urban but 9th in resource-curse (reward of only 273). The surrogate transition model's approximation of extraction dynamics appears to diverge catastrophically in the resource-curse scenario, while the spatial anchor and forward-looking rollouts excel in geographically structured scenarios (merchant-republic, open-cluster, balanced-urban).

## References

- Whittle, P. (1988). Restless bandits: activity allocation in a changing world. *Journal of Applied Probability*, 25(A), 287–298.
- Weber, R. R. & Weiss, G. (1990). On an index policy for restless bandits. *Journal of Applied Probability*, 27(3), 637–648.
- Glazebrook, K. D., Ruiz-Hernandez, D. & Sherlaw-Johnson, C. (2006). Some indexability conditions for real-state restless bandits. *Advances in Applied Probability*, 38(3), 585–611.

[[restless-bandits]] · [[multi-armed-bandits]] · [[institutional-dynamics]]
