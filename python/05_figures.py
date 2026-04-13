import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

def set_publication_theme():
    """Apply standard publication styling to matplotlib/seaborn."""
    sns.set_theme(
        style="whitegrid",
        rc={
            "axes.labelsize": 12,
            "axes.titlesize": 14,
            "axes.titleweight": "bold",
            "axes.labelweight": "bold",
            "xtick.labelsize": 10,
            "ytick.labelsize": 10,
            "legend.fontsize": 11,
            "legend.title_fontsize": 12,
            "font.family": "sans-serif",
            "text.color": "#333333",
            "axes.labelcolor": "#333333",
            "xtick.color": "#555555",
            "ytick.color": "#555555",
            "grid.color": "#e5e5e5"
        }
    )

def plot_reward_vs_extraction(df: pd.DataFrame) -> None:
    """Plot Mean Final Extraction against Cumulative Reward."""
    set_publication_theme()
    
    # Calculate means and standard errors
    summary_df = df.groupby(['policy', 'scenario'], observed=True).agg(
        mean_reward=('cumulative_reward', 'mean'),
        mean_extraction=('mean_final_extraction', 'mean'),
        count=('cumulative_reward', 'count'),
        sd_reward=('cumulative_reward', 'std'),
        sd_extraction=('mean_final_extraction', 'std')
    ).reset_index()
    
    summary_df['se_reward'] = summary_df['sd_reward'] / np.sqrt(summary_df['count'])
    summary_df['se_extraction'] = summary_df['sd_extraction'] / np.sqrt(summary_df['count'])
    
    g = sns.FacetGrid(
        summary_df, 
        col='scenario', 
        col_wrap=3,
        height=5,
        aspect=1.2,
        sharex=False,
        sharey=False
    )
    
    def scatter_with_errorbars(x, y, xerr, yerr, hue, **kwargs):
        data = kwargs.pop("data")
        for policy in data[hue].unique():
            p_data = data[data[hue] == policy]
            plt.errorbar(
                p_data[x], p_data[y],
                xerr=1.96 * p_data[xerr],
                yerr=1.96 * p_data[yerr],
                fmt='o',
                markersize=8,
                alpha=0.8,
                label=policy,
                capsize=3
            )
            
    g.map_dataframe(
        scatter_with_errorbars,
        x='mean_extraction',
        y='mean_reward',
        xerr='se_extraction',
        yerr='se_reward',
        hue='policy'
    )
    
    g.add_legend(title="Policy")
    g.set_axis_labels("Mean Final Extraction Rate", "Cumulative Reward")
    g.fig.suptitle("Policy Performance: Reward vs Extraction\nMeans with 95% Confidence Intervals", y=1.05)
    
    return g.fig

def plot_gini_distributions(df: pd.DataFrame) -> None:
    """Plot boxplots of Population Gini Coefficient."""
    set_publication_theme()
    plt.figure(figsize=(12, 8))
    
    order = df.groupby('policy', observed=True)['population_gini'].median().sort_values().index
    
    g = sns.catplot(
        data=df,
        x='policy',
        y='population_gini',
        hue='policy',
        col='scenario',
        kind='box',
        order=order,
        col_wrap=3,
        sharey=False,
        height=5,
        aspect=1.2,
        boxprops={'alpha': 0.7}
    )
    
    g.set_xticklabels(rotation=45, ha='right')
    g.set_axis_labels("Policy", "Population Gini Index")
    g.fig.suptitle("Population Gini Coefficient by Policy", y=1.05)
    
    return g.fig

def generate_all_figures(df: pd.DataFrame, output_dir: str = "results/figures") -> None:
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        
    fig1 = plot_reward_vs_extraction(df)
    fig1.savefig(os.path.join(output_dir, "reward_vs_extraction_py.png"), bbox_inches='tight', dpi=300)
    plt.close(fig1)
    
    fig2 = plot_gini_distributions(df)
    fig2.savefig(os.path.join(output_dir, "gini_distributions_py.png"), bbox_inches='tight', dpi=300)
    plt.close(fig2)
    
    print(f"Figures saved to {output_dir}")
