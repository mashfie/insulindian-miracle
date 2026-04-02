---
tags: [scenario, trap, boomtown, bandit]
type: scenario
related:
  - "[[explore-exploit-tradeoff]]"
  - "[[ucb1]]"
  - "[[hypotheses]]"
  - "[[scenarios]]"
---

# UCB Bait

Short-run resource returns spike hard while institutional decay accelerates behind them. Designed to trap optimistic algorithms.

## Real-World Analogy

A boom-bust resource town — think Nauru (phosphate mining prosperity → economic collapse), or a gold rush town (Dawson City) that booms for a decade then empties out when the deposit is exhausted and no alternative economy was built.

## Key Overrides (18 parameters)

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 280 | Shorter — the trap must work fast |
| `resource_capture_gain` | 1.35 | 2.45 | Extremely high resource revenue |
| `resource_curse_strength` | 0.04 | 0.14 | Very fast extraction drift |
| `active_extraction_pressure` | 0.0 | 0.28 | Active use accelerates corruption |
| `active_resource_depletion` | 0.0 | 0.12 | Active use depletes resources fast |
| `boomtown_count` | 0 | 1 | One designated boomtown |
| `boomtown_resource_bonus` | 0.0 | 0.65 | Boomtown has huge resource endowment |
| `boomtown_early_reward_bonus` | 0.0 | 6.0 | Massive early reward spike |
| `boomtown_bonus_duration` | 0 | 42 | Spike lasts 42 steps |
| `boomtown_collapse_penalty` | 0.0 | 0.5 | Penalty after step 24 |
| `boomtown_collapse_threshold` | 0 | 24 | Collapse starts at step 24 |
| `boomtown_decay_multiplier` | 1.0 | 6.0 | Active effects 6× stronger at boomtown |
| `thompson_posterior_decay` | 0.995 | 0.92 | Faster Thompson adaptation |

## The Trap

1. **Steps 1–24**: Boomtown offers massive rewards (base + 6.0 bonus). UCB1 accumulates high Q̂ with tight confidence bounds.
2. **Steps 24–42**: Bonus decaying, collapse penalty growing, but Q̂ is still high from the early spike. UCB1 keeps pulling.
3. **Steps 42+**: Bonus gone, collapse penalty accumulating, extraction at maximum, resources depleted. UCB1's running average finally drops, but enormous regret has accumulated.

Meanwhile, Thompson sampling's posterior widened due to the decay rate (0.92), allowing it to sample low values and explore alternatives earlier. Whittle index foresaw the collapse through its rollout model.

## Hypotheses Tested

- **H7**: UCB1 is disproportionately trapped by the boomtown
- **H5**: Algorithm comparison — Thompson and Whittle should win decisively

## Expected Behaviour

- UCB1 has the highest `boomtown_selection_share` and lowest `cumulative_reward`
- Thompson sampling and Whittle index escape the boomtown earlier
- Discounted variants (D-UCB, D-Thompson) should partially escape due to recent-data weighting
- Contextual policies may detect the `boomtown` feature's correlation with declining reward
