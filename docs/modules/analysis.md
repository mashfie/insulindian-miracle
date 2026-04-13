---
tags: [module, analysis]
type: module
related:
  - "[[research-design]]"
  - "[[RESULTS]]"
---

# Analysis Layer

There is no standalone `analysis.rs` in the current Rust tree.

The analysis stack is split across:

- `rust/src/experiments.rs`: suite execution and metric aggregation,
- `rust/src/math_utils.rs`: Gini, HHI, Zipf slope, correlation,
- `python/` and `R/`: downstream exploratory analysis and figure generation.

The correct mental model is: the Rust engine produces metrics and artifacts; deeper inference currently lives outside the runtime core.
