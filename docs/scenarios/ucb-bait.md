---
tags: [scenario, nonstationary, trap]
type: scenario
related:
  - "[[ucb1]]"
  - "[[thompson-sampling]]"
  - "[[whittle-index]]"
---

# UCB Bait

## Mechanism

This is the cleanest trap environment in the suite.

Key overrides:

- one boomtown site,
- very large early reward bonus,
- explicit collapse threshold and collapse penalty,
- accelerated boomtown depletion,
- strong curse pressure and active degradation.

## Literature analogue

- [Garivier and Moulines (2011)](https://researchportal.ip-paris.fr/en/publications/on-upper-confidence-bound-policies-for-switching-bandit-problems/)
- [Arthur (1989)](https://academic.oup.com/ej/article-abstract/99/394/116/5188212)

The scenario is designed to expose lock-in under optimistic stationary learning.

## Expected signatures

- high boomtown selection share for stationary optimistic policies,
- lower trap exposure for forgetting or posterior-sampling policies,
- strong divergence between one-step attractiveness and long-run value.
