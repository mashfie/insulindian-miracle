---
tags: [module, simulation]
type: module
related:
  - "[[simulation-loop]]"
  - "[[RESULTS]]"
---

# Simulation

The orchestration layer lives in:

- `rust/src/runner.rs`: single runs, comparisons, sweeps, metrics,
- `rust/src/experiments.rs`: hypothesis-suite execution and manifests.

This layer is where policy construction, scenario labels, artifact writing, and aggregate metrics meet.
