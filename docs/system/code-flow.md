---
tags: [system, flowchart]
type: system
related:
  - "[[architecture-overview]]"
  - "[[simulation-loop]]"
---

# Code Flow

![[rust-code-flowchart.svg]]

## Reading guide

- the left spine is the actual Rust execution path,
- the right panel summarizes the formulas used by the main policy families,
- the split at the bottom distinguishes single-run JSON outputs from sweep-time Parquet outputs.

The asset lives at `docs/assets/rust-code-flowchart.svg`.
