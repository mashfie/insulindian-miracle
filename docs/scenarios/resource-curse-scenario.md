---
tags: [scenario, resource-curse]
type: scenario
related:
  - "[[resource-curse]]"
  - "[[institutional-economics]]"
  - "[[scenarios]]"
  - "[[hypotheses]]"
---

# Resource Curse Scenario

Resource-rich sites start more extractive and remain tempting long enough to become traps.

## Historical Context

Iran's modern economic history is defined by oil. After the discovery of commercial reserves in 1908 and the consolidation of petroleum revenues under the Anglo-Iranian Oil Company, oil rents became the fiscal foundation of the Iranian state. [Mahdavy (1970)](https://doi.org/10.1007/978-1-349-15408-5_21) coined the term "rentier state" specifically to describe Iran, arguing that when governments derive the bulk of their revenue from external rents rather than domestic taxation, they lose the institutional incentive to build productive capacity or negotiate with citizens. By the 1960s, oil revenue consistently exceeded 60% of government income, a pattern that persisted through the Shah's White Revolution and continued after the 1979 revolution under a different political form.

The macroeconomic consequences followed the pattern that [Sachs & Warner (1995)](https://www.nber.org/papers/w5398) later documented cross-nationally: resource-abundant economies grew more slowly than resource-poor ones over the 1970–1989 period, controlling for initial income and policy variables. In Iran's case, Dutch disease crowded out manufacturing — the rial's purchasing power eroded as oil revenues inflated the non-tradable sector, making domestic industry uncompetitive. Despite substantial per-capita resource wealth, institutional quality declined across successive political regimes.

[Ross (2001)](https://doi.org/10.1353/wp.2001.0011) extended the analysis to show that oil wealth specifically hinders democratisation through three mechanisms: a spending effect (governments use rents to buy off opposition), a taxation effect (low tax burdens reduce demand for representation), and a group formation effect (patronage prevents the emergence of independent civil society). Iran exhibits all three. The result is a development trajectory where high short-term resource revenues coexist with long-run institutional decay — precisely the dynamic this scenario encodes.

## Model Mapping

The scenario amplifies resource revenues ($\text{resource\_capture\_gain} = 1.80$, up from $1.35$) while accelerating institutional decay ($\alpha_{\text{curse}} = 0.13$, over $3\times$ the baseline). Crucially, the buffers that protect institutions from the curse are suppressed: openness buffers drop from $0.35$ to $0.12$, and capital buffers from $0.25$ to $0.08$. This encodes Mahdavy's core insight — in a rentier state, neither trade openness nor capital accumulation is sufficient to prevent institutional erosion when the rents are large enough.

The `initial_extraction_resource_bias` of $5.2$ ensures that resource-rich sites begin with extractive institutions, and `active_extraction_pressure` of $0.18$ means that each round of investment in a resource-rich site worsens its governance — the "spending effect" from Ross (2001) made computational.

| Parameter | Default | Override | Effect |
|-----------|---------|----------|--------|
| `horizon` | 300 | 420 | Longer to see decay |
| `resource_capture_gain` | 1.35 | 1.80 | Higher resource revenue |
| `resource_curse_strength` | 0.04 | 0.13 | 3× faster extraction drift |
| `curse_openness_buffer` | 0.35 | 0.12 | Openness protects less |
| `curse_capital_buffer` | 0.25 | 0.08 | Capital protects less |
| `initial_extraction_resource_bias` | 2.5 | 5.2 | Resource-rich sites start extractive |
| `active_extraction_pressure` | 0.0 | 0.18 | Active use worsens institutions |
| `active_resource_depletion` | 0.0 | 0.08 | Active use depletes resources |

## Experimental Results

| Rank | Policy | Cumulative Reward |
|------|--------|-------------------|
| — | Oracle | 1129 |
| 1 | SW-UCB | 2357 |
| 9 | Whittle | 273 |

The most striking result: SW-UCB beats the oracle by more than $2\times$. This occurs because the oracle's omniscient strategy is computed over a fixed window, while SW-UCB's sliding window lets it forget old data from decaying arms and reallocate to sites whose institutions have stabilised. Extraction levels range from $0.09$ to $0.21$ across policies — no algorithm fully escapes the curse, but the forgetting-based policies (SW-UCB, D-UCB) escape it fastest.

Whittle's catastrophic last-place finish is diagnostic: its spatial intelligence anchors on geography, which in this scenario correlates with resource endowment, which correlates with the trap. The very feature that makes Whittle excel in trade-network scenarios — trust in spatial structure — becomes a liability when geography encodes a curse.

## Hypotheses Tested

- **H1**: Resource-rich sites attract early investment but suffer long-run decline
- **H2** (with [[botswana]]): Institutional quality matters more than resource endowment
- **H5**: Algorithm comparison — which policies avoid the trap?

## Expected Behaviour

- Resource-rich sites offer high immediate reward — algorithms invest early
- Extraction drifts rapidly — rewards decline — but algorithms may not detect it fast enough
- Sites with low resources but good institutions outperform over the full 420 steps
- [[thompson-sampling]] and [[whittle-index]] should detect the decline faster than [[ucb1]] and [[epsilon-greedy]]
