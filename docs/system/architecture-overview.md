---
tags: [system, architecture]
type: system
related:
  - "[[simulation-loop]]"
  - "[[frontend]]"
  - "[[cli]]"
  - "[[configuration]]"
---

# Architecture Overview

A monorepo with two independent subsystems — a Python simulation engine and a Next.js visualisation dashboard — connected by shared conceptual models but no runtime API.

## Repository Layout

```
insulindian-miracle/
├── src/insulindian_miracle/    Python simulation engine
│   ├── __main__.py             Package entry point
│   ├── cli.py                  CLI argument parsing
│   ├── sim.py                  Simulation orchestration
│   ├── model.py                Data models + reward function
│   ├── policies.py             10 MAB algorithms
│   ├── terrain.py              Terrain generation + site selection
│   ├── scenarios.py            9 scenario definitions
│   ├── analysis.py             Hypothesis testing (H1-H7)
│   └── research.py             Paper index + synthesis
├── web/                        Next.js frontend
│   ├── app/                    Pages + layout
│   ├── components/             7 React components
│   └── lib/                    Terrain generation (TS) + data
├── configs/default.json        Default simulation parameters
├── tests/                      pytest test suite
├── research/                   Academic paper manifest + theory
└── results/                    Simulation output directory
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Simulation | Python 3.14+, NumPy 2.0+ |
| CLI | argparse, JSON I/O |
| Frontend | Next.js 16, React 19, TypeScript 6 |
| Styling | Tailwind CSS 4, JetBrains Mono |
| Rendering | Canvas 2D (custom) |
| Testing | pytest |
| Build | setuptools (Python), npm (frontend) |

## Data Flow

```
                 CLI
                  │
                  ▼
    ┌─────────────────────────┐
    │        sim.py           │
    │   run_simulation()      │
    │   run_experiment()      │
    │   run_sweep()           │
    └─────┬──────┬──────┬─────┘
          │      │      │
    ┌─────▼──┐ ┌─▼────┐ ┌▼─────────┐
    │terrain │ │model  │ │policies  │
    │generate│ │evolve │ │select_arm│
    │sites   │ │reward │ │update    │
    └────────┘ └───────┘ └──────────┘
                  │
                  ▼
           SimulationResult
                  │
              ┌───┴───┐
              │  JSON  │
              │ stdout │
              │ / file │
              └────────┘
```

The frontend generates terrain independently (TypeScript reimplementation of `terrain.py`) and does not call the Python backend. The two subsystems share the same Perlin noise algorithm and suitability formula, producing equivalent terrain for the same seed.

## Entry Points

### Python CLI

```bash
insulindian-miracle sim run --policy gaussian-thompson --scenario baseline
insulindian-miracle sim benchmark --seed 7
insulindian-miracle sim experiment --scenario resource-curse --runs 12
insulindian-miracle sim hypotheses --runs 12 --output results/hypotheses.json
insulindian-miracle sim scenarios
insulindian-miracle research fetch --manifest research/index.json --cache .cache
insulindian-miracle research synthesize
```

### Web UI

```bash
cd web && npm run dev    # localhost:3000
```

The dashboard is a static export (`output: "export"` in `next.config.ts`).

## Key Design Decisions

1. **No API bridge** — the frontend visualises terrain and configuration but does not run simulations. This keeps the frontend statically deployable.

2. **Protocol-based policies** — `Policy` is a `typing.Protocol`, not an abstract base class. Any object with `select_arm()` and `update()` works.

3. **Config-driven scenarios** — scenarios are parameter override dicts applied to a base `SimulationConfig`. No code branching per scenario.

4. **Deterministic terrain** — given the same seed and config, both Python and TypeScript produce identical terrain. This enables reproducible experiments.

5. **JSON I/O** — all simulation results are serialised as JSON. No database, no binary formats.
