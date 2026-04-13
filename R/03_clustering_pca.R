#' 03_clustering_pca.R
#' Functions to perform PCA and clustering of parameter-to-outcome structures.

library(dplyr)
library(tidyr)
library(ggplot2)
library(factoextra)
library(cluster)

source("01_load_data.R")

#' Prepare DataFrame for PCA and Clustering
#'
#' @param df Dataframe from load_parquet_results
#' @param features Character vector of columns to include in PCA/Clustering
#' @param group_vars Variables to group by if averaging is required (e.g., scenario, seed)
#' @return A scaled numeric matrix ready for analysis, with attributes containing metadata.
prepare_for_unsupervised <- function(df, features, group_vars = c("scenario", "seed", "policy")) {
  
  # Ensure complete cases for features
  df_clean <- df |> drop_na(all_of(features))
  
  # Extract numeric features
  feature_data <- df_clean |> select(all_of(features))
  
  # Standardize features
  scaled_data <- scale(feature_data)
  
  # Attach metadata
  attr(scaled_data, "metadata") <- df_clean |> select(all_of(group_vars))
  
  return(scaled_data)
}

#' Perform PCA
#'
#' @param scaled_data Numeric matrix from prepare_for_unsupervised
#' @return A list containing the PCA result and a data frame with coordinates and metadata
run_pca_analysis <- function(scaled_data) {
  pca_res <- prcomp(scaled_data, center = FALSE, scale. = FALSE) # Data is already scaled
  
  # Extract components and combine with metadata
  metadata <- attr(scaled_data, "metadata")
  pca_coords <- as.data.frame(pca_res$x)
  
  plot_data <- bind_cols(metadata, pca_coords)
  
  return(list(
    model = pca_res,
    data = plot_data,
    variance = (pca_res$sdev^2) / sum(pca_res$sdev^2)
  ))
}

#' Plot PCA Results
#'
#' @param pca_result Output of run_pca_analysis
#' @param color_by Variable name in metadata to color points by (e.g., "policy" or "scenario")
#' @return A ggplot object
plot_pca <- function(pca_result, color_by = "scenario") {
  
  var_explained <- round(pca_result$variance * 100, 1)
  
  p <- ggplot(pca_result$data, aes(x = PC1, y = PC2, color = .data[[color_by]])) +
    geom_point(alpha = 0.6) +
    theme_minimal() +
    labs(
      title = paste("PCA of Simulation Outcomes (Colored by", color_by, ")"),
      x = paste0("PC1 (", var_explained[1], "%)"),
      y = paste0("PC2 (", var_explained[2], "%)")
    )
  
  return(p)
}

#' Perform K-Means Clustering
#'
#' @param scaled_data Numeric matrix from prepare_for_unsupervised
#' @param k Number of clusters
#' @return A list with the kmeans model and the data with cluster assignments
run_kmeans_clustering <- function(scaled_data, k = 4) {
  set.seed(42) # For reproducibility
  km_res <- kmeans(scaled_data, centers = k, nstart = 25)
  
  metadata <- attr(scaled_data, "metadata")
  cluster_data <- bind_cols(metadata, Cluster = as.factor(km_res$cluster))
  
  return(list(
    model = km_res,
    data = cluster_data
  ))
}

# Example Usage:
# features_to_analyze <- c("cumulative_reward", "mean_final_extraction", 
#                          "mean_final_openness", "population_gini", "zipf_slope")
# scaled_data <- prepare_for_unsupervised(df_clean, features_to_analyze)
# pca_res <- run_pca_analysis(scaled_data)
# p_pca <- plot_pca(pca_res, color_by = "policy")
# ggsave("pca_plot.png", p_pca)
# km_res <- run_kmeans_clustering(scaled_data, k = 3)
