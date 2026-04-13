# Combined Evidence Report (April 13, 2026)

## Summary

This report reorganizes the archive around a **three-cohort evidence program** rather than a single undifferentiated sweep. The intended execution budget is

$$
N_{\mathrm{total}}
=
N_{\mathrm{legacy}}
+
N_{\mathrm{historical}}
+
N_{\mathrm{stress}}
=
1{,}000{,}008
+
90{,}000
+
500{,}000
=
1{,}590{,}008.
$$

The substantive point is not merely arithmetic. The cohorts answer different questions:

1. `legacy_1m` is a broad baseline sweep inferred from the checked-in `configs/sweep_configs.jsonl` generator. It supports large-scale ranking statements within that baseline design.
2. `historical_90k` is the canonical nine-scenario suite reconstructed as $9 \times 1{,}000 \times 10$ executions. It is the first cohort designed to support scenario-resolved and oracle-resolved comparisons at serious scale.
3. `stress_500k` is the adversarial extension. It overweights trap, curse, and shock regimes and perturbs the initial conditions and dynamic coefficients, so that the model is evaluated where it is most likely to break.

The frontend rewrite now encodes this distinction explicitly. Provenance is part of the result.

## Estimands

For cohorts with matched configuration draws and oracle support, the primary comparison object is the paired policy gap

$$
\Delta_{\pi,\pi'} = \mathbb{E}[R_{\pi} - R_{\pi'} \mid c],
$$

where $c$ indexes the common configuration draw. We report $95\%$ paired bootstrap intervals rather than $p$-values. The aim is to estimate effect magnitude and uncertainty, not to manufacture a theatrical binary of significance.

The principal scalar diagnostics remain:

$$
\mathrm{regret}_{\pi} = R_{\mathrm{oracle}} - R_{\pi},
\qquad
\mathrm{HHI} = \sum_i s_i^2,
\qquad
\hat{\zeta} = \text{Zipf slope}.
$$

These quantities are only narrated at the scope their cohort supports. A legacy baseline sweep is not allowed to impersonate a scenario-specific estimand.

## Current Materialization State

The repository currently contains a checked-in scenario suite with full raw JSON trajectories and site-level outcomes. That suite remains useful because it carries the mechanism-rich layer the frontend can render directly: reward histories, site outcomes, boomtown traces, and scenario-wise summaries.

What it does **not** yet do is replace the large cohorts. The large cohorts require either regenerated Parquet artifacts or imported historical outputs with manifests. The new pipeline therefore separates:

- planned cohort totals,
- manifest-ready cohort inputs,
- materialized cohort Parquet rows,
- checked-in frontend evidence.

This is deliberate. The archive should not confuse *planned scale* with *materialized evidence*.

## Methodological Consequences

The rewrite changes four things materially.

### 1. Cohort Scope Is First-Class

Claims are now indexed by cohort. If a statement depends on scenario-level matching and oracle baselines, it belongs to `historical_90k` or `stress_500k`, not to the legacy sweep.

### 2. Frontend Evidence Is Deterministic

The prior frontend still contained random or mock paths. Those are removed. Comparison modules now replay checked-in summaries. Policy pages use cross-scenario dossiers instead of a single `ucb-bait` anecdote. Landing claims reference the full program and the currently materialized subset separately.

### 3. Editorial Prose No Longer Floats Free Of Data

The archive keeps an editorial register, but the prose is now downstream of explicit result contracts. The landing page may interpret; it may no longer improvise numbers.

### 4. Mathematical Rendering Is Part Of The Content Path

The exemplar sections are rendered through the markdown/KaTeX pipeline. This matters because the model is mathematical and should be allowed to say so in-line, rather than hiding the formal parts in captions or code comments.

## Where Implementation And Academic Reality Still Diverge

Two gaps remain visible even after the rewrite.

### Historical Artifact Recovery

The million-run and ninety-thousand-run cohorts are specified and supported in the pipeline, but their artifact recovery still depends on execution time and hardware budget. Until those cohorts are materialized, the checked-in scenario suite remains the visible empirical stratum.

### Raw-Trajectory Versus Sweep-Tensor Asymmetry

The checked-in JSON scenario files preserve rich within-run traces. The Parquet sweeps preserve wide aggregate tensors. These are not interchangeable. The frontend now treats them as complementary layers rather than forcing one to pretend to be the other.

## Practical Reading

The archive should now be read in the following order:

1. Landing page for the cohort contract and current materialization state.
2. Scenario pages for mechanism-rich explanations grounded in the updated wiki.
3. Policy pages for cross-scenario dossiers rather than single-scenario folklore.
4. `[[next-steps]]` for the remaining parity and evidence gaps.

The result is slower, less euphoric, and more defensible. That is an improvement.
