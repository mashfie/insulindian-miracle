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

## Real-World Analogy

Hanseatic League — a network of northern European trading cities (Lübeck, Hamburg, Bremen, Gdańsk) that prospered through mutual trade, shared institutions, and collective bargaining power. Individual cities were modest; the network was powerful.

## Key Overrides (13 parameters)

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 360 | Extended horizon |
| `network_scale` | 0.35 | 0.58 | Wider trade radius |
| `network_density_gain` | 0.7 | 1.10 | Density amplifies network more |
| `network_capital_gain` | 0.45 | 0.75 | Capital contributes more to trade |
| `trade_cluster_count` | 0 | 5 | Five sites designated as trade cluster |
| `trade_cluster_openness_bonus` | 0.0 | 0.34 | Cluster sites start more open |
| `trade_cluster_capital_bonus` | 0.0 | 0.38 | Cluster sites start with more capital |
| `congestion` | 0.003 | 0.0014 | Lower congestion costs |
| `resource_curse_strength` | 0.04 | 0.03 | Milder curse |

## Hypotheses Tested

- **H3** (with [[baseline]]): Network effects create measurable cluster premium
- **H5**: Algorithm comparison — do contextual policies ([[linucb]], [[linear-thompson]]) exploit trade cluster features?

## Expected Behaviour

- Trade cluster sites outperform non-cluster sites through network spillovers
- Open, proximate cities amplify each other's rewards
- Contextual policies should recognise the `trade_cluster` feature and favour cluster sites
- Population distribution should be more balanced (network rewards mid-sized cities)
