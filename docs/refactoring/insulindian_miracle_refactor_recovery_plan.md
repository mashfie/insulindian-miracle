# Insulindian Miracle — Refactor Recovery and Semantics Restoration Plan

## 0. Why this document exists

The Rust branch was meant to turn *Insulindian Miracle* into a high-throughput Monte Carlo laboratory for nonstationary / restless multi-armed bandits with economic interpretation. That direction is correct. The problem is not that the project became narrower. The problem is that parts of the semantic core drifted during the port.

This recovery plan treats the current Rust branch as a **pre-merge recovery branch**, not a finished refactor. The aim is to preserve the valid engineering gains while restoring mathematical fidelity, benchmark legitimacy, and research usefulness.

The governing principle is simple:

> The engine may become faster, narrower, and more modular. It may not silently become a different model while still claiming continuity with the old one.

---

## 1. Project goal, restated precisely

The project is not merely a simulator. It is a **computational research instrument** intended to answer questions such as:

- When do high-rent arms lure standard MAB policies into long-run traps?
- How do policies behave when activation endogenously changes arm quality?
- Under what parameter regions do short-run reward and long-run welfare diverge?
- Which policy classes remain robust under institutional drift, shocks, and path dependence?

That means the project has four obligations:

1. **Mathematical stability** — the modeled object must be well-defined and versioned.
2. **Implementation fidelity** — policy and transition semantics must match the intended model.
3. **Reproducibility** — fixed seeds and fixed configs must produce stable outputs.
4. **Research usability** — outputs must support diagnosis, comparison, and downstream statistical analysis.

Billions of simulations do not compensate for semantic drift. They only estimate the wrong object more efficiently.

---

## 2. What is allowed to change, and what is not

## 2.1 Allowed changes

These are legitimate refactor moves:

- Porting hot loops to Rust.
- Replacing Python sweep execution with parallel Rust execution.
- Streaming results to Parquet.
- Moving scenarios/configs into JSON manifests.
- Removing non-core code from the engine layer.
- Splitting execution, analysis, and synthesis into separate layers.
- Implementing low/high detail output modes.

## 2.2 Not allowed without explicit versioning

These are **model changes**, not refactors:

- Changing terrain-generation semantics.
- Changing site-selection semantics.
- Changing boomtown/trade-cluster construction logic.
- Changing policy definitions or benchmark semantics.
- Changing the reward function or transition law.
- Changing scenario override behavior.
- Changing the oracle comparator.

If any of those changes are intentional, they must be introduced as **Model v2**, not smuggled in under “Rust port.”

---

## 3. Diagnosis of current state

## 3.1 What is genuinely improved already

- Rust execution core is materially faster.
- Parallel sweep infrastructure is real and useful.
- Parquet output infrastructure exists.
- Config surface is richer and more externalized.
- Snapshot-based policy evaluation is a strong architectural idea.

## 3.2 What regressed and must be repaired

### A. Policy / benchmark regressions
- `myopic-oracle` no longer computes true one-step reward; it degenerates into a high-resource heuristic.
- `Whittle` is not a literal parity port; the surrogate appears to contain extra structure beyond the Python semantics.
- Policy parity is therefore not trustworthy.

### B. World-generation drift
- Terrain generation is no longer semantically equivalent.
- Distance transforms changed.
- Slope-dependent fields were simplified away.
- Candidate-site selection changed substantially.
- Boomtown and trade-cluster assignment logic changed.

### C. Validation and research regressions
- Python test suite was removed.
- No visible parity harness exists.
- Single-run outputs became too thin for diagnosis.
- The research/analysis shell was removed rather than decoupled.
- README/documentation overstates the degree of completion and parity.

### D. Configuration safety regressions
- Unknown scenario/config override keys are no longer rejected loudly.
- This allows silent configuration errors.

---

## 4. Recovery strategy

The recovery should proceed in **four layers**.

## Layer A — Canonical semantics (must stabilize first)
This is the frozen mathematical object:
- terrain generator
- site-selection logic
- reward function
- transition law
- benchmark definitions
- policy definitions

## Layer B — Engine and execution
This is Rust:
- deterministic execution
- parallel sweeps
- low/high detail outputs
- file writing
- CLI

## Layer C — Experiment protocol
This defines what runs mean:
- scenario manifests
- seed schedules
- policy sets
- benchmark configuration
- parity checks
- run manifests

## Layer D — Research / analysis shell
This is where interpretation lives:
- R/Python analysis
- regret decomposition
- PCA / clustering / phase maps
- tables and figures
- paper / theory synthesis tooling

The mistake in the current branch was collapsing Layers A–D into Layer B and then deleting C/D.

---

## 5. Merge gates

No merge to `main` until all **Gate 1** items are complete.

## Gate 1 — Minimum semantic safety
1. Restore true oracle semantics.
2. Restore strict scenario/config validation.
3. Add parity harness for a fixed set of seeds/configs.
4. Fix trade-cluster selection semantics.
5. Decide whether terrain/site-generation is parity-preserving or a versioned model change.
6. Correct README claims to match reality.

## Gate 2 — Research usability
1. Implement real LOD output modes.
2. Restore rich single-run diagnostics for exemplar runs.
3. Restore benchmark/experiment CLI surface, or equivalent.
4. Reintroduce a lightweight analysis shell over Parquet.

## Gate 3 — Statistical laboratory
1. R Arrow pipeline.
2. Clustering.
3. PCA / feature importance.
4. Phase transition mapping.
5. Figure generation.

---

## 6. Task inventory with complexity scores

Scoring scheme:
- **1** trivial
- **2** small
- **3** moderate
- **5** substantial
- **8** large
- **13** major

“Blocked” means the task should not start until a prerequisite is resolved.

---

## Phase 1 — Immediate semantic repairs

### 1.1 Restore true myopic oracle
- **Goal:** Make `myopic-oracle` compute actual one-step reward under the real reward function, not resource-rent ranking.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** Rust oracle matches Python semantics on fixed seeds and snapshots.
- **Notes:** This is small, high-impact, and should be first.

### 1.2 Restore strict unknown-key validation for scenario overrides
- **Goal:** Reject unknown top-level and terrain override keys loudly.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** Invalid scenario/config files fail fast with explicit errors.
- **Notes:** Essential for scientific hygiene.

### 1.3 Fix trade-cluster count semantics
- **Goal:** Ensure cluster selection fills up to `trade_cluster_count` using the Python fallback logic if not enough sites fall within radius.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** Same number/logic as Python for comparable worlds.

### 1.4 Fix boomtown selection semantics
- **Goal:** Restore Python’s geography-cutoff-plus-fallback behavior.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** Same boomtown assignment decisions on parity seeds.

### 1.5 Audit Whittle surrogate term-by-term
- **Goal:** Compare Python and Rust Whittle surrogate reward and transition equations line by line.
- **Complexity:** 5
- **Blocked:** No
- **Deliverable:** Written diff document specifying exact parity mismatches.
- **Notes:** Do not “optimize” until parity is known.

### 1.6 Restore Whittle parity
- **Goal:** Remove any non-parity extras from Rust Whittle unless intentionally versioned.
- **Complexity:** 5
- **Blocked:** Yes — blocked by 1.5
- **Deliverable:** Whittle policy semantics match canonical definition.

### 1.7 Correct README and status messaging
- **Goal:** Remove overclaims about frontend completeness, parity completeness, and fully finished migration status.
- **Complexity:** 1
- **Blocked:** No
- **Deliverable:** README reflects actual project state.

---

## Phase 2 — Parity harness and reproducibility

### 2.1 Reconstruct the “gold standard” parity dataset contract
- **Goal:** Define exactly what the parity suite contains: seeds, scenarios, policies, and trace fields.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** A spec document for parity data.

### 2.2 Add canonical fixed-seed smoke fixtures
- **Goal:** Create a small set of seed/config snapshots that are checked on every run.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** 5–10 frozen test worlds.

### 2.3 Reintroduce Rust test suite
- **Goal:** Add unit tests for reward, network bonus, scenario validation, and policy selection basics.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** `cargo test` covers core invariants.

### 2.4 Build Python-vs-Rust parity runner
- **Goal:** Run a shared config through both engines and compare outputs.
- **Complexity:** 5
- **Blocked:** No
- **Deliverable:** A tool/script that emits pass/fail with tolerances.

### 2.5 Add parity tolerances and mismatch reporting
- **Goal:** Define which outputs need exact match and which allow floating tolerance.
- **Complexity:** 2
- **Blocked:** Yes — blocked by 2.4
- **Deliverable:** Structured mismatch report.

### 2.6 Revalidate policy trajectories under fixed seeds
- **Goal:** Check chosen-arm sequences and rewards for multiple policies under fixed seeds.
- **Complexity:** 5
- **Blocked:** Yes — blocked by 1.1, 1.6, 2.4
- **Deliverable:** Policy parity report.

---

## Phase 3 — Terrain and world-generation semantics

This phase is crucial. It decides whether the Rust branch is a real port or a new model.

### 3.1 Write explicit terrain parity memo
- **Goal:** Compare Python and Rust terrain generation component by component.
- **Complexity:** 5
- **Blocked:** No
- **Deliverable:** A matrix of parity / drift / intentional change.

### 3.2 Remove forced left-border land if parity is desired
- **Goal:** Eliminate unconditional `land_mask[y][0] = true` unless intentionally versioned.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** Terrain semantics closer to Python.

### 3.3 Restore slope-dependent derived fields if parity is desired
- **Goal:** Reintroduce slope into arability, defensibility, and port quality where Python used it.
- **Complexity:** 5
- **Blocked:** Yes — blocked by 3.1 decision
- **Deliverable:** Derived terrain fields align with canonical model.

### 3.4 Replace rough distance transform or explicitly version it
- **Goal:** Use a more faithful Euclidean distance transform or accept model versioning.
- **Complexity:** 8
- **Blocked:** Yes — blocked by 3.1 decision
- **Deliverable:** Either parity implementation or documented v2 divergence.

### 3.5 Restore candidate-site selection semantics
- **Goal:** Reproduce Python’s interior preference, border bonus, spread scoring, and fallback behavior.
- **Complexity:** 5
- **Blocked:** Yes — blocked by 3.1 if the terrain itself is changing
- **Deliverable:** Candidate site selection parity.

### 3.6 Decide model version boundary
- **Goal:** Decide whether terrain/site-selection changes remain in v1 or are promoted to v2.
- **Complexity:** 3
- **Blocked:** Yes — blocked by 3.1
- **Deliverable:** Clear versioning decision.

---

## Phase 4 — Output layer and diagnostics restoration

### 4.1 Define real LOD contract
- **Goal:** Specify `LOW`, `MEDIUM`, `HIGH` output payloads.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** Formal output schema.

Suggested contract:
- `LOW`: aggregate run metrics only
- `MEDIUM`: aggregate + selected arms + reward history + terrain summary
- `HIGH`: medium + per-site outcomes + optional step traces

### 4.2 Implement `LOW` / `MEDIUM` / `HIGH`
- **Goal:** Make LOD an actual engine feature, not dead config.
- **Complexity:** 5
- **Blocked:** Yes — blocked by 4.1
- **Deliverable:** Different run payloads based on LOD.

### 4.3 Restore `selected_sites` and `reward_history`
- **Goal:** Reintroduce minimum policy-diagnostic traces.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** Run outputs usable for debugging and regret analysis.

### 4.4 Restore site-level outcome summaries
- **Goal:** Reintroduce per-site final metrics for exemplar runs.
- **Complexity:** 5
- **Blocked:** No
- **Deliverable:** Site-level analysis possible again.

### 4.5 Restore oracle regret computation
- **Goal:** Recover experiment-level benchmark summaries using the corrected oracle.
- **Complexity:** 3
- **Blocked:** Yes — blocked by 1.1 and 4.3
- **Deliverable:** Valid regret summaries.

---

## Phase 5 — CLI and experiment protocol restoration

### 5.1 Restore scenario listing command
- **Goal:** Bring back a scenario-inspection CLI function.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** Scenarios visible from CLI.

### 5.2 Restore benchmark command
- **Goal:** Recover quick multi-policy sanity checks.
- **Complexity:** 2
- **Blocked:** No
- **Deliverable:** One-command benchmark over canonical policies.

### 5.3 Restore experiment command
- **Goal:** Support repeated runs over seeds/policies/scenarios with summaries.
- **Complexity:** 5
- **Blocked:** Yes — blocked by 4.5 for full value
- **Deliverable:** Standard experiment runner.

### 5.4 Restore comparison mode
- **Goal:** Reintroduce shared-world policy comparison.
- **Complexity:** 5
- **Blocked:** Yes — blocked by policy parity and output restoration
- **Deliverable:** JSON comparison artifact.

### 5.5 Add run manifest support
- **Goal:** Every experiment should record engine version, model version, scenario, seeds, policies, and output schema.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** Reproducible run manifests.

---

## Phase 6 — Research shell restoration (partial, pre-merge allowed)

Yes — parts of the research / synthesis layer can and should be restored before merge, provided they are treated as **analysis consumers of the engine**, not as re-entangled core logic.

### 6.1 Restore lightweight analysis package skeleton
- **Goal:** Recreate `analysis/` or `research_analysis/` as a separate layer over Parquet/JSON outputs.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** Clean analysis package boundary.

### 6.2 Restore hypothesis-suite specification
- **Goal:** Rebuild the *spec* for hypothesis runs even if not all figures are implemented yet.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** A canonical set of hypothesis experiments.

### 6.3 Restore regret decomposition analysis
- **Goal:** Compute policy regret summaries, ranking flips, and distributional behavior over sweeps.
- **Complexity:** 5
- **Blocked:** Yes — blocked by valid oracle and output restoration
- **Deliverable:** Research-grade regret analysis.

### 6.4 Restore phase-map pipeline
- **Goal:** Sweep across chosen parameter grids and map policy-rank regions.
- **Complexity:** 8
- **Blocked:** Yes — blocked by 6.3 and stable semantics
- **Deliverable:** Parameter-region phase diagrams.

### 6.5 Restore clustering / PCA shell in R
- **Goal:** Use Arrow/Parquet in R for dimensionality reduction and world clustering.
- **Complexity:** 5
- **Blocked:** Yes — blocked by stable output schema
- **Deliverable:** Initial `R/` analysis scripts.

### 6.6 Restore theory / synthesis tooling selectively
- **Goal:** Keep paper manifests, theory notes, and synthesis scripts as a separate research layer if still useful.
- **Complexity:** 3
- **Blocked:** No
- **Deliverable:** Research memory survives without polluting engine code.
- **Notes:** This is absolutely defensible. The mistake was deleting it entirely rather than separating it.

---

## Phase 7 — Statistical laboratory

This phase should start only after semantic stability.

### 7.1 Build Arrow → R loader
- **Complexity:** 2
- **Blocked:** Yes — blocked by stable Parquet schema

### 7.2 Create core R summary notebook/script
- **Complexity:** 3
- **Blocked:** Yes — blocked by 7.1

### 7.3 Implement PCA of parameter-to-outcome structure
- **Complexity:** 5
- **Blocked:** Yes — blocked by 7.2

### 7.4 Implement clustering of worlds
- **Complexity:** 5
- **Blocked:** Yes — blocked by 7.2

### 7.5 Implement phase-transition mapping
- **Complexity:** 8
- **Blocked:** Yes — blocked by 7.2

### 7.6 Generate publication-grade figures
- **Complexity:** 5
- **Blocked:** Yes — blocked by 7.3–7.5

---

## 7. Recommended execution order for “small unblocked tasks first”

Here is the sequence that gives maximum leverage with minimal blockage.

### Start immediately
1. Restore true myopic oracle — **2**
2. Restore strict unknown-key validation — **2**
3. Fix trade-cluster count semantics — **2**
4. Correct README/status messaging — **1**
5. Restore scenario listing command — **2**
6. Define LOD contract — **2**
7. Reconstruct parity dataset contract — **3**
8. Add fixed-seed smoke fixtures — **2**
9. Reintroduce Rust test suite — **3**
10. Restore benchmark command — **2**

### Next, medium tasks
11. Audit Whittle parity — **5**
12. Restore reward history / selected sites — **3**
13. Restore site-level outcome summaries — **5**
14. Build Python-vs-Rust parity runner — **5**
15. Write terrain parity memo — **5**
16. Fix boomtown selection semantics — **3**

### Then major semantic decisions
17. Restore Whittle parity — **5**
18. Restore candidate-site selection semantics — **5**
19. Decide terrain/model version boundary — **3**
20. Restore oracle-regret summaries — **3**
21. Restore experiment command — **5**
22. Restore comparison mode — **5**

### Then rebuild research shell
23. Restore lightweight analysis package skeleton — **3**
24. Restore hypothesis-suite specification — **3**
25. Restore regret decomposition analysis — **5**
26. Restore theory/synthesis tooling selectively — **3**
27. Build R Arrow pipeline — **2**
28. Add clustering/PCA/phase-map analysis — **5 / 5 / 8**

---

## 8. Concrete architectural target

## 8.1 Repository structure

```text
rust/
  src/
    core/                 # canonical engine logic
    policies/             # canonical policy implementations
    terrain/              # canonical world generation
    runner/               # execution / sweeps / output
    validation/           # parity checks, test helpers

configs/
  default.json
  scenarios/
  experiments/

analysis/
  python/ or r/
    load_outputs/
    regret/
    clustering/
    pca/
    figures/

research/
  theory/
  notes/
  synthesis/

results/
  manifests/
  low/
  high/
```

## 8.2 Separation rules

- `rust/src/core` may not depend on research tooling.
- `analysis/` may depend on Parquet outputs, never on engine internals.
- `research/` may consume results and notes, but may not mutate engine semantics.
- Policies must be versioned if their equations change.
- Terrain/site-selection changes must trigger model version bumps.

---

## 9. Canonical semantics contract

Before merge, write a short `SEMANTICS.md` stating:

- **Model version:** `v1-canonical` or `v2-terrain-rewrite`
- **Reward function:** authoritative source file
- **Transition law:** authoritative source file
- **Oracle definition:** authoritative source file
- **Policy definitions:** authoritative source files
- **Scenario override rules:** unknown keys invalid
- **Seed contract:** deterministic and reproducible
- **Output schemas:** `LOW`, `MEDIUM`, `HIGH`

Without this, the repo will drift again.

---

## 10. What should be restored from the research synthesis layer

Yes — some of it should return.

Not because it belongs inside the engine, but because a serious simulation lab needs memory and interpretation.

Recommended restorations:

### Restore now
- theory notes
- paper manifest
- synthesis scripts / notes
- hypothesis specifications
- scenario interpretations

### Restore later
- automated corpus synthesis
- richer publication pipelines
- dashboard-facing narrative summaries

### Do not re-entangle
- research tooling should not be required to build or run the engine
- engine should emit artifacts that research tooling consumes

So the correct answer is: **yes, restore parts of the research synthesis layer — but as Layer D, not inside the execution core.**

---

## 11. Definition of done for the recovery

The recovery is complete when all of the following are true:

1. The Rust engine has a frozen canonical semantics contract.
2. The oracle, Whittle, and benchmark semantics are correct.
3. Fixed-seed parity checks pass for canonical worlds and policies.
4. Config mistakes fail loudly.
5. LOD is real and supports both massive sweeps and deep exemplar analysis.
6. Experiment commands and manifesting are restored.
7. A lightweight analysis shell exists over Parquet outputs.
8. Documentation states exactly what the project is, and what it is not.

At that point, the project becomes what it was supposed to be:

> a high-throughput, semantically disciplined Monte Carlo research engine for studying nonstationary bandits with economic interpretation.

---

## 12. Final guidance

Do **not** begin with clustering, PCA, or billion-run sweeps.

Begin with the small semantic repairs that restore trust:
- oracle
- validation
- trade-cluster semantics
- README honesty
- tests
- parity fixtures

Then recover observability.
Then restore experiments.
Then restore analysis.
Then scale.

That order is not cosmetic. It is the difference between research and noise.

