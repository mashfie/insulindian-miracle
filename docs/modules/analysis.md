---
tags: [module, python, analysis]
type: module
related:
  - "[[hypotheses]]"
  - "[[sim]]"
  - "[[scenarios]]"
---

# analysis.py

`src/insulindian_miracle/analysis.py` — 622 lines. Hypothesis testing framework for evaluating simulation experiments across scenarios and policies.

## Key Exports

| Export | Purpose |
|--------|---------|
| `run_hypothesis_suite(config, policies, runs, include_experiments)` | Run all hypothesis scenarios and evaluate H1–H7 |
| `analyze_hypothesis_suite(experiments)` | Evaluate hypotheses from pre-computed experiments |
| `HYPOTHESIS_SCENARIOS` | Tuple of 5 scenario names used in testing |
| `HYPOTHESIS_REQUIREMENTS` | Dict mapping H1–H7 to required scenarios |

## Hypothesis Evaluators

Each hypothesis has a dedicated `_evaluate_hN()` function:

| Function | Hypothesis | Key Metrics |
|----------|-----------|-------------|
| `_evaluate_h1()` | Resource curse effect | resource-extraction correlation, site-level regression |
| `_evaluate_h2()` | Institutional quality | Cross-scenario comparison, conditional group means |
| `_evaluate_h3()` | Network/openness effects | Cluster premium, treatment premium |
| `_evaluate_h5()` | Algorithm comparison | Pairwise reward, regret, win rates |
| `_evaluate_h6()` | Zipf's law | Zipf slope, Gini, rank-size curves |
| `_evaluate_h7()` | UCB bait trap | Boomtown selection/population shares |

## Statistical Utilities

| Function | Purpose |
|----------|---------|
| `_series_stats()` | Mean, std, SEM, 95% CI for a sample |
| `_paired_stats()` | Paired comparison: diff stats, win/loss/tie rates |
| `_interaction_beta()` | OLS interaction coefficient (resource × extraction → population) |
| `_threshold_interaction_beta()` | Binary threshold version of interaction |
| `_conditional_group_summary()` | Group means for high-resource × high/low-extraction cells |
| `_cluster_scores()` | Openness-weighted spatial clustering metric |
| `_cluster_premium()` | Population gap: high-cluster vs low-cluster sites |
| `_zipf_tail_slope()` | Log-log rank-size slope |
| `_rank_curve()` | Sorted population distribution |
| `_standardize()` | Z-score normalisation |
| `_gini()` | Gini inequality coefficient |

## Workflow

```
run_hypothesis_suite()
  ├─ for each scenario in HYPOTHESIS_SCENARIOS:
  │     └─ run_experiment(config, policies, runs, scenario)
  └─ analyze_hypothesis_suite(experiments)
       ├─ _evaluate_h1(experiments["resource-curse"])
       ├─ _evaluate_h2(experiments["resource-curse"], experiments["botswana"])
       ├─ _evaluate_h3(experiments["baseline"], experiments["open-cluster"])
       ├─ _evaluate_h5(all experiments)
       ├─ _evaluate_h6(experiments["baseline"])
       └─ _evaluate_h7(experiments["ucb-bait"])
```

Each evaluator returns a dict with `status` ("supported", "mixed", "not_supported"), evidence metrics, and detailed statistics.
