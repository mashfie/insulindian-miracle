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


def test_select_candidate_sites_avoids_literal_border_when_interior_land_exists():
    terrain = generate_terrain(TerrainConfig(seed=7, width=64, height=64))
    sites = select_candidate_sites(terrain, count=15, min_spacing=0.12)

    assert sites
    assert all(0.0 < site.x < 1.0 for site in sites)
    assert all(0.0 < site.y < 1.0 for site in sites)


def test_select_candidate_sites_reduce_default_border_bias_across_sample_seeds():
    seeds = [7, 11, 19, 23, 31, 41]
    edge_shares: list[float] = []

    for seed in seeds:
        terrain = generate_terrain(TerrainConfig(seed=seed, width=64, height=64))
        sites = select_candidate_sites(terrain, count=15, min_spacing=0.12)
        edge_count = sum(site.x in (0.0, 1.0) or site.y in (0.0, 1.0) for site in sites)
        edge_shares.append(edge_count / max(len(sites), 1))

    assert max(edge_shares) == 0.0
