---
tags: [module, policies]
type: module
related:
  - "[[multi-armed-bandits]]"
  - "[[restless-bandits]]"
---

# Policies

Policy implementations live in:

- `rust/src/policies.rs`
- `rust/src/whittle.rs`

Taxonomy:

- stationary baselines,
- forgetting heuristics for drift,
- shared-parameter contextual linear policies,
- a discretized Whittle-style surrogate,
- a one-step myopic oracle.

All policies implement the `Policy` trait with `select_site()` and `update()`.
