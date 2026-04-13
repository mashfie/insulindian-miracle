import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Optional

def plot_policy_phase_map(
    df: pd.DataFrame, 
    x_var: str, 
    y_var: str, 
    z_var: str = 'cumulative_reward', 
    grid_resolution: Optional[int] = None
) -> None:
    """Create a phase map showing the dominant policy across parameter sweeps."""
    df_map = df.dropna(subset=[x_var, y_var, z_var, 'policy']).copy()
    
    if grid_resolution is not None:
        # Bin continuous parameters
        df_map[x_var] = pd.cut(df_map[x_var], bins=grid_resolution, labels=False)
        df_map[y_var] = pd.cut(df_map[y_var], bins=grid_resolution, labels=False)
        
    # Group by parameters and policy to find average reward
    grouped = df_map.groupby([x_var, y_var, 'policy'], observed=True)[z_var].mean().reset_index()
    
    # Find winning policy for each coordinate
    idx = grouped.groupby([x_var, y_var])[z_var].idxmax()
    winners = grouped.loc[idx].copy()
    
    # Pivot for heatmap
    heatmap_data = winners.pivot(index=y_var, columns=x_var, values='policy')
    
    plt.figure(figsize=(10, 8))
    
    # Map policies to colors manually since seaborn heatmap doesn't handle categoricals easily
    policies = sorted(df_map['policy'].unique())
    n_colors = len(policies)
    cmap = sns.color_palette("plasma", n_colors)
    color_dict = {p: i for i, p in enumerate(policies)}
    
    # Convert policy names to integers
    num_data = heatmap_data.replace(color_dict)
    
    ax = sns.heatmap(
        num_data, 
        cmap=cmap, 
        cbar_kws={'ticks': range(n_colors)}
    )
    
    # Format colorbar labels
    colorbar = ax.collections[0].colorbar
    colorbar.set_ticklabels(policies)
    colorbar.set_label('Winning Policy')
    
    plt.title(f"Phase Map: Dominant Policy by {x_var} and {y_var}")
    ax.invert_yaxis()  # Standard orientation for y-axis
    
    return plt.gcf()

def plot_outcome_heatmap(df: pd.DataFrame, x_var: str, y_var: str, z_var: str = 'population_gini') -> None:
    """Create a heatmap of a continuous outcome variable across a parameter space."""
    summary_df = df.groupby([x_var, y_var], observed=True)[z_var].mean().reset_index()
    
    heatmap_data = summary_df.pivot(index=y_var, columns=x_var, values=z_var)
    
    plt.figure(figsize=(10, 8))
    ax = sns.heatmap(heatmap_data, cmap='viridis')
    ax.invert_yaxis()
    
    plt.title(f"Heatmap of {z_var}")
    plt.xlabel(x_var)
    plt.ylabel(y_var)
    
    return plt.gcf()
