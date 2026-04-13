#' 04_phase_maps.R
#' Functions to generate phase transition maps from parameter sweeps.

library(dplyr)
library(ggplot2)
library(tidyr)

source("01_load_data.R")

#' Create Phase Map of Winning Policies
#'
#' @param df Dataframe from parameter sweeps containing multiple policies
#' @param x_var Character name of the parameter mapped to the x-axis
#' @param y_var Character name of the parameter mapped to the y-axis
#' @param z_var Variable defining success (defaults to "cumulative_reward")
#' @param grid_resolution Optional integer to bin continuous parameters into a grid
#' @return A ggplot object showing the policy that "wins" at each parameter coordinate.
plot_policy_phase_map <- function(df, x_var, y_var, z_var = "cumulative_reward", grid_resolution = NULL) {
  
  df_map <- df |>
    drop_na(all_of(c(x_var, y_var, z_var, "policy")))
  
  if (!is.null(grid_resolution)) {
    # Bin continuous parameters to create discrete tiles
    df_map <- df_map |>
      mutate(
        !!sym(x_var) := cut(!!sym(x_var), breaks = grid_resolution, labels = FALSE),
        !!sym(y_var) := cut(!!sym(y_var), breaks = grid_resolution, labels = FALSE)
      )
  }
  
  # Find the winning policy for each (x, y) coordinate
  winners <- df_map |>
    group_by(across(all_of(c(x_var, y_var, "policy")))) |>
    summarize(mean_score = mean(!!sym(z_var), na.rm = TRUE), .groups = "drop") |>
    group_by(across(all_of(c(x_var, y_var)))) |>
    slice_max(order_by = mean_score, n = 1, with_ties = FALSE) |>
    ungroup()
  
  p <- ggplot(winners, aes(x = .data[[x_var]], y = .data[[y_var]], fill = policy)) +
    geom_tile(color = "white") +
    theme_minimal() +
    labs(
      title = paste("Phase Map: Dominant Policy by", x_var, "and", y_var),
      x = x_var,
      y = y_var,
      fill = "Winning Policy"
    ) +
    scale_fill_viridis_d(option = "plasma")
  
  return(p)
}

#' Create Heatmap of Continuous Variable
#'
#' @param df Dataframe from load_parquet_results
#' @param x_var X-axis parameter
#' @param y_var Y-axis parameter
#' @param z_var Value to show in the heatmap (e.g., population_gini)
#' @return A ggplot heatmap
plot_outcome_heatmap <- function(df, x_var, y_var, z_var = "population_gini") {
  
  # Average z_var across seeds for each x, y combination
  summary_df <- df |>
    group_by(across(all_of(c(x_var, y_var)))) |>
    summarize(mean_val = mean(!!sym(z_var), na.rm = TRUE), .groups = "drop")
  
  p <- ggplot(summary_df, aes(x = .data[[x_var]], y = .data[[y_var]], fill = mean_val)) +
    geom_tile() +
    scale_fill_viridis_c() +
    theme_minimal() +
    labs(
      title = paste("Heatmap of", z_var),
      x = x_var,
      y = y_var,
      fill = paste("Mean", z_var)
    )
  
  return(p)
}

# Example Usage:
# df_sweep <- load_parquet_results("../results/sweeps/shock_intensity_vs_resource_abundance")
# p_phase <- plot_policy_phase_map(df_sweep, "shock_probability", "resource_rent_multiplier")
# ggsave("policy_phase_map.png", p_phase)
# p_heat <- plot_outcome_heatmap(df_sweep, "shock_probability", "resource_rent_multiplier", "population_gini")
