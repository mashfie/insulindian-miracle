---
tags: [theory, algorithms, bandits, restless]
type: theory
related:
  - "[[multi-armed-bandits]]"
  - "[[whittle-index]]"
  - "[[explore-exploit-tradeoff]]"
---

# Restless Bandits

A generalisation of the [[multi-armed-bandits]] problem where **all arms evolve at every time step**, regardless of whether they are pulled. This matches the simulation's dynamics: institutions drift, capital accumulates or erodes, and shocks can hit any site at any time.

## The Restless Bandit Problem

In the standard (rested) bandit, an arm's state only changes when it is pulled. In the restless formulation (Whittle, 1988):

- Each arm k has a state sₖ(t) that transitions according to a Markov chain
- The transition kernel depends on whether the arm is **active** (pulled) or **passive** (not pulled)
- Only M of K arms can be activated per step (in this simulation, M = 1)
- Reward depends on the arm's current state and whether it is active

The restless problem is PSPACE-hard in general. No polynomial-time algorithm achieves optimal regret.

## Whittle Relaxation

Whittle's insight was to relax the constraint "exactly M arms active" into a Lagrangian penalty. Each arm is assigned an **index** — the subsidy λ at which the planner is indifferent between activating and passivating the arm:

```
W(s) = inf { λ : V_passive(s, λ) ≥ V_active(s, λ) }
```

where V_active and V_passive are the values of activating vs passivating starting from state s, with subsidy λ paid for each passive step.

The policy: activate the M arms with the highest Whittle index. This is optimal when arms are **indexable** (the passive set is monotone in λ) and provides a good heuristic otherwise.

## Implementation in the Simulation

The [[whittle-index]] policy (`policies.py:309–727`) implements this via:

1. **State discretisation** — continuous site state is binned into a discrete tuple:
   - Population: 7 bins (1, 3, 6, 10, 16, 24, 30+)
   - Extraction, openness, adaptability, resource: 5 bins each (0.15, 0.35, 0.55, 0.75 boundaries)
   - Capital: 5 bins; legacy: 5 bins; geography: 6 bins; network: 6 bins
   - Boomtown and trade_cluster: binary flags

2. **Surrogate reward** — a simplified version of `compute_reward()` that uses the discretised state, avoiding the full site-interaction computation

3. **Surrogate transition** — deterministic state evolution: reform if `reform_signal > 0.58`, else extraction drifts upward; capital and openness evolve based on investment and erosion

4. **Binary search on subsidy** — for each arm, search λ ∈ [-6, +6] over 10 iterations to find the indifference point

5. **Rollout horizon** — 5-step lookahead with memoised value function

6. **Spatial anchor** — adds a geography-weighted bonus to the raw index, ensuring strong geographic sites maintain priority even when institutional states are similar

> [!tip] Why the index is cached
> The `index_cache` maps exact (rounded) state tuples to computed indices. Since many arms may have similar discretised states across timesteps, this avoids redundant rollouts. The cache is never cleared — it grows over the simulation but remains small due to state binning.

## When Restless Bandits Matter

The restless formulation is most important when:

- **Institutional drift** is strong (high `resource_curse_strength`)
- **Shocks** are frequent (high `shock_probability`)
- **Active effects** degrade arms (high `active_extraction_pressure`, `active_resource_depletion`)

In the [[baseline]] scenario with low non-stationarity, simpler algorithms like [[thompson-sampling]] and [[ucb1]] perform comparably. But in [[resource-curse-scenario]], [[shock-reform]], and [[ucb-bait]], the Whittle index's explicit modelling of state transitions gives it an edge.
