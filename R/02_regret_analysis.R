#' 02_regret_analysis.R
#' Functions to compute policy regret, ranking flips, and distributional behavior over sweeps.

library(dplyr)
library(tidyr)
library(ggplot2)

source("01_load_data.R")

#' Compute Empirical Regret
#'
#' For each seed and scenario, compute regret relative to the best observed reward.
#'
#' @param df Dataframe from load_parquet_results or load_compare_json
#' @param oracle_policy The name of the oracle policy.
#' @return Dataframe with computed regret columns.
compute_regret <- function(df, oracle_policy = "myopic-oracle") {

  if (all(c("empirical_best_reward", "empirical_regret") %in% names(df))) {
    regret_df <- df |>
      mutate(
        regret = empirical_regret,
        regret_baseline = empirical_best_reward,
        normalized_regret = ifelse(regret_baseline > 0, regret / regret_baseline, NA)
      )
  } else if (all(c("oracle_reward", "oracle_regret") %in% names(df))) {
    regret_df <- df |>
      mutate(
        regret = oracle_regret,
        regret_baseline = oracle_reward,
        normalized_regret = ifelse(regret_baseline > 0, regret / regret_baseline, NA)
      )
  } else {
    oracle_df <- df |>
      group_by(seed, scenario) |>
      summarize(regret_baseline = max(cumulative_reward, na.rm = TRUE), .groups = "drop")

    regret_df <- df |>
      left_join(oracle_df, by = c("seed", "scenario")) |>
      mutate(
        regret = regret_baseline - cumulative_reward,
        normalized_regret = ifelse(regret_baseline > 0, regret / regret_baseline, NA)
      )
  }

  return(regret_df)
}

#' Summarize Policy Rankings
#'
#' @param regret_df Dataframe with computed regret
#' @return Summary statistics showing mean regret and average ranking of policies
summarize_policy_rankings <- function(regret_df) {
  
  # Compute rankings per seed
  ranked_df <- regret_df |>
    group_by(seed, scenario) |>
    mutate(rank = rank(-cumulative_reward, ties.method = "min")) |>
    ungroup()
  
  # Aggregate stats
  summary_stats <- ranked_df |>
    group_by(scenario, policy) |>
    summarize(
      mean_reward = mean(cumulative_reward, na.rm = TRUE),
      mean_regret = mean(regret, na.rm = TRUE),
      sd_regret = sd(regret, na.rm = TRUE),
      mean_rank = mean(rank, na.rm = TRUE),
      win_rate = mean(rank == 1, na.rm = TRUE),
      .groups = "drop"
    ) |>
    arrange(scenario, mean_rank)
  
  return(summary_stats)
}

#' Plot Regret Distribution
#'
#' @param regret_df Dataframe with regret
#' @return ggplot object showing boxplots of regret per policy
plot_regret_distribution <- function(regret_df) {
  p <- ggplot(regret_df, aes(x = reorder(policy, regret, FUN = median), y = regret, fill = policy)) +
    geom_boxplot(outlier.alpha = 0.5) +
    facet_wrap(~ scenario, scales = "free_y") +
    theme_minimal() +
    labs(
      title = "Regret Distribution by Policy and Scenario",
      x = "Policy",
      y = "Empirical Regret (Best Observed - Policy Reward)"
    ) +
    theme(axis.text.x = element_text(angle = 45, hjust = 1), legend.position = "none")
  
  return(p)
}

# Example Usage:
# df <- load_compare_json("../results/my_compare_output.json")
# regret_df <- compute_regret(df)
# stats <- summarize_policy_rankings(regret_df)
# print(stats)
# p <- plot_regret_distribution(regret_df)
# ggsave("regret_plot.png", p, width=10, height=6)
