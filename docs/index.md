---
tags: [index, moc]
type: moc
---

# Insulindian Miracle

Research wiki for the Rust simulation engine, the scenario library, and the academic literature behind the project.

## Start Here

- [[glossary]]
- [[architecture-overview]]
- [[code-flow]]
- [[methodology]]
- [[formal-model]]
- [[linear-algebra]]
- [[numerical-analysis]]
- [[2026-04-13-combined-evidence-report]]
- [[next-steps]]

## Current Status

- The executable core is the Rust engine in `rust/src/`.
- `configs/scenarios/*.json` and `configs/experiments/hypothesis_suite.json` define the experiment surface.
- `python/` and `R/` are downstream analysis shells for artifacts emitted by the Rust engine.
- Existing numeric result tables without a manifest-backed artifact should be treated as provisional. See [[RESULTS]] and [[next-steps]].
- The cohort rewrite and the current materialization boundary are recorded in [[2026-04-13-combined-evidence-report]].

## Theory Spine

- [[resource-curse]]
- [[institutional-economics]]
- [[urban-economics]]
- [[multi-armed-bandits]]
- [[restless-bandits]]
- [[hypotheses]]

## Methodology

- [[methodology]]
- [[formal-model]]
- [[research-design]]
- [[linear-algebra]]
- [[numerical-analysis]]

## System

- [[architecture-overview]]
- [[simulation-loop]]
- [[reward-function]]
- [[institutional-dynamics]]
- [[terrain-generation]]
- [[configuration]]
- [[code-flow]]

## Policies

- [[epsilon-greedy]]
- [[ucb1]]
- [[discounted-ucb]]
- [[sliding-window-ucb]]
- [[thompson-sampling]]
- [[discounted-thompson]]
- [[linucb]]
- [[linear-thompson]]
- [[whittle-index]]
- [[myopic-oracle]]

## Scenarios

- [[baseline]]
- [[resource-curse-scenario]]
- [[botswana]]
- [[open-cluster]]
- [[merchant-republic]]
- [[megacity-trap]]
- [[balanced-urban]]
- [[shock-reform]]
- [[ucb-bait]]

## Code Map

- [[model]]
- [[terrain]]
- [[policies]]
- [[sim]]
- [[scenarios]]
- [[cli]]
- [[analysis]]
- [[research]]

## External Corpus

- `research/index.json` is the bibliography manifest.
- `research/theory/peninsula-framework.md` is the project-specific literature bridge.
- `insulindian-miracle-paper-cache/` stores fetched papers where available.
