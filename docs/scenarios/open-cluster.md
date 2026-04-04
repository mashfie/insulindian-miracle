---
tags: [scenario, trade, network]
type: scenario
related:
  - "[[urban-economics]]"
  - "[[reward-function]]"
  - "[[scenarios]]"
  - "[[hypotheses]]"
---

# Open Cluster

Trade-oriented sites begin more open and get stronger spatial spillovers from nearby peers.

## Historical Context

The Hanseatic League (c. 1150–1669) was a commercial confederation of merchant guilds and market towns spanning the North Sea and Baltic littoral, from London and Bruges in the west to Novgorod and Reval in the east. At its peak in the late fourteenth century, the League encompassed over 200 towns, coordinated through periodic assemblies (Hansetage) hosted in Lübeck, the nominal capital. The League was not a state — it levied no taxes, maintained no standing army, and exercised no territorial sovereignty. Its power was entirely network-based: collective bargaining over trade privileges, mutual defence of merchant rights, and the enforcement of commercial norms through the credible threat of exclusion from the network. [Dollinger (1970)](https://doi.org/10.1007/978-1-349-02524-8) remains the standard reference, documenting how the League's institutional innovations — standardised weights and measures, mutual credit arrangements, shared warehousing in the Kontore — reduced transaction costs across a vast commercial geography.

The economic logic of the Hanse was fundamentally different from the territorial states that eventually supplanted it. Where France, England, and Spain built centralised fiscal-military states that extracted rents from captive populations, the Hanseatic towns prospered through trade margins on goods that passed through multiple jurisdictions. [Ogilvie (2011)](https://doi.org/10.1017/CBO9780511974410) argued that the League's institutional structure was specifically adapted to the problem of long-distance trade without sovereign enforcement: reputation mechanisms, guild certification, and collective punishment substituted for the state's monopoly on violence. The result was a commercial network that generated substantial wealth for its members — Lübeck, Hamburg, and Bremen maintained per-capita incomes comparable to the richest Italian city-states — without concentrating that wealth in a single primate city.

The Hanseatic pattern illustrates a theoretical proposition central to this simulation: that spatial spillovers can substitute for resource endowments as a growth engine. The Hanse towns possessed no significant natural resources. Their wealth derived entirely from position — the network externality that made each town more valuable as a trading partner when more towns participated in the system. [Ewert & Selzer (2016)](https://doi.org/10.1007/978-3-319-31829-5) quantified this network effect, showing that Hanseatic trade volumes grew super-linearly with the number of participating towns, consistent with the density externalities that urban economists model as agglomeration effects. The League's decline after the fifteenth century — driven by the rise of territorial states that could internalise these network benefits through sovereign control — is itself a test case for whether distributed network governance can survive competition with centralised alternatives.

## Model Mapping

The scenario encodes the Hanseatic network logic through elevated spatial parameters: $\gamma_{\text{net}} = 0.58$ (wider trade radius than baseline), $\gamma_{\text{cap}} = 0.75$ (capital strongly influences trade mass), and $\gamma_{\text{dens}} = 1.10$ (strong density effects that reward proximate clusters). Five designated trade cluster sites receive openness bonuses ($+0.34$) and capital bonuses ($+0.38$), creating the multi-node structure of the historical Hanse — wealth distributed across a network rather than concentrated in a capital.

The resource curse is mild ($\alpha_{\text{curse}} = 0.03$), reflecting the League's non-extractive economic base. Congestion costs are low ($0.0014$), encoding the observation that Hanseatic towns rarely suffered the overcrowding pathologies of primate cities — trade networks naturally distribute population across nodes.

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 360 | Extended horizon |
| `network_scale` | 0.35 | 0.58 | Wider trade radius |
| `network_density_gain` | 0.7 | 1.10 | Strong density effects |
| `network_capital_gain` | 0.45 | 0.75 | Capital contributes more to trade |
| `trade_cluster_count` | 0 | 5 | Five trade cluster sites |
| `trade_cluster_openness_bonus` | 0.0 | 0.34 | Cluster sites start more open |
| `trade_cluster_capital_bonus` | 0.0 | 0.38 | Cluster sites start with more capital |
| `congestion` | 0.003 | 0.0014 | Lower congestion costs |
| `resource_curse_strength` | 0.04 | 0.03 | Milder curse |

## Experimental Results

| Rank | Policy | Cumulative Reward | Zipf Slope | HHI |
|------|--------|-------------------|------------|-----|
| — | Oracle | 4961 | — | — |
| 1 | Whittle | 5267 | $-0.60$ | 0.115 |
| 2 | SW-UCB | 5217 | $-0.42$ | 0.116 |
| 3 | D-UCB | 5057 | $-0.34$ | 0.140 |
| 9 | UCB1 | 2719 | $-2.25$ | 0.278 |

This is Whittle's best scenario — and the reason is legible. Whittle's surrogate model explicitly represents spatial state transitions, making it uniquely suited to environments where the reward structure is geographic. The Hanseatic League was precisely such an environment: value resided not in any single site's endowment but in the network connecting sites. Whittle recognises this structure and distributes investment accordingly, producing a polycentric settlement pattern (Zipf $-0.60$, HHI $0.115$) that mirrors the historical Hanse.

The contrast with Whittle's performance in the [[resource-curse-scenario]] is the sharpest diagnostic in the experiment suite. The same algorithm finishes first here (reward $5267$) and last there (reward $273$). The difference: in the open cluster, spatial structure encodes trade opportunity; in the resource curse, spatial structure encodes extraction traps. Whittle trusts geography — when geography is trustworthy, this is intelligence; when geography is treacherous, it is catastrophe.

UCB1 produces a Zipf slope of $-2.25$ — extreme primacy, a single dominant city. This is the anti-Hanse: a primate city system that concentrates investment in whichever site happened to generate high early returns, starving the network of the distributed investment that makes it valuable. The Hanseatic pattern requires deliberate polycentrism; UCB1's optimistic averaging is structurally incapable of producing it.

## Hypotheses Tested

- **H3** (with [[baseline]]): Network effects create measurable cluster premium
- **H5**: Algorithm comparison — do contextual policies ([[linucb]], [[linear-thompson]]) exploit trade cluster features?
- **H6**: Does a polycentric rank-size distribution emerge under network-sensitive policies?

## Expected Behaviour

- Trade cluster sites outperform non-cluster sites through network spillovers
- Open, proximate cities amplify each other's rewards
- Contextual policies should recognise the `trade_cluster` feature and favour cluster sites
- Population distribution should be relatively balanced within the cluster under spatial policies
- Extraction remains near zero — institutions stay inclusive in the absence of resource rents
