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

For each arm k in state s:

```
W(s) = inf { λ : V_passive(s, λ) ≥ V_active(s, λ) }
```

The arm with the highest Whittle index is activated. The index represents the subsidy needed to make passivity as attractive as activity — a higher index means the arm is more valuable to activate.

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

Total state space: 7 × 5⁶ × 5 × 6² × 2² ≈ 39.4M states (but only a tiny fraction are reachable).

### Surrogate Reward

A simplified `compute_reward()` that uses the discretised state dict rather than full `SiteState` objects. Includes all major terms (geography, resource, extraction, inclusive growth, network, congestion, boomtown) plus a path-dependence dividend not in the real reward.

### Surrogate Transition

Deterministic state evolution model:
- **Reform**: if `sigmoid(reform_signal) > 0.58` → reduce extraction, boost openness and capital
- **Curse drift**: otherwise, extraction increases as in the real model
- **Active effects**: extraction pressure, resource depletion, openness drag (scaled by activity load)
- **Capital dynamics**: investment and erosion
- **Legacy fade**: gradual decay of shock reform stock

### Index Computation

For each arm:
1. Observe exact state → round to cache key
2. Binary search λ ∈ [-6, +6] over 10 iterations
3. At each λ: compute `V_active` and `V_passive` via 5-step rollout with memoisation
4. Root action values use the real `compute_reward()` for the first step, then switch to surrogate
5. Add **spatial anchor**: geography-weighted bonus ensuring strong locations maintain priority

```python
spatial_anchor = 5.5·geo² + 24·premium² + 0.35·network
              + 2.4·geo²·log(pop) + 0.04·log(pop)²
              − 0.04·max(0, pop−threshold)^1.2
```

### Caching

- `index_cache`: exact (rounded) state → computed index. Never cleared. Avoids recomputing for arms in similar states across timesteps.
- Per-rollout `cache`: (state_key, depth, subsidy) → value. Local to each `_compute_index()` call.

## Strengths

- Only policy that explicitly models non-stationarity and future state transitions
- Forward-looking — can anticipate institutional decay before it manifests in rewards
- Spatial anchor captures geography-institutional interactions

## Weaknesses

- Computationally expensive — ~10 binary search iterations × 5-step rollouts per arm per step
- Surrogate model is approximate — may diverge from real dynamics in edge cases
- State discretisation loses fine-grained institutional distinctions
- No learning from observed rewards — `update()` is a no-op

## Expected Performance

- **Resource curse**: Strong — explicitly models extraction drift and reform probability
- **Shock reform**: Strong — legacy and transition factors are modelled in surrogate
- **UCB bait**: Strong — forward rollout predicts boomtown collapse
- **Baseline**: Good but overkill — simpler policies suffice when non-stationarity is low
