---
tags: [module, python, terrain]
type: module
related:
  - "[[terrain-generation]]"
  - "[[model]]"
  - "[[sim]]"
---

# terrain.py

`src/insulindian_miracle/terrain.py` — 370 lines. Procedural terrain generation and candidate site selection.

## Key Exports

| Export | Type | Purpose |
|--------|------|---------|
| `TerrainConfig` | dataclass | Width, height, seed, Perlin noise parameters |
| `Site` | dataclass | Candidate settlement: id, coordinates, 7 geographic features, scenario flags |
| `TerrainField` | dataclass | Full terrain grid: elevation, masks, 8 derived feature layers |
| `generate_terrain(config)` | function | Pipeline: noise → shape → features → suitability |
| `select_candidate_sites(terrain, count, spacing)` | function | Greedy suitability-ranked site selection |
| `bilinear_sample(field, x, y)` | function | Continuous sampling from discrete grid |

## Internal Functions

| Function | Purpose |
|----------|---------|
| `_fade(t)` | Quintic interpolation curve for Perlin noise |
| `_normalize(values, mask)` | Min-max normalisation, optionally masked |
| `_perlin_noise(w, h, res, rng)` | Single-octave gradient noise |
| `_fractal_noise(config, rng)` | Multi-octave fractal Brownian motion |
| `_neighbors(y, x, h, w)` | 8-connected grid neighbour iterator |
| `_distance_to_mask(mask)` | Euclidean distance transform |
| `_derive_land_mask(elevation, sea_level)` | Binary land/sea classification |
| `_derive_coast_mask(land_mask)` | Cells adjacent to water |
| `_compute_downstream(elevation, land)` | Steepest-descent flow direction |
| `_derive_river(elevation, land, coast, config)` | Flow accumulation + river tracing |

## Site Dataclass

```python
@dataclass
class Site:
    id: int                    # Sequential index
    x: float                   # Normalised x ∈ [0, 1]
    y: float                   # Normalised y ∈ [0, 1]
    port_access: float         # [0, 1]
    river_access: float        # [0, 1]
    arability: float           # [0, 1]
    defensibility: float       # [0, 1]
    accessibility: float       # [0, 1]
    resource_rent: float       # [0, 1]
    suitability: float         # [0, 1] — weighted composite
    boomtown: bool = False     # Set by _apply_boomtown_shape()
    trade_cluster: bool = False # Set by _apply_trade_cluster_shape()
    # + boomtown/trade_cluster bonus fields
```

See [[terrain-generation]] for the full pipeline description.
