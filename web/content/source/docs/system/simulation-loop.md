---
tags: [system, simulation, loop]
type: system
related:
  - "[[sim]]"
  - "[[model]]"
  - "[[policies]]"
  - "[[reward-function]]"
  - "[[institutional-dynamics]]"
---

# Simulation Loop

The core execution path: `run_simulation()` in `src/insulindian_miracle/sim.py:318–371`.

## Initialisation

1. **Apply scenario** — merge scenario overrides into the base `SimulationConfig` via `apply_scenario()`
2. **Generate terrain** — `generate_terrain(config.terrain)` produces a `TerrainField` with elevation, hydrology, and derived layers
3. **Select sites** — `select_candidate_sites(terrain, count, min_spacing)` picks the top N cells by suitability, enforcing minimum distance
4. **Shape sites** — `_apply_trade_cluster_shape()` and `_apply_boomtown_shape()` modify selected sites based on scenario parameters (trade cluster bonuses, boomtown resource spikes)
5. **Initialise states** — `initialize_site_states()` draws institutional parameters from Beta distributions and computes initial `shock_readiness`
6. **Snapshot initials** — capture initial extraction/openness/adaptability/resource for later comparison
7. **Build policy** — `build_policy(name, arm_count, seed, config)` constructs the selected MAB algorithm

## Main Loop

```python
for step in range(horizon):
    chosen = policy.select_arm(states)        # 1. Policy selects site
    states[chosen].population += 1            # 2. Population allocated
    report = evolve_sites(states, config,     # 3. All sites evolve
                          rng, active_site=chosen, step=step)
    reward = report.rewards[chosen]           # 4. Reward observed
    policy.update(chosen, reward, states)     # 5. Policy learns
    selected_sites.append(chosen)
    reward_history.append(reward)
    cumulative_reward += reward
```

### Step 1: Policy Selection

The policy sees the full `states` list and returns an arm index. Different policies use different information:

- **Stateless** (ε-greedy, UCB1): ignore `states`, use only internal count/value estimates
- **Contextual** (LinUCB, Linear Thompson): build an 11-dim feature vector from each state
- **Restless** (Whittle): compute per-arm indices using surrogate reward and transition models

### Step 2: Population Allocation

A single population unit is added to the chosen site. This is the only direct effect of the policy's decision.

### Step 3: Site Evolution — `evolve_sites()`

This is the most complex function (`model.py:394–632`). See [[institutional-dynamics]] for the full breakdown. Key phases:

1. **Compute rewards** for all sites
2. **Reform or drift** — for each site, either trigger institutional reform (lower extraction, raise openness) or apply resource curse drift (raise extraction)
3. **Capital dynamics** — investment by inclusive institutions, erosion by extractive ones
4. **Active-site effects** — the chosen site experiences additional extraction pressure and resource depletion
5. **Post-shock/legacy effects** — sites with shock history receive ongoing institutional support
6. **Population momentum** — structural signals drive migration between sites
7. **Migration** — if momentum crosses thresholds, one person migrates from the worst-momentum site to the best
8. **Stochastic shocks** — with probability `shock_probability`, a random site loses resources and capital

### Step 4–5: Reward and Update

The policy observes the reward at the chosen site and updates its internal state. The reward is the output of `compute_reward()` — see [[reward-function]].

## Post-Loop

After the horizon completes:

1. **Build site outcomes** — compile `SiteOutcome` records with initial/final state comparisons, selection counts, shock history
2. **Compute metrics** — 25+ aggregate metrics: correlations, Zipf slope, Gini, HHI, boomtown shares, etc.
3. **Return `SimulationResult`** — policy name, seed, cumulative reward, site-level outcomes, terrain summary

## Higher-Level Runners

| Function | Purpose |
|----------|---------|
| `run_simulation()` | Single run, single policy |
| `run_sweep()` | Multiple policies × multiple runs (seeded) |
| `run_experiment()` | Full grid with oracle baseline and aggregate statistics |
| `run_benchmark()` | Quick comparison across all default policies |
| `run_hypothesis_suite()` | Multi-scenario hypothesis testing (in [[analysis]]) |
