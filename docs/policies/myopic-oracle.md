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

```
A(t) = argmax [ compute_reward(k, states_after_adding_pop_to_k) ]
```

For each arm, temporarily increment its population by 1, compute the full reward, then revert. Select the arm yielding the highest reward.

## Implementation

`MyopicOraclePolicy` in `policies.py:729–752`.

- **No learning**: `update()` is a no-op
- **Full state access**: uses `compute_reward()` with the real `states` list
- **No exploration**: purely greedy on immediate reward

## Purpose

Provides an upper bound on single-step-optimal play. Used to compute **oracle regret** in experiments:

```
regret(t) = oracle_reward(t) − policy_reward(t)
```

> [!note] Not globally optimal
> The myopic oracle maximises immediate reward, not cumulative reward. A policy that sacrifices short-term reward for better institutions (e.g., avoiding resource-rich extractive sites) could outperform the oracle over the full horizon. This is the core insight of the simulation.

## Expected Performance

- **Baseline**: Best or near-best (low non-stationarity makes greedy effective)
- **Resource curse**: Can be outperformed — myopic greed falls into the extraction trap
- **UCB bait**: Can be outperformed — selects the boomtown during its bonus period
