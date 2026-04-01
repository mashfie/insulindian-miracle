---
tags: [system, reward, economics]
type: system
related:
  - "[[model]]"
  - "[[simulation-loop]]"
  - "[[institutional-dynamics]]"
  - "[[urban-economics]]"
  - "[[resource-curse]]"
---

# Reward Function

`compute_reward()` in `src/insulindian_miracle/model.py:319–373` returns the instantaneous reward for a given site. This is the signal observed by the [[policies|MAB policy]] and the driver of institutional evolution.

## Formula

```
reward = geography
       + resource_payoff
       + extractive_cashflow
       + inclusive_growth
       + reinvestment_dividend
       + secondary_city_dividend
       + network_spillover
       − extractive_drag
       − congestion
       − metropolitan_overstretch
       − reform_cost
       + boomtown_bonus
       − collapse_penalty
```

## Term-by-Term Breakdown

### Positive Terms

| Term | Formula | Economic Meaning |
|------|---------|-----------------|
| **Geography** | `Σ wᵢ · featureᵢ` (weights: 0.28 port, 0.18 river, 0.20 arability, 0.16 defense, 0.18 access) | Location advantage — the floor reward from geography alone |
| **Resource payoff** | `rent · (0.2 + 1.35 · extraction)` | Revenue from natural resources; scales with extraction |
| **Extractive cashflow** | `0.32 · rent · extraction · max(0.55, 1 − 0.2 · capital)` | Short-term premium from elite capture; diminished by capital |
| **Inclusive growth** | `(1 − extraction) · pop^0.52 · (1 + 0.65 · capital)` | Agglomeration economies; only flows through inclusive institutions |
| **Reinvestment dividend** | `0.12 · rent · (1 − extraction) · (0.45 + openness + 0.35 · capital)` | Returns from reinvesting resource revenue productively |
| **Secondary city dividend** | `0.75 · network · exp(−(log(pop) − log(16))² / 2·0.72²)` | Gaussian bonus peaking at mid-sized cities (~16 pop) |
| **Network spillover** | `openness · local_market · (1 + 0.7 · density)` | Trade benefits from open neighbouring cities |

### Negative Terms

| Term | Formula | Economic Meaning |
|------|---------|-----------------|
| **Extractive drag** | `extraction · 0.08 · pop` | Linear cost of elite capture on city output |
| **Congestion** | `0.003 · pop²` | Quadratic diseconomies of city size |
| **Metropolitan overstretch** | `0.05 · max(0, pop − 22)^1.35` | Superlinear penalty when cities exceed threshold |
| **Reform cost** | `0.2` (if reforming) | Temporary output loss during institutional reform |

### Conditional Terms

| Term | Condition | Effect |
|------|-----------|--------|
| **Boomtown bonus** | Site is boomtown, within bonus window | Decaying bonus: `bonus · max(remaining_fraction, 0.25)` |
| **Collapse penalty** | Site is boomtown, past collapse threshold | Linear penalty: `penalty · (steps − threshold)` |

## Network Bonus Detail

`network_bonus()` (`model.py:294–316`) computes spatial trade spillovers:

```python
for each neighbour j ≠ i:
    decay = exp(−distance(i,j) / network_scale)
    partner = openness_j · (1 + pop_gain · log(1 + pop_j)) · (1 + cap_gain · capital_j)
    trade_mass += partner · decay
    weight_sum += decay

local_market = trade_mass / weight_sum
density = weight_sum / (n_sites − 1)
return openness_i · local_market · (1 + density_gain · density)
```

This creates positive feedback: open cities near other open cities amplify each other's network bonus. See [[open-cluster]] and [[merchant-republic]].

## Key Tensions

The reward function embeds three fundamental tensions:

1. **Extraction vs inclusion** — resource payoff + extractive cashflow reward high extraction, but inclusive growth + reinvestment reward low extraction. Short-run vs long-run.

2. **Concentration vs distribution** — agglomeration rewards concentration, but congestion + overstretch + secondary city bonus reward distribution.

3. **Geography vs institutions** — geography provides a stable floor, but institutional quality determines the ceiling.

> [!tip] The resource curse in one equation
> `resource_payoff = rent · (0.2 + 1.35 · extraction)` — the more extractive the institutions, the higher the *immediate* resource payoff. But `inclusive_growth = (1 − extraction) · pop^0.52` — the more extractive, the lower the agglomeration returns. The trap is that extraction drift (see [[institutional-dynamics]]) steadily shifts the balance toward the first term while eroding the second.
