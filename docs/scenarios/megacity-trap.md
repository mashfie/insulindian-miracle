---
tags: [scenario, urban, concentration]
type: scenario
related:
  - "[[urban-economics]]"
  - "[[balanced-urban]]"
  - "[[scenarios]]"
---

# Megacity Trap

One dominant metropolis absorbs activity early, then system-wide overstretch and weak secondary cities drag long-run performance.

## Historical Context

Tehran's primacy in Iran's urban system is a twentieth-century construction. In 1900, the city held perhaps 200,000 people — one among several significant Iranian cities, behind Isfahan in cultural weight and alongside Tabriz, Shiraz, and Mashhad in commercial importance. By 2020, Greater Tehran housed over 16 million people, approximately 20% of the national population, and generated an estimated 40% of GDP. The transformation was not organic urbanisation but a deliberate consequence of Pahlavi-era state centralisation: the bureaucracy, the university system, the military command, the industrial licensing apparatus, and after 1953 the oil revenue distribution mechanism were all concentrated in Tehran. [Madanipour (1998)](https://doi.org/10.1002/9780470757192) documented how this administrative centralisation created a self-reinforcing dynamic — because Tehran controlled the permits, the contracts, and the connections, rational economic actors migrated to Tehran, which further concentrated the talent pool, which further justified centralising services there.

The mechanism is not unique to Tehran. [Henderson (2003)](https://doi.org/10.1016/S1574-0080(04)80006-3) formalised the "primacy trap" in his JEL survey of urban systems: when a country's institutional structure channels resources through a single city, the resulting concentration generates congestion costs (pollution, commuting times, housing prices, infrastructure overload) that exceed the agglomeration benefits, producing a net welfare loss for the national economy. Henderson estimated that countries with primacy indices above 0.35 suffer GDP losses of 1–2 percentage points annually relative to countries with more distributed urban systems — a structural drag that compounds over decades.

The Iranian case is instructive because Tehran's primacy coexists with institutional weakness. [Abrahamian (2008)](https://doi.org/10.1017/CBO9780511984402) showed how the capital's dominance actively suppressed secondary city development: provincial tax revenues were remitted to Tehran, infrastructure investment was disproportionately allocated to the capital, and the educational system funnelled talent toward Tehran's universities. The secondary cities — Tabriz, Isfahan, Mashhad, Shiraz — retained cultural significance but lost economic dynamism. The result is an urban system where a single overloaded metropolis coexists with underdeveloped secondary cities, and the system as a whole performs worse than either component's potential would suggest. This is the trap: the megacity is too large to be efficient, and the secondary cities are too starved to compensate.

## Model Mapping

The scenario encodes Tehran's primacy trap through two complementary mechanisms. First, the secondary city bonus is suppressed ($0.18$ vs baseline $0.75$), removing the incentive for algorithms to distribute investment across multiple sites — the institutional channelling that Henderson identified as the root cause of excessive primacy. Second, the metropolitan overstretch penalty kicks in earlier (threshold $15$ vs baseline $22$) and hits harder (penalty $0.13$ vs $0.05$), encoding the congestion costs that Tehran's infrastructure cannot absorb.

Network effects are deliberately weak ($\gamma_{\text{dens}} = 0.38$), reflecting the observation that primate city systems generate less inter-city trade than polycentric ones — secondary cities have too little economic mass to create meaningful network externalities.

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 360 | Extended horizon |
| `secondary_city_bonus` | 0.75 | 0.18 | Weak secondary city incentive |
| `secondary_city_target` | 16.0 | 24.0 | Bonus peaks at larger cities |
| `secondary_city_spread` | 0.72 | 0.38 | Narrow bonus window |
| `metropolitan_overstretch_threshold` | 22 | 15 | Overstretch kicks in earlier |
| `metropolitan_overstretch_penalty` | 0.05 | 0.13 | Harsh overstretch penalty |
| `congestion` | 0.003 | 0.0022 | Slightly lower congestion |
| `network_density_gain` | 0.7 | 0.38 | Weak network effects |

## Experimental Results

| Rank | Policy | Cumulative Reward | Zipf Slope | Top Site Share |
|------|--------|-------------------|------------|----------------|
| — | Oracle | 2801 | — | — |
| 1 | SW-UCB | 2951 | $-0.17$ | 0.100 |
| 2 | Whittle | 2948 | $-0.30$ | 0.106 |
| 3 | D-UCB | 2922 | $-0.18$ | 0.107 |
| 9 | Epsilon | 1587 | $-0.05$ | 0.156 |

The megacity trap is the scenario where investment diversification matters most — and the top three policies all achieve it. SW-UCB, Whittle, and D-UCB produce top-site shares below $0.11$ and Zipf slopes near zero, indicating highly distributed urban systems. They beat the oracle because the oracle's myopic strategy concentrates investment in the currently-best site, triggering overstretch penalties that an adaptive, diversifying policy avoids.

The Zipf slopes are uniformly flat across all policies (range $-0.30$ to $-0.03$), which is itself diagnostic: the overstretch penalty is harsh enough that even greedy algorithms are punished for excessive concentration, forcing a degree of distribution. The difference between winning and losing policies is not whether they diversify — all do — but how efficiently they identify which secondary sites to develop. SW-UCB and Whittle navigate this landscape best because their temporal and spatial models, respectively, detect the overstretch signal and redistribute investment before the penalty compounds.

The comparison with [[balanced-urban]] is revealing. In balanced-urban, Whittle and SW-UCB produce Zipf slopes of $-0.43$ and $-0.64$ — more concentrated than in the megacity trap. When the environment rewards polycentrism through positive incentives (secondary city bonus), good algorithms build moderately concentrated systems. When the environment punishes concentration through negative penalties (overstretch), all algorithms converge on flat distributions. Carrots produce differentiated responses; sticks produce convergence.

## Hypotheses Tested

- **H4**: Overstretch penalty causes performance decline in concentrated systems
- **H5**: Algorithm comparison — do diversifying policies outperform greedy ones?
- **H6**: Does the Zipf slope flatten under overstretch pressure?

## Expected Behaviour

- One site with the best geography captures most investment early
- Population concentrates, overstretch penalty compounds, rewards decline
- Secondary cities starved of investment remain underdeveloped
- Algorithms that diversify investment ([[whittle-index]], contextual policies) should outperform greedy approaches
- High `population_hhi` and `top_site_share` under naive policies; steep negative `zipf_slope`
