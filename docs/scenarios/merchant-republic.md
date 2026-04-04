---
tags: [scenario, trade, network]
type: scenario
related:
  - "[[open-cluster]]"
  - "[[urban-economics]]"
  - "[[scenarios]]"
---

# Merchant Republic

Port-led city clusters coordinate through trade and capital accumulation rather than extractive rents.

## Historical Context

The Dutch Republic (1581–1795) was the first modern economy. Unlike the territorial states that surrounded it, the Republic was a commercial network state — a loose confederation of seven provinces, each with significant autonomy, coordinated through the States-General. Wealth came not from land rents or resource extraction but from trade margins: the Baltic grain trade, the East India spice trade, herring fisheries, and the carrying trade that made Dutch ships the dominant freight carriers of Europe. [de Vries & van der Woude (1997)](https://doi.org/10.1017/CBO9780511528514) estimated that by 1650, Dutch per-capita income was approximately 50% higher than England's, making the Republic the richest society in the world at a time when it possessed virtually no natural resources.

The institutional innovations were port-led and financial. The Amsterdam Exchange Bank (Wisselbank, 1609) provided a stable unit of account and reliable clearing mechanism that reduced transaction costs across the entire commercial network. The VOC (1602) was the world's first joint-stock company, allowing risk-pooling across voyages and creating a secondary market in shares — the beginning of modern equity finance. [Gelderblom & Jonker (2004)](https://doi.org/10.1017/S0022050704002906) showed how the VOC's financial structure solved the commitment problems inherent in long-distance trade: investors could diversify across voyages, and the company could plan multi-year strategies rather than liquidating after each expedition.

The deeper institutional question is why these innovations emerged in the Dutch Republic rather than elsewhere. [North & Weingast (1989)](https://doi.org/10.1017/S0022050700009451) argued that credible commitments — constitutional constraints on sovereign expropriation — were the prerequisite for financial innovation. The Republic's federal structure, where each city maintained veto power over taxation, made confiscation politically impossible. This constraint, paradoxically, increased state revenue by lowering borrowing costs: Dutch sovereign debt traded at 3–4% when Spanish debt required 8–10%. The network effect was the growth engine: the more ports that traded through Dutch institutions, the more valuable those institutions became to each participant.

## Model Mapping

The scenario encodes the Dutch Republic's commercial network dynamics through very high network parameters: $\gamma_{\text{net}} = 0.72$ (wide trade radius), $\gamma_{\text{cap}} = 0.92$ (capital dominates trade mass), and $\gamma_{\text{dens}} = 1.22$ (strong density effects). These create a system where the value of each site depends primarily on its connections to other active sites — the network externality that de Vries and van der Woude identified as the Republic's core competitive advantage.

The resource curse is nearly absent ($\alpha_{\text{curse}} = 0.022$), reflecting the Republic's non-extractive economic base. Initial openness is high ($\alpha_{\text{open}} = 4.1$), encoding the pre-existing commercial culture. Four designated trade cluster sites create the multi-port structure of the historical Republic (Amsterdam, Rotterdam, Middelburg, Enkhuizen).

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 360 | Extended horizon |
| `initial_openness_alpha` | 2.2 | 4.1 | Very open initial institutions |
| `network_scale` | 0.35 | 0.72 | Very wide trade radius |
| `network_capital_gain` | 0.45 | 0.92 | Capital dominates trade mass |
| `network_density_gain` | 0.7 | 1.22 | Strong density effects |
| `inclusive_productivity_gain` | 0.65 | 0.82 | High returns to capital |
| `resource_curse_strength` | 0.04 | 0.022 | Very weak curse |
| `trade_cluster_count` | 0 | 4 | Four trade cluster sites |

## Experimental Results

| Rank | Policy | Cumulative Reward |
|------|--------|-------------------|
| — | Oracle | 5628 |
| 1 | SW-UCB | 5849 |
| 2 | Whittle | 5833 |
| 9 | UCB1 | 2962 |

Whittle excels here — its spatial intelligence works when geography correlates with trade networks rather than resource traps. The contrast with the [[resource-curse-scenario]] is sharp: Whittle finishes last there (reward $273$) and second here (reward $5833$). The same algorithmic property (trusting spatial structure) produces opposite outcomes depending on what the spatial structure encodes.

The Zipf slopes reveal the urban morphology: UCB1 produces a slope of $-2.35$ (extreme concentration in a single megacity), while Whittle produces $-0.62$ (a polycentric system). Whittle builds something resembling the actual Dutch Republic — multiple cities of comparable size connected by trade — while UCB1 builds a primate city system that the historical Republic explicitly was not.

## Hypotheses Tested

- **H3**: Network effects create measurable cluster premium
- **H5**: Algorithm comparison — do contextual policies exploit trade cluster features?
- **H6**: Does a polycentric rank-size distribution emerge?

## Expected Behaviour

- Extremely strong network effects — the trade cluster dominates
- Capital accumulation drives growth more than resources
- Very low extraction drift — institutions stay inclusive
- Population distribution should be relatively balanced within the cluster
- All policies should perform well; the "rising tide lifts all boats" dynamic reduces algorithm sensitivity
