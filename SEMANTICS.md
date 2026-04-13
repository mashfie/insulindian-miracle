# Canonical Semantics Contract

This document freezes the mathematical and functional semantics of the Insulindian Miracle Monte Carlo engine. Any changes to the rules defined here require an explicit model version bump.

- **Model version:** `v2-terrain-rewrite` (Terrain generation distance transforms and slope fields have intentionally diverged from the Python prototype for performance reasons. Site selection, however, remains at `v1-canonical` logic.)
- **Reward function:** Authoritative implementation lives in `rust/src/snapshot_physics.rs` (`compute_reward_snapshot`) and `rust/src/core.rs` (`compute_all_rewards`).
- **Transition law:** Authoritative implementation lives in `rust/src/core.rs` (`evolve_sites`).
- **Oracle definition:** `myopic-oracle` accurately computes the true 1-step reward evaluation snapshot using `compute_reward_snapshot`.
- **Policy definitions:** Authoritative implementations live in `rust/src/policies.rs` and `rust/src/whittle.rs` (which now correctly mirrors the Python exact parity without erroneous cycle detection).
- **Scenario override rules:** Unknown keys in scenario override JSON files are strictly invalid and will `panic!` immediately upon parsing to prevent silent configuration errors.
- **Seed contract:** Given a constant seed and identical configuration, the engine is fully deterministic and perfectly reproducible across runs.
- **Output schemas:** 
  - `LOW`: Aggregate run metrics only.
  - `MEDIUM`/`HIGH`: Aggregate + `selected_sites` trajectory + `reward_history`.
  - `HIGH`: Medium + `site_outcomes` containing detailed terminal stats for every site in the simulation.
