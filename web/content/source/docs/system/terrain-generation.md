---
tags: [system, terrain, procedural]
type: system
related:
  - "[[terrain]]"
  - "[[urban-economics]]"
  - "[[configuration]]"
  - "[[frontend]]"
---

# Terrain Generation

Procedural peninsula generation via Perlin noise, implemented in both Python (`terrain.py`) and TypeScript (`web/lib/terrain/generate.ts`). Both produce identical output for the same seed.

## Pipeline

```
Seed → RNG → Fractal Noise → Peninsula Shape → Elevation
                                                    │
                                    ┌───────────────┼────────────────┐
                                    ▼               ▼                ▼
                               Land Mask      Coast Mask      River + Flux
                                    │               │                │
                                    ▼               ▼                ▼
                              Accessibility    Port Quality    River Distance
                                    │                                │
                                    ▼                                ▼
                               Arability    Defensibility    Resource Rent
                                    │               │                │
                                    └───────────────┴────────────────┘
                                                    │
                                                    ▼
                                              Suitability
                                                    │
                                                    ▼
                                           Site Selection
```

## Step 1: Fractal Noise

`_fractal_noise()` generates base elevation using 4 octaves of Perlin noise:

```python
for octave in range(4):
    total += amplitude · perlin_noise(width, height, frequency, rng)
    amplitude *= persistence   # 0.5 — each octave contributes half
    frequency *= lacunarity    # 2.0 — each octave doubles detail
```

The Perlin noise uses gradient vectors at grid vertices, bilinear interpolation, and quintic fade curves (`6t⁵ - 15t⁴ + 10t³`).

## Step 2: Peninsula Shaping

Four analytical curves compose the peninsula morphology:

| Component | Formula | Effect |
|-----------|---------|--------|
| Spine | `0.9 − 1.45·y²` | Ridge along the east-west axis |
| Taper | `0.35 − 0.45·(x+0.15)² − 0.55·x` | Narrows toward the east |
| Headland | `0.28 · exp(−(x−0.45)²/0.09 − y²/0.26)` | Bulge at the eastern tip |
| Mainland bridge | `0.22 · exp(−(x+1)²/0.02 − y²/0.5)` | Connection to the western edge |

Final elevation = `0.85 · noise + spine + taper + headland + bridge`, normalised to [0, 1].

## Step 3: Derived Masks

- **Land mask**: `elevation > sea_level` (default 0.08), plus forced land along the western edge (mainland bridge)
- **Coast mask**: land cells adjacent to water cells
- **River**: flow-accumulation from a high-elevation inland source, traced downstream to the coast

## Step 4: Geographic Features

Each feature is computed on the land mask and normalised to [0, 1]:

| Feature | Derivation |
|---------|-----------|
| **Accessibility** | `exp(−distance_from_mainland · 1.2)` — proximity to the western edge |
| **Arability** | `(1 − slope) · exp(−0.18 · river_dist) · (1 − elevation)` — flat, river-adjacent lowlands |
| **Defensibility** | `0.55 · slope + 0.45 · coastal_distance` — steep inland terrain |
| **Port quality** | `exp(−1.1 · coastal_dist) · (1 − 0.6 · slope)` — close to coast, low slope |
| **Resource rent** | `0.55 · alt_noise + 0.45 · concentrated_deposit` — separate Perlin noise + geological hotspot near (0.1, -0.15) |

## Step 5: Suitability and Site Selection

**Suitability** = weighted composite:

```
0.28 · port + 0.20 · river_proximity + 0.18 · accessibility
+ 0.18 · arability + 0.10 · defensibility + 0.06 · resource
```

**Site selection** (`select_candidate_sites()`): greedy algorithm — rank all land cells by suitability descending, pick the top cell, skip any cell within `min_spacing` (default 0.12) of an already-selected site, repeat until `count` sites chosen (default 15).

## Python/TypeScript Parity

The TypeScript implementation in `web/lib/terrain/generate.ts` mirrors the Python pipeline:

- Seeded PRNG via `mulberry32` (32-bit, matching numpy's output for the same seed)
- Same fractal noise, peninsula shaping, and feature derivation formulas
- Same suitability weights and site selection algorithm
- Grid size: 64×64 (configurable in both)

> [!warning] Not byte-identical
> While the algorithms are equivalent, floating-point differences between Python/NumPy and JavaScript may produce minor variations at cell boundaries. The overall terrain shape and site rankings are consistent.
