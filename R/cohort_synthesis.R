#!/usr/bin/env Rscript

extra_lib <- Sys.getenv("INSULINDIAN_R_LIB", unset = "")
if (nzchar(extra_lib)) {
  .libPaths(c(strsplit(extra_lib, .Platform$path.sep, fixed = TRUE)[[1]], .libPaths()))
}

suppressPackageStartupMessages({
  library(arrow)
  library(jsonlite)
})

repo_root <- normalizePath(file.path(getwd()), winslash = "/", mustWork = TRUE)
results_root <- file.path(repo_root, "results", "cohorts")
manifest_root <- file.path(results_root, "manifests")
frontend_results_root <- file.path(repo_root, "web", "content", "source", "results")
report_path <- file.path(repo_root, "docs", "reports", "2026-04-13-combined-evidence-report.md")

legacy_policies <- c(
  "epsilon-greedy",
  "ucb1",
  "discounted-ucb",
  "sliding-window-ucb",
  "gaussian-thompson",
  "discounted-gaussian-thompson",
  "linucb",
  "linear-thompson",
  "whittle-index"
)
oracle_policy <- "myopic-oracle"
scenario_policies <- c(oracle_policy, legacy_policies)

short_policy_names <- c(
  "epsilon-greedy" = "Eps",
  "ucb1" = "UCB1",
  "discounted-ucb" = "D-UCB",
  "sliding-window-ucb" = "SW-UCB",
  "gaussian-thompson" = "Gauss TS",
  "discounted-gaussian-thompson" = "D-TS",
  "linucb" = "LinUCB",
  "linear-thompson" = "LinTS",
  "whittle-index" = "Whittle",
  "myopic-oracle" = "Oracle"
)

cohort_specs <- list(
  legacy_1m = list(
    description = "Legacy million-scale baseline sweep reconstructed from configs/sweep_configs.jsonl.",
    policies = legacy_policies,
    config_count = 111112L,
    executions = 1000008L,
    scenario_supported = FALSE,
    oracle_supported = FALSE
  ),
  historical_90k = list(
    description = "Canonical nine-scenario suite with 1,000 matched seeds per scenario and oracle support.",
    policies = scenario_policies,
    config_count = 9000L,
    executions = 90000L,
    scenario_supported = TRUE,
    oracle_supported = TRUE
  ),
  stress_500k = list(
    description = "Stress-heavy scenario sweep with deterministic perturbations and scenario-weighted quotas.",
    policies = scenario_policies,
    config_count = 50000L,
    executions = 500000L,
    scenario_supported = TRUE,
    oracle_supported = TRUE
  )
)

summary_metrics <- c(
  "cumulative_reward",
  "oracle_reward",
  "oracle_regret",
  "empirical_best_reward",
  "empirical_regret",
  "mean_final_extraction",
  "mean_final_openness",
  "mean_final_adaptability",
  "mean_final_resource_rent",
  "mean_productive_capital",
  "mean_reforms_triggered",
  "mean_shock_hits",
  "population_hhi",
  "population_gini",
  "zipf_slope",
  "resource_extraction_correlation",
  "resource_population_correlation",
  "boomtown_population_share",
  "boomtown_selection_share",
  "boomtown_pre_collapse_selection_share",
  "boomtown_collapse_selection_share",
  "land_share",
  "river_share"
)

heatmap_metrics <- data.frame(
  metric = c("cumulative_reward", "oracle_regret", "mean_final_extraction", "population_hhi", "zipf_slope"),
  invert = c(FALSE, TRUE, TRUE, TRUE, FALSE),
  label = c("Reward", "Gap", "Extraction", "HHI", "Zipf"),
  stringsAsFactors = FALSE
)

scenario_descriptions <- list(
  baseline = list(
    description = "Default peninsula dynamics with moderate resource rents and modest institutional drift.",
    overrides = list()
  ),
  "resource-curse" = list(
    description = "Resource rents generate short-run cashflow while weakening institutional buffers.",
    overrides = list()
  ),
  botswana = list(
    description = "Resource endowment under stronger institutional buffers and producer-friendly governance.",
    overrides = list()
  ),
  "open-cluster" = list(
    description = "Trade-cluster externalities reward accessible networked sites rather than extractive rent.",
    overrides = list()
  ),
  "merchant-republic" = list(
    description = "Commercial network geography with port-led coordination and reduced resource salience.",
    overrides = list()
  ),
  "megacity-trap" = list(
    description = "Urban primacy and overstretch pressure penalize excessive concentration.",
    overrides = list()
  ),
  "balanced-urban-system" = list(
    description = "Secondary-city bonuses and lower primacy rewards produce a polycentric landscape.",
    overrides = list()
  ),
  "shock-reform" = list(
    description = "Institutional shock and reform dynamics turn crisis into a possible adaptive reset.",
    overrides = list()
  ),
  "ucb-bait" = list(
    description = "Short-run resource returns spike hard while institutional decay accelerates behind them.",
    overrides = list()
  )
)

dir.create(manifest_root, recursive = TRUE, showWarnings = FALSE)
dir.create(frontend_results_root, recursive = TRUE, showWarnings = FALSE)
dir.create(dirname(report_path), recursive = TRUE, showWarnings = FALSE)

short_policy <- function(policy) {
  value <- unname(short_policy_names[[policy]])
  if (is.null(value) || is.na(value)) policy else value
}

read_cohort <- function(name) {
  path <- file.path(results_root, paste0(name, ".parquet"))
  part_paths <- list.files(file.path(results_root, name), pattern = "^part-.*\\.parquet$", full.names = TRUE)
  paths <- if (length(part_paths)) sort(part_paths) else path
  if (!length(paths) || !all(file.exists(paths))) {
    return(NULL)
  }
  frames <- lapply(paths, function(item) as.data.frame(read_parquet(item)))
  frame <- do.call(rbind, frames)
  frame$policy <- as.character(frame$policy)
  frame$scenario <- as.character(frame$scenario)
  frame$cohort <- name
  frame
}

metric_summary <- function(frame) {
  if (is.null(frame) || nrow(frame) == 0) {
    return(list())
  }
  policies <- sort(unique(frame$policy))
  output <- list()
  for (policy in policies) {
    group <- frame[frame$policy == policy, , drop = FALSE]
    item <- list(runs = as.numeric(nrow(group)))
    for (metric in summary_metrics) {
      if (!metric %in% names(group)) {
        next
      }
      values <- suppressWarnings(as.numeric(group[[metric]]))
      values <- values[!is.na(values)]
      if (!length(values)) {
        next
      }
      item[[paste0("mean_", metric)]] <- mean(values)
      if (metric %in% c("cumulative_reward", "oracle_regret", "population_hhi", "mean_final_extraction")) {
        item[[paste0("std_", metric)]] <- if (length(values) > 1) stats::sd(values) else 0
      }
    }
    output[[policy]] <- item
  }
  output
}

oracle_summary <- function(frame) {
  metric_summary(frame[frame$policy == oracle_policy, , drop = FALSE])[[oracle_policy]] %||% list()
}

`%||%` <- function(left, right) {
  if (is.null(left)) right else left
}

bootstrap_ci <- function(values, iterations = 400L, seed = 20260413L) {
  values <- values[!is.na(values)]
  if (!length(values)) {
    return(c(NA_real_, NA_real_))
  }
  if (length(values) == 1L) {
    return(c(values[[1]], values[[1]]))
  }
  set.seed(seed)
  means <- replicate(iterations, mean(sample(values, size = length(values), replace = TRUE)))
  unname(stats::quantile(means, c(0.025, 0.975), na.rm = TRUE))
}

paired_policy_effects <- function(frame, baseline_policy, policy_list) {
  if (is.null(frame) || nrow(frame) == 0) {
    return(list())
  }
  baseline <- frame[frame$policy == baseline_policy, c("scenario", "seed", "cohort", "cumulative_reward"), drop = FALSE]
  names(baseline)[names(baseline) == "cumulative_reward"] <- "baseline_reward"
  output <- list()
  for (policy in policy_list) {
    if (policy == baseline_policy) {
      next
    }
    policy_frame <- frame[frame$policy == policy, c("scenario", "seed", "cohort", "cumulative_reward"), drop = FALSE]
    if (!nrow(policy_frame) || !nrow(baseline)) {
      next
    }
    merged <- merge(policy_frame, baseline, by = c("scenario", "seed", "cohort"))
    if (!nrow(merged)) {
      next
    }
    diff <- merged$cumulative_reward - merged$baseline_reward
    interval <- bootstrap_ci(diff)
    output[[length(output) + 1L]] <- list(
      policy = policy,
      baseline = baseline_policy,
      mean_gap = mean(diff),
      ci_low = interval[[1]],
      ci_high = interval[[2]],
      win_rate = mean(diff > 0),
      matches = length(diff)
    )
  }
  output
}

histogram_bins <- function(values, bins = 8L) {
  values <- suppressWarnings(as.numeric(values))
  values <- values[!is.na(values)]
  if (!length(values)) {
    return(list())
  }
  hist_data <- hist(values, breaks = bins, plot = FALSE)
  output <- vector("list", length(hist_data$counts))
  for (i in seq_along(hist_data$counts)) {
    output[[i]] <- list(
      label = sprintf("%.1f-%.1f", hist_data$breaks[[i]], hist_data$breaks[[i + 1L]]),
      count = as.integer(hist_data$counts[[i]])
    )
  }
  output
}

heatmap_payload <- function(frame, policy_order) {
  labels_x <- heatmap_metrics$label
  labels_y <- c()
  rows <- list()
  for (policy in policy_order) {
    group <- frame[frame$policy == policy, , drop = FALSE]
    if (!nrow(group)) {
      next
    }
    labels_y <- c(labels_y, short_policy(policy))
    row <- numeric(nrow(heatmap_metrics))
    for (i in seq_len(nrow(heatmap_metrics))) {
      metric <- heatmap_metrics$metric[[i]]
      value <- if (metric %in% names(group)) mean(as.numeric(group[[metric]]), na.rm = TRUE) else 0
      row[[i]] <- if (isTRUE(heatmap_metrics$invert[[i]])) -value else value
    }
    rows[[length(rows) + 1L]] <- row
  }
  if (!length(rows)) {
    return(list(labelsX = labels_x, labelsY = labels_y, data = list()))
  }
  matrix_data <- do.call(rbind, rows)
  for (col in seq_len(ncol(matrix_data))) {
    column <- matrix_data[, col]
    lower <- min(column, na.rm = TRUE)
    upper <- max(column, na.rm = TRUE)
    matrix_data[, col] <- if (isTRUE(all.equal(lower, upper))) 50 else (column - lower) / (upper - lower) * 100
  }
  matrix_rows <- lapply(seq_len(nrow(matrix_data)), function(i) as.numeric(round(matrix_data[i, ], 2)))
  list(labelsX = as.list(unname(labels_x)), labelsY = as.list(unname(labels_y)), data = matrix_rows)
}

ranking_items <- function(summary) {
  if (!length(summary)) {
    return(list())
  }
  items <- lapply(names(summary), function(policy) {
    list(
      label = short_policy(policy),
      value = summary[[policy]]$mean_cumulative_reward %||% 0,
      policy = policy
    )
  })
  items[order(vapply(items, function(item) item$value, numeric(1)), decreasing = TRUE)]
}

scenario_payload <- function(scenario_name, frame, cohort_frames) {
  canonical <- frame[frame$policy != oracle_policy, , drop = FALSE]
  combined_summary <- metric_summary(canonical)
  ranking <- ranking_items(combined_summary)
  cohorts <- list()
  dumbbells <- list()
  for (cohort_name in names(cohort_frames)) {
    subset <- cohort_frames[[cohort_name]][cohort_frames[[cohort_name]]$scenario == scenario_name, , drop = FALSE]
    if (!nrow(subset)) {
      next
    }
    subset_canonical <- subset[subset$policy != oracle_policy, , drop = FALSE]
    cohorts[[cohort_name]] <- list(
      runs = length(unique(subset_canonical$seed)),
      summary = metric_summary(subset_canonical),
      oracle_summary = oracle_summary(subset)
    )
  }
  for (policy in legacy_policies[seq_len(min(6L, length(legacy_policies)))]) {
    historical_gap <- cohorts$historical_90k$summary[[policy]]$mean_oracle_regret %||% 0
    stress_gap <- cohorts$stress_500k$summary[[policy]]$mean_oracle_regret %||% 0
    if (!identical(historical_gap, 0) || !identical(stress_gap, 0)) {
      dumbbells[[length(dumbbells) + 1L]] <- list(label = short_policy(policy), start = historical_gap, end = stress_gap)
    }
  }
  spec <- scenario_descriptions[[scenario_name]] %||% list(description = scenario_name, overrides = list())
  list(
    scenario = list(name = scenario_name, description = spec$description, overrides = spec$overrides),
    runs = length(unique(canonical$seed)),
    policies = legacy_policies,
    oracle_policy = oracle_policy,
    oracle_summary = oracle_summary(frame),
    summary = combined_summary,
    cohorts = cohorts,
    visuals = list(
      ranking = ranking[seq_len(min(6L, length(ranking)))],
      oracle_gap_dumbbell = dumbbells,
      metric_heatmap = heatmap_payload(canonical, vapply(ranking[seq_len(min(6L, length(ranking)))], function(item) item$policy, character(1))),
      reward_histogram = histogram_bins(canonical$cumulative_reward)
    ),
    paired_effects = paired_policy_effects(frame, oracle_policy, legacy_policies)
  )
}

policy_dossiers <- function(frame) {
  output <- list()
  for (policy in legacy_policies) {
    policy_frame <- frame[frame$policy == policy, , drop = FALSE]
    if (!nrow(policy_frame)) {
      next
    }
    cohort_items <- list()
    for (cohort_name in sort(unique(policy_frame$cohort))) {
      subset <- policy_frame[policy_frame$cohort == cohort_name, , drop = FALSE]
      cohort_items[[length(cohort_items) + 1L]] <- list(label = cohort_name, value = mean(subset$cumulative_reward, na.rm = TRUE))
    }
    gap_items <- list()
    for (scenario_name in sort(unique(frame$scenario))) {
      for_values <- function(cohort_name) {
        subset <- frame[frame$scenario == scenario_name & frame$cohort == cohort_name & frame$policy %in% c(policy, "ucb1"), , drop = FALSE]
        if (!nrow(subset)) {
          return(0)
        }
        policy_rows <- subset[subset$policy == policy, c("seed", "cumulative_reward"), drop = FALSE]
        ucb_rows <- subset[subset$policy == "ucb1", c("seed", "cumulative_reward"), drop = FALSE]
        names(policy_rows)[2] <- "policy_reward"
        names(ucb_rows)[2] <- "ucb_reward"
        merged <- merge(policy_rows, ucb_rows, by = "seed")
        if (!nrow(merged)) 0 else mean(merged$policy_reward - merged$ucb_reward)
      }
      historical_gap <- for_values("historical_90k")
      stress_gap <- for_values("stress_500k")
      if (historical_gap != 0 || stress_gap != 0) {
        gap_items[[length(gap_items) + 1L]] <- list(label = scenario_name, start = historical_gap, end = stress_gap)
      }
    }
    output[[policy]] <- list(
      policy = policy,
      summary = list(
        mean_cumulative_reward = mean(policy_frame$cumulative_reward, na.rm = TRUE),
        mean_oracle_regret = mean(policy_frame$oracle_regret, na.rm = TRUE),
        mean_population_hhi = mean(policy_frame$population_hhi, na.rm = TRUE),
        mean_final_extraction = mean(policy_frame$mean_final_extraction, na.rm = TRUE),
        scenario_count = length(unique(policy_frame$scenario))
      ),
      cohort_reward_items = cohort_items,
      distribution_bins = histogram_bins(policy_frame$cumulative_reward),
      heatmap = heatmap_payload(policy_frame, policy),
      scenario_gap_items = gap_items[seq_len(min(8L, length(gap_items)))],
      paired_vs_oracle = paired_policy_effects(frame, oracle_policy, policy)
    )
  }
  output
}

landing_payload <- function(cohort_frames, combined_frame) {
  breakdown <- list()
  for (cohort_name in names(cohort_specs)) {
    spec <- cohort_specs[[cohort_name]]
    frame <- cohort_frames[[cohort_name]]
    executions <- if (is.null(frame)) 0L else nrow(frame)
    config_count <- if (is.null(frame)) spec$config_count else length(unique(frame$seed))
    breakdown[[length(breakdown) + 1L]] <- list(
      cohort = cohort_name,
      label = gsub("_", " ", cohort_name),
      executions = executions,
      config_count = config_count,
      policy_count = length(spec$policies)
    )
  }
  legacy_summary <- metric_summary(cohort_frames$legacy_1m %||% data.frame())
  combined_summary <- metric_summary(combined_frame[combined_frame$policy != oracle_policy, , drop = FALSE])
  legacy_ranking <- ranking_items(legacy_summary)
  combined_ranking <- ranking_items(combined_summary)
  winners <- list()
  for (scenario_name in sort(unique(combined_frame$scenario))) {
    subset <- combined_frame[combined_frame$scenario == scenario_name & combined_frame$policy != oracle_policy, , drop = FALSE]
    if (!nrow(subset)) {
      next
    }
    means <- tapply(subset$cumulative_reward, subset$policy, mean, na.rm = TRUE)
    policy <- names(which.max(means))
    winners[[length(winners) + 1L]] <- list(label = scenario_name, value = unname(max(means)), color = policy)
  }
  list(
    generated_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
    headline_totals = list(legacy_1m = 1000008L, historical_90k = 90000L, stress_500k = 500000L, total = 1590008L),
    cohort_breakdown = breakdown,
    legacy_ranking = legacy_ranking[seq_len(min(6L, length(legacy_ranking)))],
    combined_ranking = combined_ranking[seq_len(min(6L, length(combined_ranking)))],
    scenario_heatmap = heatmap_payload(combined_frame[combined_frame$policy != oracle_policy, , drop = FALSE], vapply(combined_ranking[seq_len(min(6L, length(combined_ranking)))], function(item) item$policy, character(1))),
    scenario_winners = winners,
    paired_vs_ucb1 = paired_policy_effects(combined_frame, "ucb1", legacy_policies),
    paired_vs_oracle = paired_policy_effects(combined_frame, oracle_policy, legacy_policies)
  )
}

write_report <- function(payload) {
  landing <- payload$landing
  totals <- landing$headline_totals
  leader <- if (length(landing$combined_ranking)) landing$combined_ranking[[1L]] else list(policy = "n/a", value = 0)
  rows <- vapply(landing$cohort_breakdown, function(item) {
    sprintf("- `%s`: %s materialized rows, %s configs, %s policies",
      item$cohort,
      format(item$executions, big.mark = ",", scientific = FALSE),
      format(item$config_count, big.mark = ",", scientific = FALSE),
      item$policy_count
    )
  }, character(1))
  text <- c(
    "---",
    "tags: [report, evidence, synthesis]",
    "type: report",
    "date: 2026-04-13",
    "---",
    "",
    "# Combined Evidence Report",
    "",
    "This report reorganizes the archive around a three-cohort evidence program rather than a single undifferentiated sweep. The execution contract is",
    "",
    "$$",
    sprintf("N_{\\mathrm{total}}=1{,}000{,}008+90{,}000+500{,}000=%s.", format(totals$total, big.mark = ",", scientific = FALSE)),
    "$$",
    "",
    "The arithmetic is not the result. It is the indexing scheme that prevents one cohort from impersonating another.",
    "",
    "## Cohort Logic",
    "",
    "`legacy_1m` is the broad non-oracle baseline sweep. It supports policy ranking under the legacy design, but it is not scenario-resolved evidence. `historical_90k` is the canonical nine-scenario suite, reconstructed as $9 \\times 1{,}000 \\times 10$ executions. `stress_500k` is the adversarial extension: a trap-heavy, perturbed scenario program designed to push the model toward boomtown collapse, resource capture, primacy, and shock/reform edge cases.",
    "",
    "The combined frontend synthesis is therefore stratified. It can compare rankings across cohorts, but it should not pool incompatible estimands as if they were one experiment.",
    "",
    "## Materialization",
    "",
    rows,
    "",
    "The materialized rows above are read directly from the Rust Parquet outputs in `results/cohorts`. The headline count remains the planned and reproducible cohort contract; the materialization table records what is actually present on disk when the R synthesizer is run.",
    "",
    "## Estimand",
    "",
    "For matched comparisons the pipeline reports",
    "",
    "$$",
    "\\widehat{\\Delta}_{\\pi,\\pi'}=\\frac{1}{n}\\sum_{i=1}^{n}(R_{i,\\pi}-R_{i,\\pi'}),",
    "$$",
    "",
    "with a paired nonparametric bootstrap interval over the matched configuration index. No p-value is produced because the question is effect magnitude under a simulator design, not ritual rejection of a null whose assumptions would be false by construction.",
    "",
    "The scalar diagnostics remain",
    "",
    "$$",
    "\\mathrm{regret}_{\\pi}=R_{\\mathrm{oracle}}-R_{\\pi},\\qquad \\mathrm{HHI}=\\sum_i s_i^2,\\qquad \\hat\\zeta=\\text{Zipf slope}.",
    "$$",
    "",
    "Oracle-gap claims are emitted only for the scenario-backed cohorts. The legacy cohort may still carry an internally computed oracle baseline in the Rust runner, but the report treats it as baseline ranking evidence, not as scenario mechanism evidence.",
    "",
    "## Policy Reading",
    "",
    sprintf("The current scenario-backed leader is `%s` with mean cumulative reward %.2f. This statement is scoped to the historical and stress cohorts. The legacy million-row cohort remains baseline context rather than scenario evidence.", leader$policy, leader$value),
    "",
    "The main methodological pattern is temporal memory. Stationary optimism is useful as a diagnostic control, but the pathologies of the model are nonstationary: arms rot under extraction, shocks change institutional state, and agglomeration can turn a local advantage into a primacy trap. Forgetting, discounting, posterior variance, and spatial structure become different ways of refusing the fiction that yesterday's mean is still the environment.",
    "",
    "## Frontend Contract",
    "",
    "The frontend uses `web/content/source/results/cohort-synthesis.json` for the landing synthesis, `policy-dossiers.json` for policy pages, and `*-cohort.json` scenario files for route-level evidence. The comparison API no longer samples mock data. It reads checked-in cohort summaries and returns deterministic results.",
    "",
    "## Remaining Gap",
    "",
    "The simulator is still a reduced-form political economy, not a structural econometric estimate. Its academic contact points are explicit: resource curse and institutional economics for rent capture, urban economics for concentration and Zipf signatures, and bandit theory for regret and nonstationarity. The implementation matches that reality only where the cohort design gives it the right estimand. Where it does not, the frontend now says less.",
    "",
    "## Reading Order",
    "",
    "Read the landing page for cohort accounting, scenario pages for mechanism-rich institutional and spatial explanations, policy pages for cross-scenario dossiers, and `docs/next-steps.md` for the places where academic reality still outruns the implementation."
  )
  writeLines(text, report_path, useBytes = TRUE)
}

write_manifests <- function(cohort_frames = NULL) {
  for (cohort_name in names(cohort_specs)) {
    spec <- cohort_specs[[cohort_name]]
    frame <- if (is.null(cohort_frames)) read_cohort(cohort_name) else cohort_frames[[cohort_name]]
    parquet_path <- file.path(results_root, paste0(cohort_name, ".parquet"))
    part_paths <- list.files(file.path(results_root, cohort_name), pattern = "^part-.*\\.parquet$", full.names = FALSE)
    manifest <- list(
      cohort = cohort_name,
      description = spec$description,
      config_count = spec$config_count,
      execution_count = spec$executions,
      materialized_rows = if (is.null(frame)) 0L else nrow(frame),
      materialized_parts = if (length(part_paths)) length(part_paths) else as.integer(file.exists(parquet_path)),
      policies = spec$policies,
      policy_count = length(spec$policies),
      scenario_supported = spec$scenario_supported,
      oracle_supported = spec$oracle_supported,
      input_jsonl = file.path("results", "cohorts", paste0(cohort_name, "_configs.jsonl")),
      output_parquet = file.path("results", "cohorts", paste0(cohort_name, ".parquet")),
      output_parts = if (length(part_paths)) as.list(file.path("results", "cohorts", cohort_name, sort(part_paths))) else list()
    )
    write_json(manifest, file.path(manifest_root, paste0(cohort_name, ".manifest.json")), auto_unbox = TRUE, pretty = TRUE, null = "null", digits = NA)
    scenario_summary <- list()
    if (!is.null(frame) && spec$scenario_supported) {
      for (scenario_name in sort(unique(frame$scenario))) {
        subset <- frame[frame$scenario == scenario_name, , drop = FALSE]
        scenario_summary[[scenario_name]] <- list(
          rows = nrow(subset),
          config_count = length(unique(subset$seed)),
          policy_count = length(unique(subset$policy))
        )
      }
    }
    summary <- list(
      cohort = cohort_name,
      materialized_rows = if (is.null(frame)) 0L else nrow(frame),
      materialized_parts = manifest$materialized_parts,
      policy_summary = if (is.null(frame)) list() else metric_summary(frame),
      scenario_summary = scenario_summary
    )
    write_json(summary, file.path(manifest_root, paste0(cohort_name, ".summary.json")), auto_unbox = TRUE, pretty = TRUE, null = "null", na = "null", digits = NA)
  }
}

synthesize <- function() {
  cohort_frames <- list()
  for (cohort_name in names(cohort_specs)) {
    cohort_frames[[cohort_name]] <- read_cohort(cohort_name)
  }
  scenario_frames <- cohort_frames[c("historical_90k", "stress_500k")]
  scenario_frames <- scenario_frames[!vapply(scenario_frames, is.null, logical(1))]
  combined_frame <- if (length(scenario_frames)) do.call(rbind, scenario_frames) else data.frame()

  payload <- list(
    landing = landing_payload(cohort_frames, combined_frame),
    dossiers = if (nrow(combined_frame)) policy_dossiers(combined_frame) else list(),
    scenarios = list()
  )
  write_json(payload$landing, file.path(frontend_results_root, "cohort-synthesis.json"), auto_unbox = TRUE, pretty = TRUE, null = "null", na = "null", digits = NA)
  write_json(payload$dossiers, file.path(frontend_results_root, "policy-dossiers.json"), auto_unbox = TRUE, pretty = TRUE, null = "null", na = "null", digits = NA)

  if (nrow(combined_frame)) {
    cohort_sources <- scenario_frames
    for (scenario_name in sort(unique(combined_frame$scenario))) {
      scenario_frame <- combined_frame[combined_frame$scenario == scenario_name, , drop = FALSE]
      scenario_doc <- scenario_payload(scenario_name, scenario_frame, cohort_sources)
      payload$scenarios[[scenario_name]] <- scenario_doc
      write_json(scenario_doc, file.path(frontend_results_root, paste0(scenario_name, "-cohort.json")), auto_unbox = TRUE, pretty = TRUE, null = "null", na = "null", digits = NA)
    }
  }
  write_report(payload)
  write_manifests(cohort_frames)
  print(toJSON(payload$landing$headline_totals, auto_unbox = TRUE, pretty = TRUE))
}

args <- commandArgs(trailingOnly = TRUE)
command <- if (length(args)) args[[1L]] else "synthesize"

if (command == "synthesize") {
  synthesize()
} else if (command == "manifests") {
  write_manifests()
} else {
  stop(sprintf("Unknown command: %s", command))
}
