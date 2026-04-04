---
tags: [theory, economics, institutions]
type: theory
related:
  - "[[resource-curse]]"
  - "[[institutional-dynamics]]"
  - "[[reward-function]]"
  - "[[botswana]]"
---

# Institutional Economics

The study of how formal and informal rules — property rights, legal frameworks, norms of governance — shape economic outcomes. Institutional quality is the central mediating variable in this simulation.

## Extractive vs Inclusive Institutions

Acemoglu & Robinson (2012), *Why Nations Fail*, distinguish two institutional regimes:

- **Extractive institutions** concentrate power and wealth in a narrow elite. Property rights are weak, markets are restricted, and rents flow to incumbents. Short-run growth is possible (the Soviet Union industrialised under extractive institutions) but long-run innovation is suppressed.
- **Inclusive institutions** distribute power broadly, enforce property rights, allow creative destruction, and invest in public goods. They enable sustained growth through innovation and capital accumulation.

[Acemoglu, Johnson & Robinson (2001)](https://www.jstor.org/stable/2677930) provided the empirical foundation, using colonial settler mortality as an instrument for institutional quality. They showed that institutions — not geography, not culture — are the primary determinant of cross-country income differences. Their IV estimate implies that a one-standard-deviation improvement in institutional quality raises log per-capita income by roughly 1.0.

The critical insight is **path dependence**: once extractive institutions form, they create self-reinforcing feedback loops. Elites benefit from the status quo and resist reform. Reform requires a **critical juncture** — a crisis, external shock, or sufficiently large coalition of reformers.

## Model Representation

Each settlement site carries an `InstitutionState` with three continuous dimensions:

| Dimension | Range | Meaning |
|-----------|-------|---------|
| `extraction` | $[0, 1]$ | Share of surplus captured by elites |
| `openness` | $[0, 1]$ | Degree of trade, migration, knowledge diffusion |
| `adaptability` | $[0, 1]$ | Institutional capacity to reform under pressure |

These are initialised from Beta distributions (see [[configuration]]) and evolve endogenously through the [[institutional-dynamics]] system. The Beta parameterisation allows control over both the mean and variance of initial institutional quality:

$$
e_0 \sim \text{Beta}(\alpha_e, \beta_e), \quad o_0 \sim \text{Beta}(\alpha_o, \beta_o), \quad a_0 \sim \text{Beta}(\alpha_a, \beta_a)
$$

> [!note] Path dependence in the model
> High extraction $\to$ high short-term reward $\to$ no crisis pressure $\to$ no reform $\to$ extraction drifts higher. This is the self-reinforcing loop that Acemoglu & Robinson describe. The only escape is an exogenous shock (see [[shock-reform]]) or sufficient `adaptability` to trigger reform even under moderate pressure. In the baseline scenario, this loop is weak — openness converges to 1.000 and extraction approaches 0 for all policies, confirming that reforms succeed when initial institutions are reasonable.

## Connection to Geography

Institutional quality interacts with geography through the [[reward-function]]:

- **Inclusive growth** scales with $(1 - e) \cdot p^\alpha \cdot (1 + \phi \cdot k)$ — only sites with low extraction $e$ benefit from agglomeration economies (population $p$, capital $k$, exponents $\alpha$ and $\phi$)
- **Network spillovers** scale with openness $o$ — closed institutions cannot benefit from trade with neighbours:

$$
\text{spillover}_i = o_i \cdot \sum_{j \in \mathcal{N}(i)} w_{ij} \cdot (1 + \delta \cdot d_j)
$$

where $\mathcal{N}(i)$ is the set of neighbouring sites, $w_{ij}$ is the connectivity weight, and $d_j$ is population density at site $j$.

- **Capital accumulation** is eroded by $\kappa \cdot e$ where $\kappa$ is `extractive_capital_erosion` — extractive elites consume rather than invest

This creates a divergence: initially similar sites can end up on radically different trajectories depending on their institutional path. Sites with good initial institutions (high openness, high adaptability, low extraction) compound advantages over time, while resource-rich sites with poor institutions enter the [[resource-curse]] trap. In the Botswana scenario, extraction stays at 0.002 throughout the simulation; in the resource-curse scenario, it climbs to 0.09–0.21.

## Critical Junctures and Reform

The simulation models reform as a stochastic process gated by `adaptability` and `crisis_pressure`:

$$
P(\text{reform}) = a \cdot \sigma\!\left(-\Delta r \cdot s + b_{\text{shock}} + b_{\text{neighbor}}\right)
$$

where $a$ is adaptability, $\sigma$ is the logistic sigmoid, $\Delta r$ is the change in reward, $s$ is reform sensitivity, and $b_{\text{shock}}$, $b_{\text{neighbor}}$ are bonus terms from exogenous shocks and neighbour reform spillovers.

Reform reduces extraction by `reform_step` (default 0.18) and increases openness by 0.08. It has a cooldown (`reform_duration` = 5 steps) and an ongoing cost (`reform_cost` = 0.2 per step during reform).

This captures the idea that institutional change is costly, uncertain, and requires both the capacity for reform (adaptability) and the motivation (declining performance). The sigmoid structure means that small declines produce little reform pressure, but sharp downturns dramatically increase the probability — matching the empirical pattern of crisis-driven reform identified by [Acemoglu, Johnson & Robinson (2001)](https://www.jstor.org/stable/2677930).
