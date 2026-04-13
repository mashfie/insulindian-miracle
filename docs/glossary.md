---
tags: [glossary, notation]
type: reference
---

# Glossary

## Core state

- **Site / arm**: one candidate settlement location. The bandit policy chooses one site per step.
- **Active site**: the site selected at the current step; it receives one extra resident before `evolve_sites()`.
- **Population** `p_i`: integer site population.
- **Resource rent** `rho_i`: extractable rent intensity at site `i`.
- **Extraction** `e_i`: institutional extraction share in `[0,1]`.
- **Openness** `o_i`: trade and exchange openness in `[0,1]`.
- **Adaptability** `a_i`: reform capacity in `[0,1]`.
- **Productive capital** `k_i`: accumulated capital stock, clamped to `[0,1.5]`.
- **Shock reform stock / legacy** `ell_i`: persistent post-shock reform support.
- **Geography** `g_i`: weighted geographic quality score from port, river, arability, defensibility, accessibility.

## Structural terms

- **Network bonus** `N_i`: openness-weighted trade spillover from all other sites under exponential distance decay.
- **Boomtown**: scenario flag for a site with temporarily inflated resource rents and a later collapse penalty.
- **Trade cluster**: scenario flag for a site receiving openness, capital, and accessibility bonuses.
- **Institutional readiness**: scalar resilience score used in the shock-reform logic.
- **Decay matrix** `D`: dense matrix with entries `D_ij = exp(-dist(i,j) / network_scale)` for `i != j`.

## Policy terms

- **Stationary baseline**: epsilon-greedy, UCB1, and Gaussian Thompson as classical bandit reference points.
- **Forgetting heuristic**: discounted/sliding-window policies that intentionally violate stationary sufficiency to track drift.
- **Contextual linear policy**: LinUCB or linear Thompson using an 11-dimensional feature vector.
- **Whittle-style policy**: a discretized restless-bandit surrogate, not an exact indexability proof.
- **Myopic oracle**: single-step reward maximizer using `compute_reward_snapshot()`. It is not a clairvoyant dynamic-programming oracle.

## Metrics

- **Oracle regret**: `oracle_reward - cumulative_reward`, where the oracle is the repo's myopic oracle run.
- **Empirical regret**: `best_observed_reward - cumulative_reward` within the compared set of policies.
- **Population Gini**: inequality of terminal population shares.
- **Population HHI**: concentration of terminal population shares.
- **Zipf slope**: OLS slope of `log(population)` on `log(rank)` over the retained upper tail.

## Symbols used in this wiki

- `R_i(t)`: instantaneous reward of site `i` at time `t`.
- `V_t`: linear-bandit design / precision matrix.
- `b_t`: linear-bandit reward vector.
- `theta`: linear reward parameter.
- `lambda`: Whittle subsidy on passivity.
