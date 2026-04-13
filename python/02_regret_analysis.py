import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from typing import Optional

def compute_regret(df: pd.DataFrame, oracle_policy: str = 'myopic-oracle') -> pd.DataFrame:
    """Compute empirical regret relative to the best observed reward per seed/scenario."""
    if 'cumulative_reward' not in df.columns:
        raise ValueError("DataFrame must contain 'cumulative_reward' column")

    if {'empirical_best_reward', 'empirical_regret'}.issubset(df.columns):
        regret_df = df.copy()
        regret_df['regret'] = regret_df['empirical_regret']
        regret_df['regret_baseline'] = regret_df['empirical_best_reward']
    elif {'oracle_reward', 'oracle_regret'}.issubset(df.columns):
        regret_df = df.copy()
        regret_df['regret'] = regret_df['oracle_regret']
        regret_df['regret_baseline'] = regret_df['oracle_reward']
    else:
        oracle_df = df.groupby(['seed', 'scenario'])['cumulative_reward'].max().reset_index()
        oracle_df.rename(columns={'cumulative_reward': 'regret_baseline'}, inplace=True)
        regret_df = pd.merge(df, oracle_df, on=['seed', 'scenario'], how='left')
        regret_df['regret'] = regret_df['regret_baseline'] - regret_df['cumulative_reward']
    
    # Avoid division by zero
    mask = regret_df['regret_baseline'] > 0
    regret_df.loc[mask, 'normalized_regret'] = regret_df.loc[mask, 'regret'] / regret_df.loc[mask, 'regret_baseline']
    
    return regret_df

def summarize_policy_rankings(regret_df: pd.DataFrame) -> pd.DataFrame:
    """Compute mean regret, average rank, and win rate per policy."""
    # Compute dense rank descending (1 is highest reward)
    regret_df['rank'] = regret_df.groupby(['seed', 'scenario'])['cumulative_reward'].rank(method='min', ascending=False)
    
    # Summarize
    summary = regret_df.groupby(['scenario', 'policy']).agg(
        mean_reward=('cumulative_reward', 'mean'),
        mean_regret=('regret', 'mean'),
        sd_regret=('regret', 'std'),
        mean_rank=('rank', 'mean'),
        win_rate=('rank', lambda x: (x == 1).mean())
    ).reset_index()
    
    return summary.sort_values(by=['scenario', 'mean_rank'])

def plot_regret_distribution(regret_df: pd.DataFrame) -> None:
    """Plot boxplots of regret per policy across scenarios."""
    plt.figure(figsize=(12, 8))
    
    # Order policies by median regret
    order = regret_df.groupby('policy')['regret'].median().sort_values().index
    
    sns.boxplot(
        data=regret_df, 
        x='policy', 
        y='regret', 
        hue='policy',
        order=order
    )
    
    # Create grid of subplots for each scenario (using catplot)
    g = sns.catplot(
        data=regret_df,
        x='policy',
        y='regret',
        hue='policy',
        col='scenario',
        kind='box',
        order=order,
        col_wrap=3,
        sharey=False,
        height=5,
        aspect=1.2
    )
    
    g.set_xticklabels(rotation=45, ha='right')
    g.set_axis_labels("Policy", "Empirical Regret (Best Observed - Policy Reward)")
    g.fig.suptitle("Regret Distribution by Policy and Scenario", y=1.05)
    
    return g.fig
