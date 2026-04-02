---
tags: [system, institutions, dynamics]
type: system
related:
  - "[[model]]"
  - "[[institutional-economics]]"
  - "[[resource-curse]]"
  - "[[reward-function]]"
  - "[[shock-reform]]"
---

# Institutional Dynamics

How institutional state evolves each timestep in `evolve_sites()` (`model.py:394–632`). Every site evolves every step, whether or not it was selected — this is what makes the problem a [[restless-bandits|restless bandit]].

## Reform vs Drift

Each site, each step, faces a binary outcome:

### Reform Path (extraction decrease)

Triggers when `rng.random() < reform_probability`, where:

```
crisis_pressure = sigmoid(
    −delta · reform_sensitivity     # reward decline → pressure
    + shock_reform_bonus · shock_factor  # recent shock memory
    + 2.0 · transition_factor       # post-shock window
    + legacy_factor                  # accumulated reform stock
)
reform_probability = min(1.0, effective_adaptability · crisis_pressure)
```

**On reform:**
- `extraction -= reform_step` (default 0.18)
- `openness += 0.08 + shock_openness_bonus`
- `reform_timer = reform_duration` (default 5 steps)
- `reforms_triggered += 1`
- Capital rebuilt if shock-related
- Reform stock accumulated

### Drift Path (extraction increase — resource curse)

When reform does not trigger:

```
curse_modifier = max(0.1,
    1.0
    − openness_buffer · openness       # openness protects
    − capital_buffer · capital          # capital protects
    − transition_curse_buffer · transition  # post-shock protection
    − legacy_curse_buffer · legacy      # reform stock protection
)
extraction += curse_strength · resource_rent · curse_modifier · (1 − extraction)
```

The curse is strongest for resource-rich sites with low openness and low capital. It asymptotically approaches extraction = 1.0 but never reaches it (scaled by `(1 − extraction)`).

## Active-Site Effects

The site chosen by the policy this step receives additional pressures:

```
activity_load = max(0, (active_steps − decay_onset) / decay_onset)

extraction += active_extraction_pressure · load · resource · max(extraction, 0.1) · (1 − extraction)
resource_rent *= (1 − active_resource_depletion · load · resource · (0.35 + extraction))
openness -= active_openness_drag · load · extraction
```

This models the idea that *using* a resource-rich site accelerates institutional decay and resource depletion. The `decay_onset` parameter controls when active effects kick in (default varies by scenario).

## Capital Dynamics

Each step:

```
investment = 0.25 · inclusive_investment · rent · (1 − extraction) · (0.4 + openness + 0.25 · network)
erosion = extractive_capital_erosion · extraction · (0.35 + rent)
capital += passive_scale · investment + 0.015 · network − erosion
```

- `passive_scale` is 1.0 for the active site, 0.45 for passive sites
- Capital is clamped to [0, 1.5]
- Inclusive institutions invest; extractive institutions erode

## Shock System

With probability `shock_probability` per step:

1. **Target selection** — weighted by `resource_rent^(1 + target_bias)`, so resource-rich sites are hit more often
2. **Immediate effects:**
   - `resource_rent *= (1 − depletion_rate)` (default 0.18)
   - `capital -= 0.3 · depletion_rate`
   - `shock_memory` set to `shock_reform_memory`
   - `post_shock_timer` set to `shock_transition_duration`
3. **Readiness-scaled reform:**
   - High-readiness sites get immediate extraction reduction, openness boost, capital rebuild
   - `shock_reform_stock` accumulated for legacy effects
4. **Post-shock transition** (while `post_shock_timer > 0`):
   - Extraction decayed and capped
   - Openness and capital boosted
   - Curse buffers active
5. **Legacy effects** (while `shock_reform_stock > 0`):
   - Ongoing extraction decay and openness gain
   - Fade rate: `shock_legacy_fade` per step

> [!note] Institutional readiness
> `readiness = 0.28·(1−extraction) + 0.28·openness + 0.26·adaptability + 0.18·capital_scale`
>
> This determines how well a site responds to shocks. High-readiness sites reform immediately; low-readiness sites absorb the damage but don't change institutions. Computed at initialisation and frozen.

## Population Dynamics

Each step, structural signals drive **population momentum**:

```
growth_signal = reward_signal + 0.9·(structural_signal − 0.75) + 0.45·(mid_city_signal − 0.35)
momentum = decay · prev_momentum + growth_rate · growth_signal − decline_rate · overstretch
```

When the best-momentum site exceeds +0.75 and the worst-momentum site with pop > 1 falls below −0.75, one person migrates from worst to best. This creates endogenous urbanisation dynamics beyond the policy's direct allocation.

## Openness Convergence

A small convergence term ties openness to network participation:

```
openness += 0.035 · (network − openness)
```

Cities that benefit from trade networks become more open over time; isolated cities drift toward closure.
