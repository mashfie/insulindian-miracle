---
tags: [policy, oracle, benchmark]
type: policy
related:
  - "[[multi-armed-bandits]]"
  - "[[policies]]"
  - "[[simulation-loop]]"
---

# Myopic Oracle

A benchmark policy that selects the arm with the highest *immediate* reward by simulating one step ahead with full state knowledge.

## Formulation

$$
A(t) = \arg\max_k \; r\!\left(k,\; s_k^{+}\right)
$$

where $s_k^{+}$ denotes the state of arm $k$ after incrementing its population by 1, and $r(k, s)$ is the true reward function `compute_reward()`. For each candidate arm, the population is temporarily incremented, the full reward is computed, then the state is reverted. The arm yielding the highest immediate reward is selected.

## Implementation

`MyopicOraclePolicy` in `policies.py:729–752`.

- **No learning**: `update()` is a no-op
- **Full state access**: uses `compute_reward()` with the real `states` list
- **No exploration**: purely greedy on immediate reward

## Purpose

Provides the regret benchmark for all experiments. Oracle regret for policy $\pi$ at step $t$:

$$
\text{regret}_\pi(t) = r_{\text{oracle}}(t) - r_\pi(t)
$$

Cumulative regret:

$$
R_\pi(T) = \sum_{t=1}^{T} \left[ r_{\text{oracle}}(t) - r_\pi(t) \right]
$$

> **Not globally optimal.** The myopic oracle maximises immediate reward, not cumulative reward. A policy that sacrifices short-term reward for better institutions (e.g., avoiding resource-rich extractive sites) can outperform the oracle over the full horizon. This is the core insight of the simulation — and empirically, the top policies beat the oracle in every scenario.

## Empirical Performance

The myopic oracle serves as the regret baseline ($R = 0$ by definition). It does not appear in policy rankings. Negative regret for other policies indicates they outperformed this oracle — which occurs frequently, as the oracle's greedy strategy falls into extraction traps and boomtown lures that adaptive policies learn to avoid.

## Expected Performance

- **Baseline**: Best or near-best (low non-stationarity makes greedy effective)
- **Resource curse**: Vulnerable — myopic greed falls into the extraction trap
- **UCB bait**: Vulnerable — selects the boomtown during its bonus period

## References

- Auer, P., Cesa-Bianchi, N. & Fischer, P. (2002). Finite-time analysis of the multiarmed bandit problem. *Machine Learning*, 47(2–3), 235–256.
- Bubeck, S. & Cesa-Bianchi, N. (2012). Regret analysis of stochastic and nonstochastic multi-armed bandit problems. *Foundations and Trends in Machine Learning*, 5(1), 1–122.

[[multi-armed-bandits]] · [[simulation-loop]]
