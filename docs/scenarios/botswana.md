---
tags: [scenario, institutions, resource-curse]
type: scenario
related:
  - "[[resource-curse]]"
  - "[[institutional-economics]]"
  - "[[scenarios]]"
  - "[[hypotheses]]"
---

# Botswana

Resource rents remain high, but inclusive and adaptive initial institutions soften the curse.

## Historical Context

Norway discovered North Sea oil in 1969, but unlike most resource-rich nations, it already possessed the institutional infrastructure to manage the windfall. A stable parliamentary democracy, high social trust, established rule of law, and strong labour unions meant that oil revenues entered a political system with functioning checks on rent-seeking. [Larsen (2006)](https://doi.org/10.1016/j.worlddev.2005.07.010) directly compared Norway's oil management with other petroleum economies and argued that pre-existing institutional quality — not the resource endowment itself — determined whether oil became a blessing or a curse.

The centrepiece of Norway's resource management is the Government Pension Fund Global (Statens pensjonsfond utland), established in 1990 and now valued at over $1.5 trillion. The fiscal rule restricts government spending to the expected real return on the fund, approximately 3% annually. This institutional commitment converts a depleting natural resource into a permanent financial endowment. [Holden (2013)](https://doi.org/10.1257/jep.27.1.209) documented how the fiscal rule, combined with Statoil's partial privatisation under continued state majority ownership, allowed Norway to avoid Dutch disease, maintain a competitive manufacturing sector, and achieve the highest HDI globally.

The contrast with the United Kingdom is instructive. Britain had a comparable North Sea endowment but spent petroleum revenues on current consumption — primarily through Thatcher-era tax cuts — rather than building an intergenerational savings vehicle. [Mehlum, Moene & Torvik (2006)](https://doi.org/10.1111/j.1468-0297.2006.01045.x) formalised this distinction: the resource curse is conditional on institutional quality. In "producer-friendly" institutional environments (strong property rights, low corruption, rule of law), natural resources augment growth. In "grabber-friendly" environments, they retard it. Norway exemplifies the producer-friendly equilibrium; Iran (the [[resource-curse-scenario]]) exemplifies the grabber-friendly one.

## Model Mapping

The scenario encodes Norway's institutional advantage through high initial openness ($\alpha_{\text{open}} = 3.6$) and adaptability ($\alpha_{\text{adapt}} = 4.0$), combined with strong institutional buffers against the resource curse: $\text{curse\_openness\_buffer} = 0.70$ and $\text{curse\_capital\_buffer} = 0.62$. The resource curse strength is slightly below baseline ($0.035$ vs $0.04$) — the curse still exists, but institutions are strong enough to absorb it. Critically, `initial_extraction_resource_bias` is set to $0.15$, meaning resource-rich sites do not start with extractive institutions. This is the Pension Fund: resources do not corrupt the initial institutional allocation.

Higher `inclusive_investment_gain` ($0.22$) and `inclusive_productivity_gain` ($0.90$) encode the returns to Norway's human capital investments and diversified industrial policy. Network effects are stronger ($0.46$) reflecting Norway's deep integration into European trade networks.

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 420 | Longer to show divergence |
| `resource_curse_strength` | 0.04 | 0.035 | Slightly weaker curse |
| `curse_openness_buffer` | 0.35 | 0.70 | Openness strongly protects |
| `curse_capital_buffer` | 0.25 | 0.62 | Capital strongly protects |
| `inclusive_investment_gain` | 0.12 | 0.22 | More productive reinvestment |
| `inclusive_productivity_gain` | 0.65 | 0.90 | Higher returns to capital |
| `initial_extraction_resource_bias` | 2.5 | 0.15 | Resources don't corrupt initial institutions |
| `initial_openness_alpha` | 2.2 | 3.6 | Sites start more open |
| `initial_adaptability_alpha` | 3.0 | 4.0 | Sites start more adaptive |
| `network_scale` | 0.35 | 0.46 | Stronger trade spillovers |

## Experimental Results

| Rank | Policy | Cumulative Reward |
|------|--------|-------------------|
| — | Oracle | 5357 |
| 1 | SW-UCB | 5513 |
| 2 | Whittle | 5380 |
| 9 | UCB1 | 3018 |

Extraction stays at $0.002$ and openness at $1.000$ across all policies. Institutions hold — even naive approaches succeed when the institutional environment is sound. The policy spread (SW-UCB at $5513$ vs UCB1 at $3018$) is smaller in relative terms than in the resource curse scenario, confirming Mehlum et al.'s theoretical prediction: in producer-friendly environments, the choice of resource allocation strategy matters less because the institutional landscape is self-correcting.

The comparison with [[resource-curse-scenario]] is the core test of hypothesis H2. The same simulation engine, with different institutional parameters, produces a $4\times$ difference in top-policy reward ($5513$ vs $2357$). Institutions dominate resource endowment.

## Hypotheses Tested

- **H2** (with [[resource-curse-scenario]]): Good institutions convert resource abundance into growth
- **H5**: Algorithm comparison — does the "easy" institutional landscape reduce policy differences?

## Expected Behaviour

- Resource-rich sites remain productive because buffers suppress extraction drift
- Mean cumulative reward should be higher than [[resource-curse-scenario]]
- Policy differences should be smaller — even naive approaches succeed when institutions are good
- Reform frequency should be lower (institutions don't decay enough to trigger crisis)
