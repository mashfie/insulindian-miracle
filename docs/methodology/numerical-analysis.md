---
tags: [methodology, numerics]
type: methodology
related:
  - "[[terrain-generation]]"
  - "[[linear-algebra]]"
  - "[[next-steps]]"
---

# Numerical Analysis

## Terrain numerics

- Gradient noise uses quintic fade interpolation:

$$
f(t) = 6t^5 - 15t^4 + 10t^3.
$$

- Fractal terrain is finite-octave fBm with persistence and lacunarity.
- Field normalization is masked min-max scaling on land cells.
- River generation uses steepest-descent flow accumulation plus a quantile-based source rule.
- `distance_transform()` is a simple two-pass approximation, not an exact Euclidean distance transform.

## Spatial kernels

Cross-site interaction uses the exponential kernel

$$
K(d) = \exp(-d / \sigma_N).
$$

This is numerically stable for the repo's small site counts, but it creates dense coupling with `O(n^2)` storage and update cost.

## Statistical summaries

- **Correlation**: sample covariance divided by the product of sample standard deviations, with a zero-variance guard.
- **Gini**: computed from the sorted terminal population vector.
- **HHI**: squared-share concentration index.
- **Zipf slope**: OLS slope of `log(population)` on `log(rank)` over the retained upper tail. This is a descriptive estimate, not a formal power-law test.

## Stability choices in the code

- matrix inversion fails if a pivot is below `1e-12`,
- Cholesky fails if a diagonal remainder is nonpositive,
- linear Thompson adds diagonal jitter from `1e-9` upward,
- most bounded state variables are clamped after updates.

## Important caveats

- explicit inversion is acceptable at `d = 11`, but not a scalable default,
- the terrain distance transform and river tracing are heuristic approximations,
- the simulator does not compute confidence intervals for aggregate metrics inside the engine,
- there is no formal sensitivity-analysis harness inside `rust/src/`; downstream uncertainty work is delegated to experiment repetition and external analysis.
