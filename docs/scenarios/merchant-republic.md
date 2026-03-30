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

## Real-World Analogy

Venice, Genoa, the Dutch Republic — maritime trading states where institutional innovation, financial sophistication, and commercial networks drove growth rather than resource extraction. Wealth came from trade margins, not land rents.

## Key Overrides (11 parameters)

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

## Expected Behaviour

- Extremely strong network effects — the trade cluster dominates
- Capital accumulation drives growth more than resources
- Very low extraction drift — institutions stay inclusive
- Population distribution should be relatively balanced within the cluster
- All policies should perform well; the "rising tide lifts all boats" dynamic reduces algorithm sensitivity
