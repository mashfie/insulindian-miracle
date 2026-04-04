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

In the standard (rested) bandit, an arm's state only changes when it is pulled. In the restless formulation ([Whittle, 1988](https://doi.org/10.2307/3214163)):

- Each arm $k$ has a state $s_k(t)$ that transitions according to a Markov chain
- The transition kernel depends on whether the arm is **active** (pulled) or **passive** (not pulled):

$$
s_k(t+1) \sim
\begin{cases}
P^{(1)}(\cdot \mid s_k(t)) & \text{if arm } k \text{ is active} \\
P^{(0)}(\cdot \mid s_k(t)) & \text{if arm } k \text{ is passive}
\end{cases}
$$

- Only $M$ of $K$ arms can be activated per step (in this simulation, $M = 1$)
- Reward depends on the arm's current state and whether it is active: $r_k(t) = R(s_k(t), a_k(t))$

The objective is to find the activation policy $\pi$ that maximises the expected discounted reward:

$$
\max_\pi \; \mathbb{E}\!\left[\sum_{t=0}^{\infty} \beta^t \sum_{k=1}^{K} R(s_k(t), a_k(t))\right]
$$

subject to $\sum_k a_k(t) = M$ for all $t$, where $\beta \in (0,1)$ is the discount factor.

The restless problem is PSPACE-hard in general. No polynomial-time algorithm achieves optimal regret.

## Whittle Relaxation

Whittle's insight was to relax the hard constraint "$\sum_k a_k(t) = M$" into a Lagrangian penalty. Each arm is assigned an **index** — the subsidy $\lambda$ at which the planner is indifferent between activating and passivating the arm:

$$
W(s) = \inf \left\{ \lambda : V^{(0)}(s, \lambda) \geq V^{(1)}(s, \lambda) \right\}
$$

where $V^{(1)}(s, \lambda)$ and $V^{(0)}(s, \lambda)$ are the value functions of activating vs passivating starting from state $s$, with subsidy $\lambda$ paid for each passive step:

$$
V^{(a)}(s, \lambda) = R(s, a) + \lambda \cdot (1 - a) + \beta \sum_{s'} P^{(a)}(s' \mid s) \, V^*(s', \lambda)
$$

The policy: activate the $M$ arms with the highest Whittle index. This is optimal when arms are **indexable** (the passive set $\{s : V^{(0)}(s,\lambda) \geq V^{(1)}(s,\lambda)\}$ is monotone in $\lambda$) and provides a good heuristic otherwise.

## Implementation in the Simulation

The [[whittle-index]] policy (`policies.py:309–727`) implements this via:

1. **State discretisation** — continuous site state is binned into a discrete tuple:
   - Population: 7 bins (1, 3, 6, 10, 16, 24, 30+)
   - Extraction, openness, adaptability, resource: 5 bins each (boundaries at 0.15, 0.35, 0.55, 0.75)
   - Capital: 5 bins; legacy: 5 bins; geography: 6 bins; network: 6 bins
   - Boomtown and trade_cluster: binary flags

   The total state space is $7 \times 5^4 \times 5^2 \times 6^2 \times 2^2 \approx 1.9 \times 10^6$ states per arm, though only a small fraction are reachable.

2. **Surrogate reward** — a simplified version of `compute_reward()` that uses the discretised state, avoiding the full site-interaction computation

3. **Surrogate transition** — deterministic state evolution: reform if `reform_signal > 0.58`, else extraction drifts upward; capital and openness evolve based on investment and erosion

4. **Binary search on subsidy** — for each arm, search $\lambda \in [-6, +6]$ over 10 iterations to find the indifference point. Convergence is guaranteed because $V^{(0)}(s,\lambda) - V^{(1)}(s,\lambda)$ is monotonically increasing in $\lambda$ when the arm is indexable.

5. **Rollout horizon** — 5-step lookahead with memoised value function. The Bellman recursion at each state is:

$$
V^*(s, \lambda) = \max\!\big\{V^{(0)}(s, \lambda),\; V^{(1)}(s, \lambda)\big\}
$$

6. **Spatial anchor** — adds a geography-weighted bonus to the raw index, ensuring strong geographic sites maintain priority even when institutional states are similar

> [!tip] Why the index is cached
> The `index_cache` maps exact (rounded) state tuples to computed indices. Since many arms may have similar discretised states across timesteps, this avoids redundant rollouts. The cache is never cleared — it grows over the simulation but remains small due to state binning.

## When Restless Bandits Matter

The restless formulation is most important when:

- **Institutional drift** is strong (high `resource_curse_strength`)
- **Shocks** are frequent (high `shock_probability`)
- **Active effects** degrade arms (high `active_extraction_pressure`, `active_resource_depletion`)

In the [[baseline]] scenario with low non-stationarity, simpler algorithms like [[thompson-sampling]] and [[ucb1]] perform comparably. But in [[resource-curse-scenario]], [[shock-reform]], and [[ucb-bait]], the Whittle index's explicit modelling of state transitions should give it an edge in theory.

In practice, the results are more nuanced. In the resource-curse scenario, Whittle scores only 273 cumulative reward — the worst of all policies — while SW-UCB achieves 2357 (more than double the oracle's 1129). The Whittle index's forward-looking model appears to *overreact* to extraction signals, abandoning resource-rich sites too aggressively. In the UCB-bait scenario, however, Whittle makes 0 boomtown selections out of 280 total — perfectly avoiding the trap that catches UCB1 (12/18 boom selections). This suggests that the Whittle policy is well-calibrated for *binary* traps (boom/bust) but poorly calibrated for the *gradual* extraction drift in the resource-curse regime.
