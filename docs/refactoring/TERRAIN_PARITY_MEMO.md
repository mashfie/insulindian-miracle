# Terrain Generation Parity Memo

Comparing the canonical Python implementation of `generate_terrain` with the Rust port in `rust/src/terrain.rs`, there are notable divergences in the derived geographical fields.

## Discovered Divergences

1. **Missing Slope Fields**
   - In Python, `np.gradient(elevation)` was used to compute a normalized `slope` map.
   - `slope` heavily influenced:
     - `arability`: `(1.0 - slope) * np.exp(-0.18 * river_distance) * ...`
     - `defensibility`: `0.55 * slope + 0.45 * _normalize(coastal_distance)`
     - `port_quality`: `np.exp(-1.1 * coastal_distance) * (1.0 - 0.6 * slope)`
   - In Rust, `slope` is completely absent. The fields fall back to simpler equations without the slope multiplier.

2. **Distance Transforms**
   - The Python code used `scipy.ndimage.distance_transform_edt` (Euclidean distance transform).
   - The Rust code implements a simple 2-pass Manhattan/Euclidean approximation. This changes the scalar values for `river_distance` and `coastal_distance`.

3. **Candidate-Site Selection Semantics**
   - *Status: Repaired.*
   - Initially, the Rust port used a simple suitability sort. We have now restored the Python complex selection (border bonuses, inland bonuses, spatial spread penalty).

4. **Left Border Land Mask**
   - In Python: `mask[:, 0] = True` was unconditionally setting the left border to land.
   - In Rust: `land_mask[y][0] = true` handles the exact same logic. This is in parity, but should be noted if we decide to remove the artificial wall.

## Versioning Decision Recommendation
Given the removal of `slope` and the simplified distance transform, the current Rust terrain generator produces structurally different environments and distributions of resource rents.

If exact Python parity is desired, we must compute `np.gradient` equivalent in Rust and restore the exact `scipy.ndimage.distance_transform_edt` algorithm (perhaps using a crate like `distance-transform`). If not, the engine must be versioned as `v2-terrain-rewrite`.
