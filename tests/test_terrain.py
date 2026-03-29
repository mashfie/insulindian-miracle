from __future__ import annotations

import math

import numpy as np

from insulindian_miracle.terrain import TerrainConfig, bilinear_sample, generate_terrain, select_candidate_sites


def test_generate_terrain_is_deterministic():
    config = TerrainConfig(seed=11, width=32, height=32)
    first = generate_terrain(config)
    second = generate_terrain(config)

    assert np.allclose(first.elevation, second.elevation)
    assert np.array_equal(first.river_mask, second.river_mask)


def test_generate_terrain_produces_land_and_river():
    terrain = generate_terrain(TerrainConfig(seed=5, width=32, height=32))

    assert terrain.land_mask.any()
    assert terrain.coast_mask.any()
    assert terrain.river_mask.any()
    assert terrain.suitability.max() > 0


def test_bilinear_sample_matches_cell_center():
    terrain = generate_terrain(TerrainConfig(seed=3, width=16, height=16))
    x_index = 6
    y_index = 4
    x = x_index / (terrain.config.width - 1)
    y = y_index / (terrain.config.height - 1)

    sampled = bilinear_sample(terrain.elevation, x, y)

    assert math.isclose(sampled, float(terrain.elevation[y_index, x_index]))


def test_select_candidate_sites_respects_spacing():
    terrain = generate_terrain(TerrainConfig(seed=19, width=40, height=40))
    sites = select_candidate_sites(terrain, count=8, min_spacing=0.12)

    assert len(sites) >= 4
    for left_index, left in enumerate(sites):
        for right in sites[left_index + 1 :]:
            assert math.hypot(left.x - right.x, left.y - right.y) >= 0.12

