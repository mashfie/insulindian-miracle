# Insulindian Miracle - Agent Instructions

## Project Stack & Architecture
- **Simulation Engine:** Pure Rust (`rust/src/`). The engine is responsible for all heavy computation, terrain generation, policy execution, and running parameter sweeps.
- **Data Analysis & Visualization:** R (`R/`). All downstream statistical analysis, regression, clustering (PCA), phase maps, and plotting are done in R.
- **Frontend / Dashboard:** Next.js / React (`web/`).
- **Data Format:** Outputs from the Rust engine are saved as Parquet or JSON files, which are then consumed by R or the frontend.

## CRITICAL: Python Has Been Removed
This project has fully migrated away from Python to a pure Rust+R stack. **Do not write, suggest, or try to run Python code.**
- The `pyo3` bindings and macros have been removed from the Rust codebase.
- All downstream analysis is exclusively done in R.
- The engine is a standalone Rust binary, not a Python extension module.

## Workflow
1. **Rust Engine:** Modify the Rust codebase in `rust/src/`. Build with `cargo build --release` and verify with `cargo check` and `cargo test`. Use the CLI for running sweeps (e.g. `cargo run --release -- sweep ...`).
2. **Analysis:** Modify R scripts in `R/` (e.g., `01_load_data.R`, `02_regret_analysis.R`) for visualization and statistical modeling. Run them using `Rscript R/<script_name>.R`.
3. **Web:** Modify Next.js code in `web/`. Use `pnpm` for package management.

## Rust Details
- The entry point for the CLI is `rust/src/main.rs`.
- `rust/src/runner.rs` contains the core execution logic for single simulations and parallel sweeps.
- Use `cargo clippy` and `cargo fmt` to maintain code quality.

## R Details
- R is the sole language for data synthesis and chart generation.
- Ensure any new analysis scripts are added to the `R/` directory and follow the numbered naming convention (e.g., `06_new_analysis.R`).
