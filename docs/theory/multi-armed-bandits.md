---
tags: [theory, algorithms, bandits]
type: theory
related:
  - "[[explore-exploit-tradeoff]]"
  - "[[restless-bandits]]"
  - "[[policies]]"
  - "[[epsilon-greedy]]"
  - "[[ucb1]]"
  - "[[thompson-sampling]]"
---

# Multi-Armed Bandits

The multi-armed bandit (MAB) problem formalises sequential decision-making under uncertainty. A learner faces K arms (actions), each yielding stochastic rewards from an unknown distribution. At each time step, the learner selects one arm, observes a reward, and updates its beliefs.

## Formal Definition

Given K arms with reward distributions {ν₁, ..., νₖ} and means {μ₁, ..., μₖ}:

- At each step t = 1, ..., T, the learner selects arm A(t) ∈ {1, ..., K}
- The learner observes reward r(t) ~ ν_{A(t)}
- The goal is to maximise cumulative reward: Σ r(t)

The optimal strategy in hindsight always pulls the best arm μ* = max(μₖ). **Regret** measures the gap:

```
R(T) = T · μ* − Σ r(t)
```

The Lai-Robbins lower bound (1985) proves that regret must grow at least logarithmically: R(T) ≥ Ω(K log T).

## Algorithm Families

The simulation implements 10 policies across five families:

### Baseline
- [[epsilon-greedy]] — explore uniformly with probability ε, exploit best estimate otherwise. Simple but wastes exploration budget on clearly suboptimal arms.

### Optimistic (Upper Confidence Bound)
- [[ucb1]] — adds an exploration bonus √(2 log t / nₖ) to the estimated mean. Arms with fewer pulls get a larger bonus. Achieves O(K log T) regret.
- [[discounted-ucb]] — exponentially discounts past observations (γ < 1), adapting to non-stationary rewards.
- [[sliding-window-ucb]] — retains only the last W observations per arm, directly forgetting stale data.

### Bayesian (Thompson Sampling)
- [[thompson-sampling]] — maintains a posterior distribution over each arm's mean; samples from it and plays the arm with the highest sample. Achieves near-optimal Bayesian regret.
- [[discounted-thompson]] — applies posterior decay to handle non-stationarity.

### Contextual
- [[linucb]] — observes an 11-dimensional feature vector per arm and fits a linear regression. Adds a confidence bonus proportional to the feature-space uncertainty.
- [[linear-thompson]] — posterior sampling over the linear model's weight vector.

### Restless
- [[whittle-index]] — models each arm as a Markov chain that evolves whether or not it is pulled. Computes a subsidy-based index via dynamic programming. See [[restless-bandits]].

### Oracle
- [[myopic-oracle]] — selects the arm with the highest *immediate* reward by simulating one step ahead with full state knowledge. Provides an upper bound for regret computation.

## Mapping to the Simulation

| MAB Concept | Simulation Analogue |
|-------------|---------------------|
| Arm | Candidate settlement site |
| Pull | Allocate one population unit |
| Reward | `compute_reward()` — geography + institutions + network − costs |
| K (arm count) | `num_sites` (default 15) |
| T (horizon) | `horizon` (default 300) |
| Non-stationarity | Institutions evolve every step; resource depletion; shocks |
| Context vector | 11-dim feature: geography, extraction, openness, adaptability, capital, population, network, boomtown, trade_cluster |

> [!warning] Non-stationarity is the key challenge
> Classic MAB theory assumes stationary rewards. In this simulation, arm rewards change even for unpulled arms (institutions drift, network effects shift, shocks fire). This violates stationarity and motivates [[restless-bandits]] and discounted/windowed variants.
