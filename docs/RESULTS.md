---
tags: [results, provenance]
type: reference
---

# Results

This branch contains only a partial results archive.

## What is safe to say

- The Rust engine computes the metrics documented in `rust/src/runner.rs` and `rust/src/math_utils.rs`.
- The canonical experiment contract is `configs/experiments/hypothesis_suite.json`.
- `python/` and `R/` contain downstream analysis code for Parquet and JSON outputs.

## What is not safe to say without rerunning

- scenario ranking tables,
- policy leaderboards,
- quantitative claims about regret gaps,
- any "1M run synthesis" statement whose artifact is not present with a manifest.

## Practical rule

When a note cites a number, attach one of:

- a concrete JSON result file,
- a Parquet artifact plus its input manifest,
- a rerun command.

Otherwise describe the number as provisional or remove it.
