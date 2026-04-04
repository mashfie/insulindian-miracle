---
tags: [scenario, shocks, reform, institutions]
type: scenario
related:
  - "[[institutional-dynamics]]"
  - "[[institutional-economics]]"
  - "[[resource-curse]]"
  - "[[scenarios]]"
---

# Shock Reform

Early depletion shocks raise crisis pressure and create reform opportunities. The most parameter-intensive scenario with 28 overrides.

## Historical Context

On 3 December 1997, the International Monetary Fund approved a $57 billion bailout package for South Korea — the largest in the Fund's history at that time. The immediate cause was a balance-of-payments crisis triggered by capital flight, but the structural conditions ran deeper. Korea's chaebol-dominated economy had accumulated massive short-term foreign debt, opaque corporate governance, and a banking system that allocated credit on political rather than commercial criteria. Within months, the won lost half its value, GDP contracted 5.5%, and unemployment tripled. The crisis destroyed short-term wealth on a scale that seemed catastrophic.

What followed was one of the most dramatic episodes of institutional reform in modern economic history. [Haggard (2000)](https://doi.org/10.1017/CBO9780511522161) documented the reform sequence: the Kim Dae-jung government used the crisis as a mandate to restructure the chaebols (forcing Daewoo into bankruptcy, compelling Samsung and Hyundai to shed non-core subsidiaries), liberalise the capital account, strengthen banking regulation, and introduce independent audit requirements. These were reforms that the Korean political economy had resisted for decades — the chaebols had captured the regulatory apparatus, and no government had possessed the political capital to challenge them. The crisis provided that capital. By 2001, Korea's GDP had recovered to pre-crisis levels; by 2005, it exceeded them; by 2020, Korea had become a top-10 global economy with institutional quality metrics that rivalled Western Europe.

[Acemoglu & Robinson (2012)](https://www.jstor.org/stable/j.ctt2jbsgw) placed the Korean case within a broader theoretical framework: crises create "critical junctures" where the existing institutional equilibrium becomes unstable, opening a window for reform that would be politically impossible under normal conditions. The key variable is not the shock itself but institutional readiness — whether the society possesses the human capital, administrative capacity, and political coalitions necessary to implement reform when the window opens. Korea had these prerequisites: a highly educated workforce, competent civil service, and democratic institutions (however imperfect) that allowed the crisis to be channelled into reform rather than collapse.

[Rodrik (1996)](https://doi.org/10.1257/jep.10.1.9) formalised the paradox: reform typically occurs not during prosperity (when there is no pressure) but during crisis (when there is no choice). The status quo bias in institutional evolution means that even when reforms are welfare-improving, they are blocked by incumbent beneficiaries — until a shock large enough to overwhelm their resistance arrives. This is the mechanism the scenario encodes: resource depletion shocks destroy short-term wealth but create reform pressure that, in institutionally ready sites, produces long-run institutional improvement.

## Model Mapping

The scenario is the most parameter-intensive in the suite (28 overrides), reflecting the complexity of the shock-reform mechanism. Shocks arrive stochastically ($p_{\text{shock}} = 0.05$ per step) and preferentially target resource-rich sites (bias $= 3.0$), encoding the empirical regularity that resource-dependent economies are more vulnerable to commodity price collapses.

The reform pathway is multi-stage. When a shock hits a site with high readiness ($\text{shock\_readiness\_weight} = 1.6$), the site enters a 44-step transition window where extraction is capped, the curse is buffered, and institutional reform capital accumulates. After transition, a lock-in bonus ($0.1$) makes the reform self-reinforcing — the Korean pattern where post-crisis institutions proved more durable than the pre-crisis ones they replaced. But sites with low readiness face snapback pressure ($0.25$): the shock damages them without triggering reform, and they regress toward their pre-shock (or worse) institutional state.

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 420 | Long horizon to see reform payoff |
| `shock_probability` | 0.0 | 0.05 | 5% shock chance per step |
| `depletion_rate` | 0.18 | 0.30 | Severe resource depletion |
| `shock_target_resource_bias` | 0.0 | 3.0 | Shocks target resource-rich sites |
| `shock_reform_memory` | 0 | 18 | 18-step reform window |
| `shock_reform_bonus` | 0.0 | 6.0 | Strong reform pressure from shocks |
| `shock_transition_duration` | 0 | 44 | Long institutional transition period |
| `shock_readiness_weight` | 0.0 | 1.6 | Readiness amplifies shock response |
| `shock_lock_in_bonus` | 0.0 | 0.1 | Good reforms become self-reinforcing |
| `shock_snapback_pressure` | 0.0 | 0.25 | Bad institutions resist change |

## Experimental Results

| Rank | Policy | Cumulative Reward | Zipf Slope | Shock Hits |
|------|--------|-------------------|------------|------------|
| — | Oracle | 3122 | — | — |
| 1 | SW-UCB | 3470 | $-0.23$ | — |
| 2 | D-UCB | 3429 | $-0.19$ | — |
| 3 | D-Thompson | 3289 | $-0.08$ | — |
| 7 | Whittle | 2603 | $-0.79$ | — |
| 9 | Epsilon | 1763 | $-0.19$ | — |

SW-UCB beats the oracle by $348$ — the second-largest oracle margin in the suite. The mechanism is temporal: when a shock hits, reward at the affected site drops sharply. The oracle, computing myopic optima, immediately abandons the shocked site. SW-UCB's sliding window also detects the drop, but because it forgets pre-shock data, it is equally ready to return to the site after reform improves its institutional quality. The oracle never reconsiders a site it has abandoned; SW-UCB does. This is the Rodrik paradox made computational: the ability to forget the past is what allows an algorithm to benefit from post-crisis reform.

Whittle's rank 7 finish is its second-worst showing (after the resource curse). Its spatial model anchors on geographic features that correlate with resource endowment, which in this scenario correlates with shock vulnerability. Whittle effectively avoids the sites that are most likely to undergo beneficial reform — it sees the risk correctly but cannot see the opportunity on the other side.

The discounted policies (D-UCB, D-Thompson) occupy ranks 2–3 because exponential discounting achieves a partial version of SW-UCB's forgetting: old data carries less weight, allowing post-shock reassessment. But exponential decay is less sharp than a sliding window, so they adapt more slowly. Mean post-shock persistence across policies is $178$ steps — reform effects last nearly half the horizon, confirming the lock-in mechanism.

## Hypotheses Tested

- **H1**: Resource-rich sites attract early investment but suffer shock-induced decline
- **H5**: Algorithm comparison — which policies benefit from post-crisis reform?
- **H2** (variant): Does institutional readiness determine whether crisis helps or hurts?

## Expected Behaviour

- Resource-rich sites get hit most often (bias $= 3.0$)
- Sites with good initial institutions reform on shock and improve permanently
- Sites with poor initial institutions absorb damage without reforming — spiral downward
- Creates a natural experiment within the simulation: "does crisis help or hurt?"
- Forgetting-based policies (SW-UCB, D-UCB) should excel — they reassess shocked sites after reform
