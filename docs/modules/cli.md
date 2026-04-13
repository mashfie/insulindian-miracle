---
tags: [module, cli]
type: module
related:
  - "[[architecture-overview]]"
  - "[[simulation-loop]]"
---

# CLI

`rust/src/main.rs` exposes:

- `run`
- `sweep`
- `scenarios`
- `benchmark`
- `compare`
- `experiment`

The CLI is thin by design: it loads config, applies an optional scenario, and dispatches into `runner.rs` or `experiments.rs`.
