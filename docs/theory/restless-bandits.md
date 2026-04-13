---
tags: [theory, restless-bandits]
type: theory
related:
  - "[[multi-armed-bandits]]"
  - "[[whittle-index]]"
  - "[[formal-model]]"
---

# Restless Bandits

Restless-bandit language is the right abstraction boundary for this project, but only after important caveats.

## Canonical RMAB idea

Each arm has internal state and evolves under both active and passive actions. Under a Lagrangian relaxation with passive subsidy `lambda`, the Whittle index of state `s` is the subsidy that makes the decision maker indifferent between acting and waiting.

$$
W(s) = \inf \{ \lambda : V^{\text{passive}}(s; \lambda) \ge V^{\text{active}}(s; \lambda) \}.
$$

This is the theory of Whittle (1988), Weber and Weiss (1990), Nino-Mora (2000), and Akbarzadeh and Mahajan (2022).

## Why the repo is only approximately RMAB-like

The simulator violates arm independence through:

- network spillovers,
- migration,
- shock targeting based on cross-site state.

Therefore indexability is not proved and probably should not be claimed.

## What the code does instead

`whittle-index` builds a discretized surrogate state with bins for:

- population,
- extraction, openness, adaptability,
- resource rent,
- capital,
- legacy,
- geography,
- network reference,
- boomtown and trade-cluster flags.

Then it:

1. evaluates the first step with the actual snapshot reward,
2. rolls out a finite-depth surrogate transition,
3. binary-searches a passive subsidy over a bounded interval.

This is best described as a Whittle-style heuristic for a coupled simulator.

## Practical interpretation

When the surrogate captures the direction of drift well, the policy can be genuinely forward-looking. When it misses, failure can be severe because the approximation error is inside the decision rule itself.
