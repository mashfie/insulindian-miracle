---
tags: [index, moc]
type: moc
---

# Insulindian Miracle

A computational research testbed exploring **city formation**, **institutional dynamics**, and the **resource curse** using **multi-armed bandit algorithms** on procedurally generated peninsulas.

The simulation asks: given a landscape of candidate settlement sites with varying geography and natural resources, which sites should a planner invest in — and can an algorithm learn to avoid the trap where resource-rich sites offer high short-term returns but decay into extractive institutions long-term?

---

## Theory

The academic foundations underlying the simulation.

- [[resource-curse]] — Dutch disease, Sachs & Warner, the institutional channel
- [[institutional-economics]] — Extractive vs inclusive institutions, path dependence
- [[urban-economics]] — Agglomeration, central place theory, Zipf's law
- [[multi-armed-bandits]] — Explore/exploit, regret, stochastic bandits
- [[restless-bandits]] — Whittle relaxation and non-stationary arms
- [[explore-exploit-tradeoff]] — The core tension mapped to settlement decisions
- [[hypotheses]] — H1–H7: what the simulation tests

## System Design

How the simulation is built and how it runs.

- [[architecture-overview]] — Monorepo structure, data flow, tech stack
- [[simulation-loop]] — Step-by-step walkthrough of `run_simulation()`
- [[reward-function]] — Mathematical breakdown of `compute_reward()`
- [[institutional-dynamics]] — Extraction drift, reform, shocks
- [[terrain-generation]] — Perlin noise, hydrology, site selection
- [[configuration]] — `SimulationConfig` and `configs/default.json`
- [[frontend]] — Next.js dashboard, canvas rendering, component tree

## Module Reference

Per-module documentation cards.

| Module | Purpose |
|--------|---------|
| [[model]] | Core data models, reward function, institutional evolution |
| [[policies]] | 10 MAB algorithm implementations |
| [[sim]] | Simulation orchestration and experiment runners |
| [[terrain]] | Procedural terrain generation and site placement |
| [[analysis]] | Hypothesis testing framework (H1–H7) |
| [[scenarios]] | 9 pre-configured experiment variants |
| [[cli]] | Command-line interface |
| [[research]] | Academic paper indexing and synthesis |

## Policies

One note per bandit algorithm — formulation, implementation, and when it excels.

| Family | Policies |
|--------|----------|
| Baseline | [[epsilon-greedy]] |
| Optimistic | [[ucb1]], [[discounted-ucb]], [[sliding-window-ucb]] |
| Bayesian | [[thompson-sampling]], [[discounted-thompson]] |
| Contextual | [[linucb]], [[linear-thompson]] |
| Restless | [[whittle-index]] |
| Oracle | [[myopic-oracle]] |

## Scenarios

One note per scenario — real-world analogy, parameter overrides, tested hypotheses.

| Scenario | Horizon | Analogy |
|----------|---------|---------|
| [[baseline]] | 300 | Default dynamics |
| [[resource-curse-scenario]] | 420 | Nigeria / Venezuela |
| [[botswana]] | 420 | Botswana exception |
| [[open-cluster]] | 360 | Hanseatic League |
| [[merchant-republic]] | 360 | Venice / Genoa |
| [[megacity-trap]] | 360 | Bangkok / Lagos |
| [[balanced-urban]] | 360 | Germany / Netherlands |
| [[shock-reform]] | 420 | Post-crisis reform |
| [[ucb-bait]] | 280 | Boom-bust trap |
