---
tags: [system, architecture]
type: system
related:
  - "[[simulation-loop]]"
  - "[[code-flow]]"
  - "[[cli]]"
---

# Architecture Overview

The runtime center of gravity is the Rust engine. Everything else is either configuration, analysis, documentation, or visualization.

## Runtime layers

1. **CLI**: `rust/src/main.rs`
2. **Simulation orchestration**: `rust/src/runner.rs`, `rust/src/experiments.rs`
3. **State dynamics**: `rust/src/core.rs`, `rust/src/snapshot_physics.rs`
4. **Policies**: `rust/src/policies.rs`, `rust/src/whittle.rs`
5. **Terrain and site generation**: `rust/src/terrain.rs`
6. **Schemas and defaults**: `rust/src/types.rs`, `configs/`
7. **Artifact emission**: JSON for single/comparison runs, Parquet for sweeps

## Repository layout

```text
rust/src/                   engine, policies, terrain, CLI
configs/scenarios/          scenario override files
configs/experiments/        experiment-suite contracts
docs/                       obsidian-style wiki
research/                   bibliography manifest and theory notes
python/                     downstream analysis shell
R/                          downstream analysis shell
web/                        static/interactive frontend
results/                    generated artifacts
```

## Dataflow

`main.rs` -> config load -> optional scenario merge -> `run_simulation_with_options()` or `run_sweep_rust_core()` -> metrics and artifacts.

See [[code-flow]] for the SVG.

## What changed relative to older docs

Older wiki notes described a Python-first engine. That is stale. The active execution path is Rust-first, with Python and R used only after artifact generation.
