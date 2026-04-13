---
tags: [system, simulation-loop]
type: system
related:
  - "[[reward-function]]"
  - "[[institutional-dynamics]]"
  - "[[code-flow]]"
---

# Simulation Loop

The operative path is `run_simulation_with_options()` in `rust/src/runner.rs`.

## Initialization

1. Generate terrain with `generate_terrain_rust(config)`.
2. Select candidate sites with spacing constraints.
3. Apply scenario geometry modifiers: trade clusters, boomtowns.
4. Draw initial institutional states from Beta distributions.
5. Precompute:
   - geographic scores `g_i`,
   - the pairwise decay matrix `D`,
   - the `SimulationCache`.
6. Build the selected policy.

## Per-step loop

For `t = 0, ..., T-1`:

1. Build `SiteStateSnapshot` values only if the policy requests them.
2. Let the policy choose one site `A_t`.
3. Increment `p_{A_t}` by one.
4. Call `evolve_sites()` on the full site vector.
5. Read the realized reward of the chosen site from the cache.
6. Update the policy with `(A_t, Y_t)`.

In pseudocode:

```text
snapshots_t <- optional snapshots
A_t <- policy.select_site(snapshots_t)
p_A_t <- p_A_t + 1
evolve_sites(S_t, A_t)
Y_t <- reward_cache[A_t]
policy.update(A_t, Y_t, snapshots_t)
```

## Post-loop aggregation

The engine computes:

- cumulative reward,
- terminal institutional means,
- concentration and Zipf metrics,
- resource-to-outcome correlations,
- optional high-detail trajectories and site outcomes.

## Important semantic detail

The policy observes snapshots from the pre-evolution state, but learning uses the post-evolution realized reward. That matters for contextual and Whittle-style interpretations.
