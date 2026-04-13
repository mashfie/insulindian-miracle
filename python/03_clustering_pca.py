import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from typing import List, Tuple, Dict, Any

def prepare_for_unsupervised(
    df: pd.DataFrame, 
    features: List[str], 
    group_vars: List[str] = ['scenario', 'seed', 'policy']
) -> Tuple[np.ndarray, pd.DataFrame]:
    """Standardize features and extract metadata for PCA/Clustering."""
    # Ensure complete cases for features
    df_clean = df.dropna(subset=features).copy()
    
    # Extract numeric features
    feature_data = df_clean[features].values
    
    # Standardize features
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(feature_data)
    
    # Extract metadata
    metadata = df_clean[group_vars].reset_index(drop=True)
    
    return scaled_data, metadata

def run_pca_analysis(scaled_data: np.ndarray, metadata: pd.DataFrame) -> Dict[str, Any]:
    """Perform PCA and attach metadata to the components."""
    pca = PCA()
    pca_res = pca.fit_transform(scaled_data)
    
    # Create DataFrame for PC coordinates
    pc_cols = [f'PC{i+1}' for i in range(pca_res.shape[1])]
    pca_df = pd.DataFrame(pca_res, columns=pc_cols)
    
    # Combine with metadata
    plot_data = pd.concat([metadata, pca_df], axis=1)
    
    return {
        'model': pca,
        'data': plot_data,
        'variance': pca.explained_variance_ratio_
    }

def plot_pca(pca_result: Dict[str, Any], color_by: str = 'scenario') -> None:
    """Plot the first two principal components."""
    data = pca_result['data']
    var_explained = np.round(pca_result['variance'] * 100, 1)
    
    plt.figure(figsize=(10, 8))
    sns.scatterplot(
        data=data,
        x='PC1',
        y='PC2',
        hue=color_by,
        alpha=0.6,
        palette='viridis'
    )
    
    plt.title(f"PCA of Simulation Outcomes (Colored by {color_by})")
    plt.xlabel(f"PC1 ({var_explained[0]}%)")
    plt.ylabel(f"PC2 ({var_explained[1]}%)")
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    
    return plt.gcf()

def run_kmeans_clustering(scaled_data: np.ndarray, metadata: pd.DataFrame, k: int = 4) -> Dict[str, Any]:
    """Perform K-Means clustering."""
    km = KMeans(n_clusters=k, random_state=42, n_init=25)
    clusters = km.fit_predict(scaled_data)
    
    # Combine with metadata
    cluster_data = metadata.copy()
    cluster_data['Cluster'] = clusters.astype(str)
    
    return {
        'model': km,
        'data': cluster_data
    }
