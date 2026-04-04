---
tags: [scenario, urban, polycentric]
type: scenario
related:
  - "[[urban-economics]]"
  - "[[megacity-trap]]"
  - "[[scenarios]]"
  - "[[hypotheses]]"
---

# Balanced Urban System

Several midsize cities prosper together, producing a more stable hierarchy than either the baseline or a primate-city regime.

## Historical Context

Germany's urban system is the structural antithesis of the primate city. No single German city dominates: Berlin (3.7 million), Hamburg (1.9 million), Munich (1.5 million), Cologne (1.1 million), and Frankfurt (750,000) share national economic functions across a polycentric network. This distribution is not accidental — it is the product of centuries of political fragmentation. The Holy Roman Empire's mosaic of independent principalities, free cities, and ecclesiastical territories meant that no single capital could concentrate the administrative, financial, and cultural functions that Paris absorbed in France or London in England. [Ioannides & Overman (2003)](https://doi.org/10.1016/S0166-0462(03)00025-8) showed that Germany's city-size distribution is among the most log-normal in the OECD — closely approximating the theoretical Zipf distribution with a slope near $-1.0$, the signature of a balanced urban system.

The economic consequences of polycentrism are substantial. [Meijers & Burger (2010)](https://doi.org/10.1177/0042098009360687) demonstrated that polycentric urban regions generate "borrowed size" effects — smaller cities in a well-connected network achieve agglomeration benefits typically available only to larger cities. The Ruhr conurbation exemplifies this: Essen, Dortmund, Duisburg, and Bochum individually rank as mid-sized cities, but their functional integration through transport infrastructure and supply chain linkages produces an effective metropolitan economy comparable to a single city of 5 million. The Mittelstand — Germany's ecosystem of specialised mid-sized manufacturers — is itself a product of polycentric geography: firms cluster in secondary cities where they face lower rents and less labour market competition, while accessing the broader national market through efficient logistics networks.

[Henderson (2003)](https://doi.org/10.1016/S1574-0080(04)80006-3) formalised the welfare implications: there exists an optimal degree of urban concentration for each country, determined by the balance between agglomeration economies (which favour concentration) and congestion costs (which penalise it). Countries below the optimal concentration level sacrifice agglomeration benefits; countries above it suffer congestion losses. Germany sits near the optimum. Henderson estimated that the most concentrated developing economies forfeit 1–2% of GDP annually through excessive primacy — a loss that compounds over decades and that Germany's polycentric structure systematically avoids.

The German model also demonstrates institutional resilience. When a single sector or city suffers a shock — the deindustrialisation of the Ruhr in the 1960s–70s, the integration of East German cities after reunification — the polycentric system absorbs it without national-level crisis. No single city's decline is existential. This built-in redundancy is absent in primate city systems, where the capital's problems become the nation's problems.

## Model Mapping

The scenario encodes Germany's polycentric advantage through a strong secondary city bonus ($1.22$, vs baseline $0.75$) with a wide spread ($1.08$) that rewards mid-sized settlements generously. The bonus peaks at a population target of $14$ — smaller than the baseline target of $16$ — encoding the observation that German prosperity resides in mid-sized cities, not the largest ones. Overstretch penalties are mild (threshold $28$, penalty $0.02$), reflecting the lower congestion costs of distributed urban systems.

Network effects are moderately strong ($\gamma_{\text{net}} = 0.50$, $\gamma_{\text{dens}} = 0.84$), creating inter-city spillovers without the extreme network dependence of the [[merchant-republic]] or [[open-cluster]] scenarios. This encodes the German pattern: cities benefit from connections but are not existentially dependent on them.

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 360 | Extended horizon |
| `secondary_city_bonus` | 0.75 | 1.22 | Strong mid-city reward |
| `secondary_city_target` | 16 | 14 | Bonus peaks at smaller cities |
| `secondary_city_spread` | 0.72 | 1.08 | Wide bonus window |
| `metropolitan_overstretch_threshold` | 22 | 28 | Overstretch starts later |
| `metropolitan_overstretch_penalty` | 0.05 | 0.02 | Mild overstretch |
| `network_scale` | 0.35 | 0.50 | Moderate trade radius |
| `network_density_gain` | 0.7 | 0.84 | Good density effects |
| `inclusive_productivity_gain` | 0.65 | 0.76 | Higher capital returns |

## Experimental Results

| Rank | Policy | Cumulative Reward | Zipf Slope | HHI |
|------|--------|-------------------|------------|-----|
| — | Oracle | 5004 | — | — |
| 1 | Whittle | 5201 | $-0.43$ | 0.119 |
| 2 | SW-UCB | 5197 | $-0.64$ | 0.119 |
| 3 | D-UCB | 4995 | $-0.93$ | 0.157 |
| 9 | UCB1 | 2739 | $-2.80$ | 0.309 |

Whittle and SW-UCB are nearly tied for first place — and the mechanism is different in each case. Whittle succeeds through spatial intelligence: it recognises that the reward landscape favours distributed investment and allocates across multiple sites. SW-UCB succeeds through temporal intelligence: its sliding window detects when a site's marginal return diminishes (because the secondary city bonus peaks and declines at a specific population level) and redirects investment to under-developed sites. Two different forms of intelligence, one convergent outcome: polycentric prosperity.

The Zipf slopes tell the deeper story. UCB1 produces a slope of $-2.80$ — the steepest primacy in the entire experiment suite, more concentrated than even the [[megacity-trap]] scenario. In an environment explicitly designed to reward distribution, UCB1's optimistic averaging creates maximum concentration. The policy's structural inability to diversify is not merely suboptimal — it actively inverts the reward landscape's intent, building a primate city in a world designed for polycentrism.

The comparison with [[megacity-trap]] isolates the mechanism. In the megacity trap, all policies produce flat Zipf slopes because the overstretch penalty is harsh enough to force distribution. In balanced urban, the secondary city bonus is gentler — it rewards distribution but doesn't punish concentration as severely. The result: only spatially or temporally intelligent policies (Whittle, SW-UCB) discover the polycentric equilibrium. The balanced urban scenario rewards good policy choice more than the megacity trap does, because it offers a choice rather than a constraint.

## Hypotheses Tested

- **H4**: Secondary city bonus produces polycentric rank-size distributions
- **H5**: Algorithm comparison — do distributing policies outperform concentrating ones?
- **H6**: Does a Zipf-like distribution emerge? Under which policies?

## Expected Behaviour

- Multiple sites receive investment — the strong secondary city bonus rewards distribution
- Population spread across 4–6 sites of comparable size under good policies
- Lower `population_hhi`, more moderate `zipf_slope` (closer to $-1.0$) under spatial/temporal policies
- Less sensitivity to algorithm choice than resource-curse or ucb-bait scenarios
- UCB1 should produce extreme concentration despite the environment's polycentric design
