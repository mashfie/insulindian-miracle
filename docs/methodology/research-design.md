---
tags: [methodology, experiments]
type: methodology
related:
  - "[[hypotheses]]"
  - "[[scenarios]]"
  - "[[RESULTS]]"
---

# Research Design

## Experimental unit

One run is a tuple

$$
(\text{seed}, \text{scenario}, \text{policy}, \text{config}).
$$

The Rust CLI exposes three main research modes:

- `run`: one policy, one config.
- `compare` / `benchmark`: canonical policies plus the myopic oracle.
- `experiment`: a hypothesis suite defined in `configs/experiments/hypothesis_suite.json`.

## Canonical suite

The current suite encodes:

- six named hypotheses: H1, H2, H3, H5, H6, H7,
- scenario-to-hypothesis routing,
- a seed set,
- a policy set,
- a requested output detail level.

The suite is the closest thing the repo has to a formal experimental design contract.

## Outputs

`run_simulation_with_options()` emits a `RunResult` with:

- cumulative reward,
- oracle and empirical baselines when comparison helpers are used,
- terminal institutional and resource metrics,
- concentration and correlation metrics,
- optional trajectory detail in `HIGH` LOD mode.

`run_sweep_rust_core()` writes Parquet via Arrow/Parquet crates for large sweeps.

## Analysis shells

Downstream analysis is split across:

- `python/`: loading, regret analysis, PCA/clustering, phase maps, figures.
- `R/`: parity scripts for the same tasks.

These folders are not runtime dependencies of the engine; they are post-processing layers.

## Provenance rule

Empirical prose in the wiki should distinguish:

- **code-grounded**: directly inferable from Rust sources and configs,
- **artifact-grounded**: backed by a saved result file or manifest,
- **hypothesized**: expected signature not yet revalidated on the current branch.

At the moment the first category is strong, the second is partial, and the third should be labeled explicitly.
