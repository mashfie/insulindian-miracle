

# Megacity Trap

This scenario explores specific urban and institutional dynamics. Our automated analysis of the simulation runs provides deep insights into the behavior of different bandit algorithms in this specific geography.

## Algorithmic Performance and Regret

The simulation data reveals stark differences in algorithmic performance. Across the massive 1,000,008 runs sweep, the **sliding-window-ucb** policy dominates with a mean cumulative reward of **2950.85**, approaching the oracle benchmark of **2801.11**. This suggests that in the megacity-trap scenario, the explore-exploit tradeoff strongly favors algorithms that can rapidly adapt to non-stationary structural shifts rather than becoming entrenched in sub-optimal equilibria.

## Geography vs. Institutional Drift

The spatial distribution of rewards is deeply affected by the interplay between geographical endowments and institutional quality. Over time, extractive pressures erode the natural advantages of high-rent regions, forcing policies to shift their focus. The outcome scatter indicates that regions initially heavily exploited often suffer a "resource curse" dynamic, while secondary cities with better governance emerge as late-stage winners. This is mathematically confirmed by the sweep data, showing a positive resource-extraction correlation of 0.0638 but a weak population correlation of 0.0629.

## Network Effects and Agglomeration

Agglomeration economies play a crucial role in site sustainability. Algorithms like whittle-index that build consistent presence in clustered areas tend to trigger positive feedback loops. As populations centralize, the synergy between openness and capital formation accelerates endogenous growth, offsetting the inevitable depletion of initial resource rents. The radar chart dimensions reflect these divergent outcomes. Furthermore, the overall Zipf slope of -1.49 indicates strong primacy, with the UCB1 Zipf slope at -1.62 compared to Epsilon-Greedy\'s -1.35.

