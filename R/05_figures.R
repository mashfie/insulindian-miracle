#' 05_figures.R
#' Functions to generate publication-grade figures.

library(ggplot2)
library(dplyr)

source("01_load_data.R")

# Custom theme for publication figures
theme_publication <- function() {
  theme_minimal(base_size = 14) +
    theme(
      text = element_text(family = "sans", color = "#333333"),
      plot.title = element_text(face = "bold", size = rel(1.2), margin = margin(b = 15)),
      plot.subtitle = element_text(size = rel(1), margin = margin(b = 10)),
      axis.title = element_text(face = "bold", margin = margin(t = 10, r = 10)),
      axis.text = element_text(color = "#555555"),
      panel.grid.major = element_line(color = "#e5e5e5"),
      panel.grid.minor = element_blank(),
      legend.position = "bottom",
      legend.title = element_text(face = "bold"),
      strip.text = element_text(face = "bold", size = rel(1.1))
    )
}

#' Plot Reward vs Extraction Scatter
#' 
#' @param df Preprocessed dataframe from simulation outputs
#' @return ggplot object
plot_reward_vs_extraction <- function(df) {
  
  # Calculate mean scores per policy
  summary_df <- df |>
    group_by(policy, scenario) |>
    summarize(
      mean_reward = mean(cumulative_reward, na.rm = TRUE),
      mean_extraction = mean(mean_final_extraction, na.rm = TRUE),
      se_reward = sd(cumulative_reward, na.rm = TRUE) / sqrt(n()),
      se_extraction = sd(mean_final_extraction, na.rm = TRUE) / sqrt(n()),
      .groups = "drop"
    )
  
  p <- ggplot(summary_df, aes(x = mean_extraction, y = mean_reward, color = policy)) +
    geom_point(size = 4, alpha = 0.8) +
    geom_errorbar(aes(ymin = mean_reward - 1.96*se_reward, ymax = mean_reward + 1.96*se_reward), width = 0.01, alpha = 0.5) +
    geom_errorbarh(aes(xmin = mean_extraction - 1.96*se_extraction, xmax = mean_extraction + 1.96*se_extraction), height = 0.01, alpha = 0.5) +
    facet_wrap(~ scenario, scales = "free") +
    theme_publication() +
    labs(
      title = "Policy Performance: Reward vs Extraction",
      subtitle = "Means with 95% Confidence Intervals",
      x = "Mean Final Extraction Rate",
      y = "Cumulative Reward",
      color = "Policy"
    ) +
    scale_color_viridis_d()
  
  return(p)
}

#' Plot Gini Coefficient Distributions
#' 
#' @param df Preprocessed dataframe from simulation outputs
#' @return ggplot object
plot_gini_distributions <- function(df) {
  p <- ggplot(df, aes(x = reorder(policy, population_gini, FUN = median), y = population_gini, fill = policy)) +
    geom_boxplot(outlier.alpha = 0.4, alpha = 0.7) +
    facet_wrap(~ scenario) +
    theme_publication() +
    theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
    labs(
      title = "Population Gini Coefficient by Policy",
      subtitle = "Distribution across simulated random seeds",
      x = "Policy",
      y = "Population Gini Index",
      fill = "Policy"
    ) +
    scale_fill_viridis_d()
  
  return(p)
}

#' Generate All Standard Figures
#' 
#' @param df Preprocessed dataframe
#' @param output_dir Directory to save the PNGs
generate_all_figures <- function(df, output_dir = "results/figures") {
  if (!dir.exists(output_dir)) {
    dir.create(output_dir, recursive = TRUE)
  }
  
  p1 <- plot_reward_vs_extraction(df)
  ggsave(file.path(output_dir, "reward_vs_extraction.png"), p1, width = 12, height = 8, dpi = 300)
  
  p2 <- plot_gini_distributions(df)
  ggsave(file.path(output_dir, "gini_distributions.png"), p2, width = 12, height = 8, dpi = 300)
  
  message("Figures saved to ", output_dir)
}

# Example Usage:
# df <- load_parquet_results("../results/low")
# df_clean <- preprocess_results(df)
# generate_all_figures(df_clean)
