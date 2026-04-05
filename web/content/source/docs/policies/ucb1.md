

# Ucb1

## Theoretical Foundation

This algorithmic approach addresses the fundamental explore-exploit dilemma within the context of a Restless Multi-Armed Bandit (RMAB). In environments characterized by structural drift and endogenous state transitions, static algorithms inevitably accrue linear regret. The ucb1 policy attempts to bound this regret by incorporating sophisticated exploration heuristics that adapt to changing reward distributions over time.

## Simulation Performance

Across our experimental scenarios, this policy exhibits distinct performance characteristics. Its variance in early epochs reflects the necessary cost of acquiring information about the underlying geographical and institutional landscape. As the simulation horizon extends, we observe a sharp convergence in its belief state, allowing it to efficiently track shifting optima—such as the emergence of secondary boomtowns or the collapse of resource-cursed primary sites.

## Sensitivity and Calibration

The efficacy of this algorithm is highly sensitive to its hyperparameters. In high-volatility environments (like the shock-reform scenario), aggressive exploration parameters yield significant dividends by preventing the algorithm from locking into decaying local optima. However, in stable environments with strong agglomeration effects, excessive exploration incurs unnecessary regret. The distribution of rewards highlights the algorithm's robustness against extreme downside outcomes.

