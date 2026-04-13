---
tags: [module, model]
type: module
related:
  - "[[reward-function]]"
  - "[[institutional-dynamics]]"
---

# Model

The model layer is split across:

- `rust/src/types.rs`: schemas, defaults, snapshots,
- `rust/src/core.rs`: reward and transition physics,
- `rust/src/snapshot_physics.rs`: reward and network helpers on immutable snapshots.

Key structs:

- `SimulationConfig`
- `Site`
- `InstitutionState`
- `SiteState`
- `SiteStateSnapshot`
- `RunResult`
