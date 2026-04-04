---
tags: [theory, hypotheses, experiments]
type: theory
related:
  - "[[analysis]]"
  - "[[resource-curse]]"
  - "[[institutional-economics]]"
  - "[[multi-armed-bandits]]"
---

# Hypotheses

The simulation is designed to test seven hypotheses about the interaction between resource endowments, institutional dynamics, and bandit algorithm performance.

## H1: Resource Curse Effect

> Resource-rich sites attract disproportionate early investment but end up with higher extraction and lower long-run population.

**Scenarios**: [[resource-curse-scenario]]

**Metrics**: `resource_extraction_correlation` (positive), `resource_population_correlation` (negative or weak), `top_resource_site_share` (declining over horizon)

**Theory**: The [[resource-curse]] channel — high initial reward from resources masks institutional decay until it becomes irreversible. Formalised by [Sachs & Warner (1995)](https://www.nber.org/papers/w5398) and conditioned on institutional quality by [Mehlum, Moene & Torvik (2006)](https://doi.org/10.1111/j.1468-0297.2006.01045.x).

**Experiment results**: In the resource-curse scenario, mean extraction across sites ranges from 0.09 to 0.21 — far above the baseline where extraction converges near 0. The extraction drift follows:

$$
e_{t+1} = e_t + \gamma \cdot r_t \cdot c_m \cdot (1 - e_t)
$$

with $\gamma = 0.13$ (vs 0.04 in baseline), confirming that higher curse strength produces measurably higher extraction lock-in.

## H2: Institutional Quality Matters

> Sites with better initial institutions (lower extraction, higher openness and adaptability) achieve higher long-run populations, even when resource-poor.

**Scenarios**: [[resource-curse-scenario]], [[botswana]]

**Metrics**: Compare `initial_extraction_population_correlation` (negative) across scenarios. Botswana should show higher mean reward and more reforms than resource-curse.

**Theory**: [[institutional-economics]] — inclusive institutions compound advantages through capital accumulation and network effects. The growth premium of inclusive institutions scales as $(1 - e) \cdot p^\alpha$, so the gap between $e = 0.002$ (Botswana) and $e = 0.15$ (resource-curse mean) compounds multiplicatively over the $T = 300$ step horizon. See Acemoglu & Robinson (2012), *Why Nations Fail*, and [Acemoglu, Johnson & Robinson (2001)](https://www.jstor.org/stable/2677930).

**Experiment results**: Botswana scenario maintains extraction at 0.002 and openness at 1.000 throughout. Resource-curse scenario sites reach extraction 0.09–0.21 and show lower terminal openness, confirming the institutional divergence prediction.

## H3: Network Effects and Openness

> Open, trade-oriented city clusters outperform isolated settlements, and the cluster premium increases with network scale.

**Scenarios**: [[baseline]], [[open-cluster]]

**Metrics**: `cluster_premium` (population gap between high-openness clustered sites and isolated sites), trade cluster treatment premium.

**Theory**: [[urban-economics]] — agglomeration economies are amplified by spatial proximity and institutional openness. [Krugman (1991)](https://doi.org/10.1086/261763) formalised this as circular causation: larger markets attract firms, which attract workers, which expand markets. The network spillover term in the reward function is:

$$
\text{spillover}_i = o_i \cdot \sum_{j \in \mathcal{N}(i)} w_{ij} \cdot (1 + \delta \cdot d_j)
$$

The cluster premium should be increasing in $o_i$ (openness) and $|\mathcal{N}(i)|$ (number of connected neighbours).

## H5: Algorithm Comparison

> Thompson Sampling and Whittle Index outperform UCB1 and epsilon-greedy in cumulative reward, especially in non-stationary scenarios.

**Scenarios**: All five hypothesis scenarios

**Metrics**: Pairwise `cumulative_reward` comparisons (Thompson vs UCB1, Whittle vs epsilon-greedy, etc.), `oracle_regret`.

**Theory**: [[multi-armed-bandits]] — Bayesian and restless-aware algorithms should handle non-stationarity better. [Russo et al. (2018)](https://arxiv.org/abs/1707.02038) show Thompson sampling achieves near-optimal Bayesian regret; [Whittle (1988)](https://doi.org/10.2307/3214163) provides the theoretical basis for index policies in restless problems. The advantage should be largest in [[resource-curse-scenario]] and [[ucb-bait]] where the trap is strongest.

**Experiment results**: The picture is more complex than the hypothesis predicts. In the resource-curse scenario, SW-UCB achieves 2357 cumulative reward — more than double the oracle's 1129 — while Whittle scores only 273 (worst). The Whittle index's forward-looking model overreacts to extraction signals in this regime. In the UCB-bait scenario, however, Whittle perfectly avoids the boomtown trap (0/280 boom selections) while UCB1 falls into it (12/18). Thompson sampling is consistently strong across scenarios, making only 1/18 boom selections — supporting the theoretical prediction of posterior-driven adaptation.

## H6: Zipf's Law Emergence

> At least one scenario produces a rank-size distribution approximating Zipf's law (slope $\approx -1.0$).

**Scenarios**: [[baseline]]

**Metrics**: `zipf_slope`, `population_gini`, rank-size curve shape.

**Theory**: [[urban-economics]] — Zipf's law is a robust empirical regularity. Zipf (1949), *Human Behavior and the Principle of Least Effort*, observed that city rank-size follows a power law $P(n) \propto n^{-\zeta}$ with $\zeta \approx 1$. The simulation tests whether this emerges from the interaction of agglomeration, congestion, and network effects, or requires specific parameter tuning.

**Experiment results**: UCB1 consistently produces Zipf slopes of $-1.6$ to $-2.8$, indicating excessive primacy — it concentrates population into a few dominant sites. Whittle and SW-UCB produce slopes of $-0.3$ to $-0.8$, closer to polycentricity. Neither end matches the Zipf ideal of $\zeta = 1$. The [Henderson (1974)](https://www.jstor.org/stable/1813316) equilibrium city-size model suggests that achieving $\zeta \approx 1$ requires a specific balance between the agglomeration exponent $\alpha$ and the congestion exponent $\beta$:

$$
n^* = \left(\frac{\alpha \cdot A}{\beta \cdot c}\right)^{\frac{1}{\beta - \alpha}}
$$

The simulation's current parameterisation ($\alpha = 0.52$, quadratic congestion) may not sit in the Zipf-consistent corridor.

## H7: UCB Bait Trap

> UCB1 is disproportionately attracted to the boomtown site and suffers the largest regret when it collapses.

**Scenarios**: [[ucb-bait]]

**Metrics**: `boomtown_selection_share` (UCB1 vs others), `boomtown_population_share`, `cumulative_reward` (UCB1 should be lowest).

**Theory**: [[explore-exploit-tradeoff]] — UCB's optimistic bonus makes it slow to abandon a declining arm because the confidence interval remains wide. The UCB1 selection rule:

$$
A_t = \arg\max_k \left[\hat{\mu}_k + \sqrt{\frac{2 \ln t}{n_k}}\right]
$$

inflates $\hat{\mu}_k$ with early high rewards from the boomtown, and the bonus $\sqrt{2 \ln t / n_k}$ shrinks as $n_k$ grows — so UCB1 keeps pulling the arm based on its inflated historical mean. Thompson sampling detects the decline faster through posterior updating, because each new low-reward observation shifts the posterior mean downward.

**Experiment results**: UCB1 makes 12/18 boom selections during the decay window — confirming the trap. Thompson sampling makes only 1/18. Whittle makes 0/280 total selections of the boomtown, demonstrating perfect avoidance. The results validate the hypothesis: UCB1's optimistic bias is a liability in non-stationary environments with decaying arms. See [Levine, Luo & Rusmevichientong (2017)](https://arxiv.org/abs/1702.07274) for theoretical analysis of "rotting bandits" where arm means decrease with pulls.

---

## Hypothesis-Scenario Matrix

| Hypothesis | baseline | resource-curse | botswana | open-cluster | ucb-bait |
|-----------|----------|---------------|----------|-------------|---------|
| H1 | | required | | | |
| H2 | | required | required | | |
| H3 | required | | | required | |
| H5 | required | required | required | required | required |
| H6 | required | | | | |
| H7 | | | | | required |

> [!note] H4 is omitted
> The original hypothesis set included H4 (shock-reform dynamics), but it was folded into the shock-reform scenario analysis rather than a standalone test.
