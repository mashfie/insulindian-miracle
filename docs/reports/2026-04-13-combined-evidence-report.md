---
tags: [report, evidence, synthesis]
type: report
date: 2026-04-13
---

# Combined Evidence Report

This report reorganizes the archive around a three-cohort evidence program rather than a single undifferentiated sweep. The execution contract is

$$
N_{\mathrm{total}}=1{,}000{,}008+90{,}000+500{,}000=1,590,008.
$$

The arithmetic is not the result. It is the indexing scheme that prevents one cohort from impersonating another.

## Cohort Logic

`legacy_1m` is the broad non-oracle baseline sweep. It supports policy ranking under the legacy design, but it is not scenario-resolved evidence. `historical_90k` is the canonical nine-scenario suite, reconstructed as $9 \times 1{,}000 \times 10$ executions. `stress_500k` is the adversarial extension: a trap-heavy, perturbed scenario program designed to push the model toward boomtown collapse, resource capture, primacy, and shock/reform edge cases.

The combined frontend synthesis is therefore stratified. It can compare rankings across cohorts, but it should not pool incompatible estimands as if they were one experiment.

## Materialization

- `legacy_1m`: 1,000,008 materialized rows, 111,112 configs, 9 policies
- `historical_90k`: 90,000 materialized rows, 9,000 configs, 10 policies
- `stress_500k`: 500,000 materialized rows, 50,000 configs, 10 policies

The materialized rows above are read directly from the Rust Parquet outputs in `results/cohorts`. The headline count remains the planned and reproducible cohort contract; the materialization table records what is actually present on disk when the R synthesizer is run.

## Estimand

For matched comparisons the pipeline reports

$$
\widehat{\Delta}_{\pi,\pi'}=\frac{1}{n}\sum_{i=1}^{n}(R_{i,\pi}-R_{i,\pi'}),
$$

with a paired nonparametric bootstrap interval over the matched configuration index. No p-value is produced because the question is effect magnitude under a simulator design, not ritual rejection of a null whose assumptions would be false by construction.

The scalar diagnostics remain

$$
\mathrm{regret}_{\pi}=R_{\mathrm{oracle}}-R_{\pi},\qquad \mathrm{HHI}=\sum_i s_i^2,\qquad \hat\zeta=\text{Zipf slope}.
$$

Oracle-gap claims are emitted only for the scenario-backed cohorts. The legacy cohort may still carry an internally computed oracle baseline in the Rust runner, but the report treats it as baseline ranking evidence, not as scenario mechanism evidence.

## Policy Reading

The current scenario-backed leader is `sliding-window-ucb` with mean cumulative reward 3603.18. This statement is scoped to the historical and stress cohorts. The legacy million-row cohort remains baseline context rather than scenario evidence.

The main methodological pattern is temporal memory. Stationary optimism is useful as a diagnostic control, but the pathologies of the model are nonstationary: arms rot under extraction, shocks change institutional state, and agglomeration can turn a local advantage into a primacy trap. Forgetting, discounting, posterior variance, and spatial structure become different ways of refusing the fiction that yesterday's mean is still the environment.

## Frontend Contract

The frontend uses `web/content/source/results/cohort-synthesis.json` for the landing synthesis, `policy-dossiers.json` for policy pages, and `*-cohort.json` scenario files for route-level evidence. The comparison API no longer samples mock data. It reads checked-in cohort summaries and returns deterministic results.

## Remaining Gap

The simulator is still a reduced-form political economy, not a structural econometric estimate. Its academic contact points are explicit: resource curse and institutional economics for rent capture, urban economics for concentration and Zipf signatures, and bandit theory for regret and nonstationarity. The implementation matches that reality only where the cohort design gives it the right estimand. Where it does not, the frontend now says less.

## Reading Order

Read the landing page for cohort accounting, scenario pages for mechanism-rich institutional and spatial explanations, policy pages for cross-scenario dossiers, and `docs/next-steps.md` for the places where academic reality still outruns the implementation.
