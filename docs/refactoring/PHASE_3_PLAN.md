# Phase 3 Implementation Plan: Data Backbone (DuckDB + Parquet)

This plan details the implementation of a high-performance data storage and retrieval system to handle the 1,000,000 simulation sweep on limited hardware (16GB RAM).

## Objective
Establish a streaming data pipeline that persists simulation results directly to disk using DuckDB for buffering and Parquet for long-term columnar storage.

## Tasks

### 1. Parquet Schema Definition
- **Columnar Layout:** Define the schema for `LOD_LOW` (summary metrics) and `LOD_HIGH` (full step history).
- **Metadata:** Include `seed`, `policy_name`, `scenario_name`, and a unique `run_id` in every row.
- **Tools:** Use `pyarrow` for schema definition and Parquet writing.

### 2. DuckDB Streaming Buffer
- **Local Buffer:** Implement a `DuckDBResultBuffer` class to store results in a temporary local database.
- **Batch Commits:** Periodically flush batches of results from DuckDB to Parquet files (e.g., every 10,000 runs) to keep the memory footprint low.
- **Resilience:** Ensure that if the sweep is interrupted, the progress is saved in DuckDB and can be resumed.

### 3. Level of Detail (LoD) Control
- **Flag Implementation:** Add `lod: str = "LOW"` to `SimulationConfig`.
- **Conditional Logging:** Modify `Simulation.run_step` and `SimulationResult` to only capture and store the data required by the active LoD.
    - `LOD_LOW`: Stores only final metrics (total reward, final population, etc.).
    - `LOD_HIGH`: Stores every action and state change at every time step.

### 4. Integration with `run_sweep`
- **Refactor `sim.py`:** Update `run_sweep` to utilize the `DuckDBResultBuffer` instead of holding all results in a list in memory.
- **Parallel Writing:** Ensure that data writing to DuckDB is thread-safe or handled by a dedicated writer thread to avoid blocking the 18 simulation threads.

### 5. Verification
- **Data Integrity:** Verify that results stored in Parquet match the in-memory results for a small sample run.
- **Performance Benchmarking:** Measure the write overhead and ensure it doesn't significantly slow down the simulation throughput.

## Technical Stack
- **DuckDB:** For fast, local, ACID-compliant result buffering.
- **Apache Arrow / Parquet:** For highly compressed, efficient columnar storage.
- **PyArrow:** Python bindings for Apache Arrow.
