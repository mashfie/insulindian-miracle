---
tags: [system, terrain]
type: system
related:
  - "[[terrain]]"
  - "[[urban-economics]]"
---

# Terrain Generation

The terrain layer is a stylized peninsula generator, not a GIS-calibrated geography model.

## Elevation field

The normalized elevation field is

$$
h(x,y) =
0.85 n(x,y)
 + s(y)
 + t(x)
 + h_{\text{headland}}(x,y)
 + h_{\text{bridge}}(x,y),
$$

where `n` is multi-octave Perlin-style gradient noise, `s` is the peninsula spine, `t` is the taper, and the last two terms create a headland and a mainland bridge.

## Derived masks and distances

From elevation the code derives:

- land mask,
- coast mask,
- one main river path,
- coast distance,
- river distance.

The river source is chosen by a quantile rule over inland high-elevation cells and then traced along steepest descent.

## Feature layers

On land cells the engine computes:

- accessibility,
- arability,
- defensibility,
- port quality,
- resource rent,
- suitability.

The suitability score is

$$
\text{suitability}
=
0.28 \cdot \text{port}
+ 0.20 \cdot \text{river}
+ 0.18 \cdot \text{access}
+ 0.18 \cdot \text{arable}
+ 0.10 \cdot \text{defense}
+ 0.06 \cdot \text{resource}.
$$

## Candidate site selection

`select_candidate_sites_rust()` ranks land cells by a priority score that combines:

- suitability,
- border bonus,
- inland bonus,
- a greedy spacing bonus against already selected sites.

The final sites are discrete candidate settlements, not a continuous optimization over space.
