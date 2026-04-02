# Corpus Synthesis

This file is generated from `research/index.json` and groups the tracked literature
by the implementation layer it informs.

## Bandits

- `whittle1988restless` (1988, metadata-only): Restless Bandits: Activity Allocation in a Changing World. Foundational restless-bandit framing; use as conceptual anchor, not an implementation recipe.
- `auer2002ucb1` (2002, metadata-only): Finite-time Analysis of the Multiarmed Bandit Problem. Defines UCB1 and the optimism-under-uncertainty baseline.
- `levine2017rotting` (2017, open): Rotting Bandits. Captures the decaying-arm intuition behind extractive settlement traps.
- `russo2018thompson` (2018, open): A Tutorial on Thompson Sampling. Primary guide for continuous-reward Thompson Sampling design.
- `lattimore2020bandit` (2020, open): Bandit Algorithms. Core reference for stochastic bandits, regret, and policy interfaces.
- `akbarzadeh2020whittle` (2020, open): Conditions for Indexability of Restless Bandits and an O(K^3) Algorithm to Compute Whittle Index. Guides the surrogate discretization and indexability constraints.
- `agrawal2012thompson` (2012, open): Analysis of Thompson Sampling for the Multi-armed Bandit Problem. Useful for sanity-checking TS design and assumptions.
- `seznec2019rotting` (2019, open): Rotting Bandits Are Not Harder Than Stochastic Ones. Useful for building toy decaying benchmarks and expected policy behavior.

## Institutions

- `sachs1995resourcegrowth` (1995, open): Natural Resource Abundance and Economic Growth. Empirical anchor for the resource-curse hypothesis.
- `ross1999resourcecurse` (1999, metadata-only): The Political Economy of the Resource Curse. Frames the rentier-state and elite-capture mechanisms.
- `sachs2001curse` (2001, metadata-only): The Curse of Natural Resources. Supports the long-run outcome metrics and curse channels.
- `corden1982dutchdisease` (1982, metadata-only): Booming Sector and De-Industrialisation in a Small Open Economy. Background for shocks and sectoral crowd-out intuition.
- `acemoglu2001colonial` (2001, metadata-only): The Colonial Origins of Comparative Development. Useful for motivating why institutional starting points matter.

## Urban Geography

- `henderson1974cities` (1974, open): The Sizes and Types of Cities. Provides the agglomeration versus congestion intuition for reward design.
- `krugman1991geography` (1991, metadata-only): Increasing Returns and Economic Geography. Use as the conceptual basis for core-periphery and accessibility effects.
- `arthur1994pathdependence` (1994, metadata-only): Increasing Returns and Path Dependence in the Economy. Backs the lock-in and multiple-equilibria interpretation of runs.
