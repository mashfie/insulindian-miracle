---
tags: [module, python, orchestration]
type: module
related:
  - "[[simulation-loop]]"
  - "[[model]]"
  - "[[policies]]"
  - "[[scenarios]]"
  - "[[terrain]]"
---

# sim.py

`src/insulindian_miracle/sim.py` — 440 lines. Simulation orchestration, experiment runners, and result aggregation.

## Key Exports

| Export | Purpose |
|--------|---------|
| `run_simulation(config, policy_name, scenario_name)` | Single simulation run → `SimulationResult` |
| `run_sweep(config, policies, runs, scenario)` | Multiple policies × multiple seeded runs |
| `run_experiment(config, policies, runs, scenario)` | Full experiment grid with oracle baseline |
| `run_benchmark(seed, scenario)` | Quick one-run-per-policy comparison |
| `write_json(path, payload)` | JSON serialisation utility |
| `DEFAULT_POLICIES` | List of 9 default policy names (excludes oracle) |
| `ORACLE_POLICY` | `"myopic-oracle"` |

## Internal Functions

| Function | Purpose |
|----------|---------|
| `_config_with_overrides()` | Merge override dict into config |
| `_terrain_summary()` | Extract terrain statistics |
| `_apply_boomtown_shape()` | Mark sites as boomtowns and modify their attributes |
| `_apply_trade_cluster_shape()` | Mark sites as trade cluster members |
| `_seeded_config()` | Create config with offset seed for multi-run experiments |
| `_safe_correlation()` | Correlation with zero-variance protection |
| `_gini()` | Gini coefficient of population distribution |
| `_zipf_slope()` | Log-log rank-size regression slope |
| `_selection_hhi()` | Herfindahl index of policy's arm selections |
| `_build_site_outcomes()` | Compile per-site outcome records |
| `_result_metrics()` | Compute 25+ aggregate metrics |
| `_aggregate_results()` | Average metrics across runs, compute oracle regret |

## Dependencies

- `model` — `SimulationConfig`, `evolve_sites`, `initialize_site_states`, `base_geography`
- `policies` — `build_policy`
- `scenarios` — `apply_scenario`, `get_scenario`
- `terrain` — `generate_terrain`, `select_candidate_sites`
