# Insulindian Miracle

**High-Performance Pure-Rust Monte Carlo Laboratory for Evolutionary Urban Economics**

Computational political-economy sandbox for city formation on procedurally generated peninsulas. The core question is whether a learning policy can distinguish short-run resource rents from long-run institutional viability before a boomtown turns into a trap.

## Project Status: Pure Rust Migration Complete

The project has been fully refactored from a hybrid Python/Rust prototype into a **Pure Rust** high-performance simulation engine.

- **Engine:** Pure Rust implementation of terrain generation, institutional dynamics, and bandit policies.
- **Performance:** Sub-millisecond simulation steps, optimized for 1,000,000+ run Monte Carlo sweeps.
- **Data:** Direct streaming to **Apache Parquet** for analysis in R or Python (Phase 5).
- **Frontend:** Modern Next.js 16 dashboard for visual interaction with the simulation.

## Core Architecture

### 1. The Miracle Engine (Rust)
The entire simulation logic resides in `rust/src/`. It implements:
- **Terrain Generation:** Fractal Perlin noise peninsula generation.
- **Site Selection:** Suitability-based candidate settlement selection.
- **Evolution Physics:** Multi-agent site evolution with endogenous institutional drift, shocks, and reforms.
- **Bandit Policies:** Full suite of RMAB policies (UCB1, Thompson Sampling, LinUCB, etc.).

### 2. Standalone CLI
The Rust engine provides a high-performance CLI for running simulations and sweeps without any Python dependency.

### 3. Data Backbone
Simulation outputs are written directly to **Parquet** files using the Rust `parquet` and `arrow` crates, ensuring high-speed data ingestion for statistical analysis.

### 4. Next.js Frontend
A modern dashboard built with **Next.js 16** and **React 19** located in `web/`.

## Repository Layout

```text
rust/src/          Pure Rust simulation engine & CLI
configs/           JSON-based scenario and parameter definitions
web/               Next.js 16 / React 19 visual dashboard
docs/              Theoretical foundation and module documentation
research/          Paper manifest and theoretical synthesis
results/           Parquet storage for sweep artifacts
```

## Installation & Usage

Requires a Rust toolchain (stable).

### Build the CLI
```bash
cargo build --release
```

### Run a Single Simulation
```bash
./target/release/insulindian-miracle run --policy ucb1 --output result.json
```

### Run a High-Performance Sweep
```bash
./target/release/insulindian-miracle sweep --input configs/sweep_configs.jsonl --policies ucb1 ts linucb --output results/sweep_1m.parquet
```

### Start the Visual Dashboard
```bash
cd web
pnpm install
pnpm dev
```

## Core Theoretical Scope

The simulation treats settlement allocation as a **Restless Multi-Armed Bandit (RMAB)** problem. Each site combines:
- Geography and accessibility
- Resource rents
- Institutional state: Extraction, Openness, Adaptability
- Endogenous dynamics: Reform, Drift, Shocks, Congestion, and Network Spillovers

## Documentation

- `docs/theory/hypotheses.md`: Research questions and formal conjectures.
- `docs/system/architecture-overview.md`: Subsystem split and data flow.
- `research/theory/peninsula-framework.md`: Conceptual framing of the Insulindian Miracle.
