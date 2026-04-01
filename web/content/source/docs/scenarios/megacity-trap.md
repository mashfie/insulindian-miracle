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

## Real-World Analogy

Bangkok, Lagos, Buenos Aires — primate city systems where one dominant metropolis concentrates a disproportionate share of national population and economic activity, suppressing the development of secondary cities and creating infrastructure overload.

## Key Overrides (8 parameters)

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

## Expected Behaviour

- One site with the best geography captures most investment early
- Population concentrates → overstretch penalty compounds → rewards decline
- Secondary cities starved of investment remain underdeveloped
- Algorithms that diversify investment ([[whittle-index]], contextual policies) should outperform greedy approaches
- High `population_hhi` and `top_site_share`; steep negative `zipf_slope`
