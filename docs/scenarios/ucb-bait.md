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

## Historical Context

Gold was discovered on Bonanza Creek in the Klondike region of the Yukon in August 1896. Within two years, Dawson City had swelled to approximately 40,000 people — the largest Canadian city west of Winnipeg. The town had steamship companies, saloons, a telegraph office, and electric lights. By 1902, the population had collapsed to 5,000. By 1920, fewer than 1,000 remained. The gold was real — approximately $29 million extracted in peak years — but the economy was pure extraction with zero institutional depth. No manufacturing base developed, no economic diversification occurred, and no lasting physical or human capital was built. Dawson City was a machine for converting geography into cash.

[Berton (1958)](https://archive.org/details/klondikefever0000bert) documented the full arc of the Klondike rush and established the canonical narrative of boom-bust resource towns: a discovery triggers a speculative inflow, the extractable resource generates enormous short-term returns, but the absence of institutional investment means that when the resource depletes (or becomes uneconomical), nothing remains to sustain the settlement. The pattern has repeated across resource frontiers — from the California Gold Rush towns to the phosphate economy of Nauru.

[van der Ploeg (2011)](https://doi.org/10.1257/jel.49.2.366) synthesised the broader literature on resource booms in his JEL survey, distinguishing between permanent resource endowments (which produce the rentier state dynamics of Iran) and finite windfall resources (which produce boom-bust cycles). The Dawson City pattern is the latter: returns are genuinely high for a finite period, then collapse abruptly. The policy challenge is not to avoid the resource entirely — it would be irrational to ignore $29 million in accessible gold — but to recognise the transience of the return and diversify before the collapse. This is precisely the explore-exploit dilemma that the scenario is designed to test.

[Sachs & Warner (1995)](https://www.nber.org/papers/w5398) showed that across countries, the boom-bust pattern generalises: economies that experience resource windfalls without concurrent institutional development end up worse off than those that never had the windfall at all, because the boom crowds out the learning-by-doing and institutional accumulation that would have occurred through non-resource economic activity.

## Model Mapping

The scenario constructs a single boomtown with an enormous early reward bonus ($+6.0$ for 42 steps) and a collapse penalty that begins at step 24 ($-0.5$ per step after threshold). The `boomtown_decay_multiplier` of $6.0$ means that active extraction and institutional decay effects are $6\times$ stronger at the boomtown — encoding the Dawson City pattern where concentrated extraction accelerates institutional and resource depletion simultaneously.

The key bandit-theoretic insight is temporal: UCB1's running average $\hat{Q}_i$ accumulates high early observations with tight confidence bounds, making the boomtown appear near-optimal long after the collapse has begun. Thompson sampling's posterior decay ($0.92$) widens the posterior variance, allowing it to sample low values and explore alternatives before the average-based policies can react.

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

## Experimental Results

| Rank | Policy | Cumulative Reward |
|------|--------|-------------------|
| — | Oracle | 1666 |
| 1 | SW-UCB | 1832 |
| 9 | Epsilon | 965 |

The temporal dynamics reveal the trap mechanism in detail. UCB1 makes 10 of its first 24 selections at the boomtown, then 12 of 18 selections during the decay window (steps 24–42) — it is most committed to the boomtown precisely when the boomtown is collapsing. Thompson sampling makes only 2 pre-collapse selections and 1 during decay. Whittle makes 0 total boomtown selections — it refuses to touch the boomtown entirely. But Whittle's caution comes at a cost: it finishes rank 7 of 9 with reward $1218$, forgoing the genuine pre-collapse returns that Thompson and SW-UCB capture.

The Dawson City lesson holds: the optimal strategy is neither full commitment (UCB1) nor full avoidance (Whittle), but calibrated exploitation with an exit plan (SW-UCB, Thompson).

## Hypotheses Tested

- **H7**: UCB1 is disproportionately trapped by the boomtown
- **H5**: Algorithm comparison — Thompson and Whittle should win decisively

## Expected Behaviour

- UCB1 has the highest `boomtown_selection_share` and lowest `cumulative_reward`
- Thompson sampling and Whittle index escape the boomtown earlier
- Discounted variants (D-UCB, D-Thompson) should partially escape due to recent-data weighting
- Contextual policies may detect the `boomtown` feature's correlation with declining reward
