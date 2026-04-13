# Parity Dataset Contract

This document defines the "gold standard" parity testing contract used to ensure semantic equivalence between the legacy Python implementation and the pure Rust engine for the *Insulindian Miracle* sandbox.

## 1. Canonical Seeds
Parity testing relies on a fixed, canonical set of seed values that define specific topological and institutional regimes.
The standard seeds are:
- `Seed 7` (Baseline Scenario, balanced peninsula)
- `Seed 42` (Resource Curse layout, concentrated rents)
- `Seed 1024` (Open Cluster, coastal trading posts)
- `Seed 9999` (Shock Reform layout, stressed institutions)

## 2. Policy Sets
For each canonical seed, the following canonical policies must be run:
- `epsilon-greedy` (baseline exploration)
- `ucb1` (standard multi-armed bandit upper confidence bound)
- `discounted-ucb` (nonstationary reactive bandit)
- `gaussian-thompson` (Bayesian probability matching)
- `myopic-oracle` (one-step structural clairvoyance)

## 3. Parity Validation Fields
A simulation run under a canonical seed/policy combination must produce matching output for the following trace fields (within floating-point tolerances):

**Aggregate Outputs (`LOW` LOD):**
- `cumulative_reward`: Total system reward over horizon
- `mean_final_extraction`: Final institutional average
- `mean_productive_capital`: Final capital accumulation
- `mean_shock_hits`: Exact count match
- `boomtown_population_share`: Precise floating point threshold (epsilon = 1e-4)

**Per-Site Trajectories (`HIGH` LOD):**
- `selected_sites`: Exact order of arm choices
- `reward_history`: Reward realized at each step
- `site.institution.extraction` trajectory over horizon

## 4. Expected Tolerances
Floating-point arithmetic differs slightly between Python's default interpreter math and Rust's `f64` (especially concerning `powf` and `exp` reductions). 
- Discrete choices (e.g. `selected_sites`) must match **exactly**.
- Terminal continuous metrics must match within an absolute epsilon of **1e-5**.
- Terrain generation masks (`width x height` booleans) must match **exactly**.
