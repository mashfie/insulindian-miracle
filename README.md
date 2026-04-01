# Insulindian Miracle

Computational political-economy sandbox for city formation on procedurally generated peninsulas. The core question is whether a learning policy can distinguish short-run resource rents from long-run institutional viability before a boomtown turns into a trap.

The current repository is the backend and research layer: a Python simulation engine, scenario library, hypothesis-analysis pipeline, paper-manifest workflow, and a small comparison API. The frontend is intentionally not shipped yet. There are design notes for it in `docs/system/frontend.md`, but the actual web app is still TBD.

## Status

- Implemented: terrain generation, settlement-site selection, institutional dynamics, policy comparison, scenario experiments, hypothesis analysis, paper fetching/synthesis, compare API
- Not implemented in this repo: production frontend/dashboard

## What The Model Tries To Test

The simulation treats settlement allocation as a non-stationary bandit problem over candidate sites on a seeded peninsula. Each site combines:

- geography and accessibility
- resource rents
- institutional state: extraction, openness, adaptability
- endogenous dynamics such as reform, drift, shocks, congestion, and network spillovers

This lets the project test whether resource-rich sites attract too much early allocation, whether inclusive institutions compound, and which policies adapt best when arms change even when they are not selected.

## What Is In Scope

- Procedural terrain generation with derived layers and site suitability
- Nine named scenarios including `resource-curse`, `botswana`, `open-cluster`, `shock-reform`, and `ucb-bait`
- Policy baselines and comparisons across epsilon-greedy, UCB variants, Thompson variants, contextual policies, and a Whittle-style policy
- Experiment runners that emit JSON results for single runs, sweeps, benchmarks, and multi-scenario hypothesis suites
- Research tooling around `research/index.json` and cached paper downloads

## What This Is Not

- Not an agent-based model of individual households or firms
- Not a general-equilibrium trade model
- Not a finished interactive product

## Repository Layout

```text
api/                       FastAPI comparison endpoint for deployment targets
configs/                   Default simulation configuration
docs/                      Theory, system design, and module notes
research/                  Paper manifest, reading order, theory notes
results/                   Example JSON outputs from runs and experiments
src/insulindian_miracle/   Simulation engine, policies, CLI, analysis
tests/                     Pytest suite
```

## Installation

The package metadata currently targets Python 3.14+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

If you are on Windows PowerShell, activate with `.venv\Scripts\Activate.ps1` instead.

## CLI

List scenarios:

```bash
insulindian-miracle sim scenarios
```

Run one seeded simulation:

```bash
insulindian-miracle sim run --policy gaussian-thompson --scenario baseline
```

Run a multi-policy experiment:

```bash
insulindian-miracle sim experiment \
  --scenario resource-curse \
  --runs 12 \
  --output results/resource-curse.json
```

Run the hypothesis suite:

```bash
insulindian-miracle sim hypotheses \
  --runs 12 \
  --include-experiments \
  --output results/hypotheses.json
```

Fetch the paper corpus declared in `research/index.json`:

```bash
insulindian-miracle research fetch \
  --manifest research/index.json \
  --cache insulindian-miracle-paper-cache
```

Regenerate the theory synthesis:

```bash
insulindian-miracle research synthesize
```

## Outputs

Simulation and experiment runners emit JSON. Typical outputs include:

- cumulative reward and reward history
- site-level initial/final institutional state
- selection shares and population distribution
- aggregate metrics such as Gini, HHI, Zipf slope, regret, and resource-population correlations

Example artifacts already checked into the repo live under `results/`.

## API

`api/compare.py` exposes a small FastAPI endpoint for policy comparison over a shared seed, scenario, and set of terrain/config overrides. It is useful as a thin backend surface for a future frontend, but it is not a full application layer.

The Vercel config in `vercel.json` targets this API with Python 3.14.

## Documentation

Start with:

- `docs/index.md` for the documentation map
- `docs/theory/hypotheses.md` for the research questions
- `docs/system/architecture-overview.md` for the intended subsystem split and data flow
- `research/theory/peninsula-framework.md` for the current conceptual framing

## Frontend

Frontend work is consciously deferred. The repo contains a frontend design/spec document, not a shipped frontend implementation. Any README language that reads like a live dashboard should be treated as roadmap, not current state.
