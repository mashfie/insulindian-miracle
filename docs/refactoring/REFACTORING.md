# Plan: Insulindian Miracle - High-Performance Monte Carlo Refactor

This plan outlines the transition from a Python-centric simulation to a high-performance architecture utilizing a **Rust Engine**, **DuckDB/Parquet Storage**, and **R-Programming Analysis**. 

## Objective
To enable 1,000,000+ simulated runs with high granularity, leveraging the 20-thread capacity of the i9-13900H processor, and identifying "Clusters of Worlds" via statistical analysis.

---

## Phase 0: Documentation of the Refactor Strategy
**Objective:** Record the refactor roadmap within the project documentation for long-term reference.

- [x] **Create Refactoring Directory:** Create the `docs/refactoring/` directory.
- [x] **Persist Plan:** Save the full content of this plan as `docs/refactoring/REFACTORING.md`.

## Phase 1: Python Refactoring & Modularization
**Objective:** Decouple logic and prepare for a clean port.

- [x] **Physical/Agent Separation:** Ensure `model.py` (physics/economics) is completely independent of `policies.py` (decision-making).
- [x] **Deterministic Audit:** Verify that all random operations use the `np.random.Generator` (PCG64) and that the simulation is 100% reproducible for any given seed.
- [x] **Ground Truth Test-Suite:** Generate a "Gold Standard" dataset of 100 simulation runs with full state-traces. This will be used to verify that the Rust engine produces identical math results.
- [x] **Finalize Python Performance:** Resolve remaining $O(N^2)$ bottlenecks in spatial interactions to provide a "best-case" Python baseline.

## Phase 2: Comprehensive Parameterization
**Objective:** Remove all hardcoded "magic numbers" from the codebase.

- [x] **Externalize Configuration:** Move all 80+ parameters in `SimulationConfig` to `configs/default.json`.
- [x] **JSON Scenario Manifests:** Replace the `SCENARIOS` dictionary in `scenarios.py` with external JSON/YAML files.
- [ ] **Sweep Generator Tool:** Create a Python utility (`generate_sweep.py`) that produces a batch of 1,000,000 unique simulation configurations based on user-defined parameter ranges (e.g., varying `agglomeration_alpha` from 0.4 to 0.7).

## Phase 3: Data Backbone (DuckDB + Parquet)
**Objective:** Handle massive datasets on 16GB RAM.

- [ ] **Parquet Integration:** Implement `pyarrow` to save simulation results. Parquet is highly compressed and optimized for the columnar analysis performed in Phase 5.
- [ ] **DuckDB Buffer:** Implement a streaming architecture where the engine writes small batches of results to a local DuckDB instance. This prevents memory overflow and allows for "interrupted" sweeps to resume.
- [ ] **Granularity Selection:** Define a "Level of Detail" (LoD) flag. 
    - `LOD_LOW`: Only final metrics.
    - `LOD_HIGH`: Full history of every site at every step (only for exemplar runs).

## Phase 4: The "Miracle Engine" (Rust Port)
**Objective:** Port the simulation core to a compiled language for maximum performance.

- [ ] **Type Porting:** Map Python `dataclasses` to Rust `structs` using `Serde` for seamless JSON configuration loading.
- [ ] **Numerical Core:** Port `evolve_sites` and `network_bonus` logic to Rust using the `ndarray` crate.
- [ ] **Policy Library:** Implement all bandit policies (UCB1, Thompson, Whittle Index) in Rust.
- [ ] **Concurrency (Rayon):** Implement a parallel iterator to run simulations across all 20 CPU threads simultaneously.
- [ ] **Verification:** Run the "Ground Truth Test-Suite" and compare Rust output vs Python output to ensure mathematical parity.

## Phase 5: R-Statistical Laboratory
**Objective:** Perform high-end statistical analysis and world clustering.

- [ ] **R-Arrow Pipeline:** Set up an R script using the `arrow` package to load millions of rows from the Rust-generated Parquet files.
- [ ] **Clustering Analysis:**
    - Use **K-Means** or **DBSCAN** to group the 1,000,000 worlds into distinct outcome clusters (e.g., "The Stable Republic," "The Extraction Trap").
    - Perform **Principal Component Analysis (PCA)** to identify which 3–5 parameters (out of 80+) are the primary drivers of success.
- [ ] **Phase-Transition Mapping:** Identify "Critical Thresholds" where a 1% change in a parameter (like `resource_curse_strength`) leads to a 100% change in outcome.
- [ ] **Visualizing the "Miracle":** Generate high-fidelity `ggplot2` visualizations showing the probability density of different civilization paths.

---

## Technical Considerations
- **Memory Management:** 16GB RAM is the primary constraint. All phases must prioritize "streaming" data rather than "loading" it.
- **Hardware Saturation:** Use 18 of the 20 available threads for simulation, leaving 2 for OS/Data-Writing to prevent system hang.
- **Interoperability:** Use **Apache Arrow** as the shared memory format between Rust, Python, and R to eliminate serialization overhead.
