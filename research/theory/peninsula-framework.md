# Peninsula Framework

## Objective

Build a backend simulation in which geography creates opportunity, institutions shape how opportunity is used, and bandit policies determine whether the system learns the difference between short-run rents and long-run viability.

The central correction to the original note is structural: the model should not overload one scalar `g_k` with both general geographic quality and extractable resource abundance. Those are different mechanisms and need different state.

## Terrain and Endowments

The peninsula should be generated on a raster heightfield with derived spatial layers, then exposed through continuous sampling. This gives a simple implementation path without forcing the rest of the backend to think in raw grid cells.

The terrain layer should derive:

- elevation and slope from fractal Perlin-style noise
- a coastline and one primary river system
- coastal distance and river proximity fields
- an accessibility field that proxies transport cost
- an arability field favoring low slope, moderate elevation, and water access
- a separate mineral or resource-rent field

Candidate settlements should be chosen from a suitability surface rather than uniformly at random. Suitability should favor a mix of:

- port quality and coastal proximity
- river access
- accessibility
- arability
- defensibility

This is the terrain-side expression of agglomeration theory and central-place logic (`henderson1974cities`, `krugman1991geography`).

## Site State

Each site needs two distinct endowment components:

- `geo_k`: a feature vector for general settlement quality
- `rho_k`: a scalar for extractable resource rents

`geo_k` supports durable city growth. `rho_k` creates the short-run temptation that can sustain extractive institutions even when long-run development is poor.

Institutional state should begin with three continuous dimensions:

- extraction
- openness
- adaptability

These are enough for v1 because they map cleanly to the mechanisms in the note and to the policy comparisons we want to run.

## Reward and Dynamics

Reward should be decomposed into separable channels:

1. Base geography payoff from `geo_k`
2. Short-run resource payoff from `rho_k`
3. Agglomeration benefits that rise concavely with population
4. Extractive drag that scales with extraction and city size
5. Congestion costs
6. Openness-mediated network spillovers
7. Temporary reform costs

This decomposition matters because the resource-curse mechanism must operate through distinct causal channels:

- high `rho_k` increases extraction pressure
- high extraction raises short-run payoff from rents
- high short-run payoff delays crises
- delayed crises reduce reform frequency
- low reform frequency worsens long-run outcomes

That is the simulation analogue of the resource-curse and rentier-state literature (`sachs1995resourcegrowth`, `sachs2001curse`, `ross1999resourcecurse`).

Institutional updates should be restless: all sites evolve every step, not just the selected site. The selected site receives new population and an observed reward, but every site should still update extraction pressure, network exposure, and reform state.

## Bandit Framing

The environment is not a clean stationary bandit. It is a restless, partially endogenous control problem with stateful arms. That means the implementation should be staged:

1. Epsilon-greedy and UCB1 as transparent baselines
2. Gaussian Thompson Sampling for continuous rewards
3. Restless environment updates for all sites
4. A Whittle-style policy over a discretized surrogate model

For v1, the Whittle component should be explicit about approximation. The full environment has coupled network terms and continuous state, so exact indexability is not realistic. The policy should therefore compute indices on a discretized per-site surrogate and use them as heuristic priorities in the full simulation (`whittle1988restless`, `akbarzadeh2020whittle`, `levine2017rotting`).

## Implementation Implications

The backend should expose a small set of stable types:

- `TerrainConfig` and `TerrainField`
- `Site` and `SiteState`
- `InstitutionState`
- `SimulationConfig`
- `Policy`
- `SimulationResult`

The CLI should support two tracks:

- research commands for acquiring and synthesizing the corpus
- simulation commands for seeded runs, sweeps, and policy benchmarks

## Success Criteria

The backend is ready for serious experiments when:

- the terrain generator produces reproducible peninsulas with coherent rivers and candidate sites
- the reward function makes resource-rich sites attractive early but fragile later
- UCB1 overcommits in a controlled decaying benchmark
- Gaussian Thompson Sampling adapts better than UCB1 in the same benchmark
- the restless simulation runs with comparable outputs across epsilon, UCB1, Thompson, and Whittle-style policies
