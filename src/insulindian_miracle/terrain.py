from __future__ import annotations

from dataclasses import asdict, dataclass
import math
from typing import Iterable

import numpy as np
import scipy.ndimage


@dataclass(slots=True)
class TerrainConfig:
    width: int = 64
    height: int = 64
    seed: int = 7
    octaves: int = 4
    persistence: float = 0.5
    lacunarity: float = 2.0
    sea_level: float = 0.08
    river_source_quantile: float = 0.8


@dataclass(slots=True)
class Site:
    id: int
    x: float
    y: float
    port_access: float
    river_access: float
    arability: float
    defensibility: float
    accessibility: float
    resource_rent: float
    suitability: float
    boomtown: bool = False
    boomtown_reward_bonus: float = 0.0
    boomtown_bonus_duration: int = 0
    boomtown_collapse_penalty: float = 0.0
    boomtown_collapse_threshold: int = 0
    boomtown_decay_multiplier: float = 1.0
    boomtown_initial_extraction_boost: float = 0.0
    trade_cluster: bool = False
    trade_cluster_openness_bonus: float = 0.0
    trade_cluster_capital_bonus: float = 0.0


@dataclass(slots=True)
class TerrainField:
    config: TerrainConfig
    elevation: np.ndarray
    land_mask: np.ndarray
    coast_mask: np.ndarray
    river_mask: np.ndarray
    water_flux: np.ndarray
    coastal_distance: np.ndarray
    river_distance: np.ndarray
    accessibility: np.ndarray
    arability: np.ndarray
    resource_rent: np.ndarray
    defensibility: np.ndarray
    port_quality: np.ndarray
    suitability: np.ndarray

    def sample(self, field_name: str, x: float, y: float) -> float:
        field = getattr(self, field_name)
        return bilinear_sample(field, x, y)


def bilinear_sample(field: np.ndarray, x: float, y: float) -> float:
    height, width = field.shape
    px = np.clip(x, 0.0, 1.0) * (width - 1)
    py = np.clip(y, 0.0, 1.0) * (height - 1)
    x0 = int(math.floor(px))
    y0 = int(math.floor(py))
    x1 = min(x0 + 1, width - 1)
    y1 = min(y0 + 1, height - 1)
    tx = px - x0
    ty = py - y0
    top = (1.0 - tx) * field[y0, x0] + tx * field[y0, x1]
    bottom = (1.0 - tx) * field[y1, x0] + tx * field[y1, x1]
    return float((1.0 - ty) * top + ty * bottom)


def _fade(t: float) -> float:
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


def _normalize(values: np.ndarray, mask: np.ndarray | None = None) -> np.ndarray:
    array = values.astype(float).copy()
    if mask is None:
        low = float(array.min())
        high = float(array.max())
        if math.isclose(low, high):
            return np.zeros_like(array)
        return (array - low) / (high - low)

    relevant = array[mask]
    if relevant.size == 0:
        return np.zeros_like(array)
    low = float(relevant.min())
    high = float(relevant.max())
    if math.isclose(low, high):
        return np.zeros_like(array)
    array[mask] = (array[mask] - low) / (high - low)
    array[~mask] = 0.0
    return array


def _perlin_noise(width: int, height: int, resolution: int, rng: np.random.Generator) -> np.ndarray:
    gradients = np.zeros((resolution + 1, resolution + 1, 2), dtype=float)
    for gy in range(resolution + 1):
        for gx in range(resolution + 1):
            angle = rng.uniform(0.0, 2.0 * math.pi)
            gradients[gy, gx] = (math.cos(angle), math.sin(angle))

    noise = np.zeros((height, width), dtype=float)
    for iy in range(height):
        py = (iy / max(height - 1, 1)) * resolution
        y0 = int(math.floor(py))
        y1 = min(y0 + 1, resolution)
        ty = py - y0
        sy = _fade(ty)
        for ix in range(width):
            px = (ix / max(width - 1, 1)) * resolution
            x0 = int(math.floor(px))
            x1 = min(x0 + 1, resolution)
            tx = px - x0
            sx = _fade(tx)

            g00 = gradients[y0, x0]
            g10 = gradients[y0, x1]
            g01 = gradients[y1, x0]
            g11 = gradients[y1, x1]

            d00 = np.dot(g00, np.array([tx, ty]))
            d10 = np.dot(g10, np.array([tx - 1.0, ty]))
            d01 = np.dot(g01, np.array([tx, ty - 1.0]))
            d11 = np.dot(g11, np.array([tx - 1.0, ty - 1.0]))

            nx0 = (1.0 - sx) * d00 + sx * d10
            nx1 = (1.0 - sx) * d01 + sx * d11
            noise[iy, ix] = (1.0 - sy) * nx0 + sy * nx1
    return noise


def _fractal_noise(config: TerrainConfig, rng: np.random.Generator) -> np.ndarray:
    total = np.zeros((config.height, config.width), dtype=float)
    amplitude = 1.0
    frequency = 2
    amplitude_sum = 0.0
    for _ in range(config.octaves):
        total += amplitude * _perlin_noise(config.width, config.height, frequency, rng)
        amplitude_sum += amplitude
        amplitude *= config.persistence
        frequency = max(2, int(round(frequency * config.lacunarity)))
    return total / max(amplitude_sum, 1e-9)


def _neighbors(y: int, x: int, height: int, width: int) -> Iterable[tuple[int, int]]:
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            ny = y + dy
            nx = x + dx
            if 0 <= ny < height and 0 <= nx < width:
                yield ny, nx


def _distance_to_mask(mask: np.ndarray) -> np.ndarray:
    if not np.any(mask):
        return np.full(mask.shape, float(mask.shape[0] + mask.shape[1]))
    return scipy.ndimage.distance_transform_edt(~mask)


def _derive_land_mask(elevation: np.ndarray, sea_level: float) -> np.ndarray:
    mask = elevation > sea_level
    mask[:, 0] = True
    return mask


def _derive_coast_mask(land_mask: np.ndarray) -> np.ndarray:
    height, width = land_mask.shape
    coast = np.zeros_like(land_mask, dtype=bool)
    for y in range(height):
        for x in range(width):
            if not land_mask[y, x]:
                continue
            if y in (0, height - 1) or x in (0, width - 1):
                coast[y, x] = True
                continue
            for ny, nx in _neighbors(y, x, height, width):
                if not land_mask[ny, nx]:
                    coast[y, x] = True
                    break
    return coast


def _compute_downstream(elevation: np.ndarray, land_mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    height, width = elevation.shape
    downstream_y = np.full((height, width), -1, dtype=int)
    downstream_x = np.full((height, width), -1, dtype=int)
    for y in range(height):
        for x in range(width):
            if not land_mask[y, x]:
                continue
            best = (y, x)
            best_elevation = elevation[y, x]
            for ny, nx in _neighbors(y, x, height, width):
                if elevation[ny, nx] < best_elevation:
                    best = (ny, nx)
                    best_elevation = elevation[ny, nx]
            downstream_y[y, x], downstream_x[y, x] = best
    return downstream_y, downstream_x


def _derive_river(elevation: np.ndarray, land_mask: np.ndarray, coast_mask: np.ndarray, config: TerrainConfig) -> tuple[np.ndarray, np.ndarray]:
    height, width = elevation.shape
    downstream_y, downstream_x = _compute_downstream(elevation, land_mask)
    flux = np.zeros_like(elevation, dtype=float)
    flux[land_mask] = 1.0
    order = np.argwhere(land_mask)
    order = sorted(order.tolist(), key=lambda item: elevation[item[0], item[1]], reverse=True)
    for y, x in order:
        ny = downstream_y[y, x]
        nx = downstream_x[y, x]
        if ny == y and nx == x:
            continue
        flux[ny, nx] += flux[y, x]

    inland = _distance_to_mask(coast_mask)
    candidates = land_mask & (inland > 4.0)
    if np.any(candidates):
        quantile = np.quantile(elevation[candidates], config.river_source_quantile)
        source_mask = candidates & (elevation >= quantile)
        source_score = np.where(source_mask, flux * elevation, -1.0)
    else:
        source_score = np.where(land_mask, flux * elevation, -1.0)

    source_y, source_x = np.unravel_index(int(np.argmax(source_score)), source_score.shape)
    river = np.zeros_like(land_mask, dtype=bool)
    y, x = int(source_y), int(source_x)
    for _ in range(height * width):
        if not land_mask[y, x]:
            break
        river[y, x] = True
        if coast_mask[y, x]:
            break
        ny = downstream_y[y, x]
        nx = downstream_x[y, x]
        if ny == y and nx == x:
            break
        y, x = int(ny), int(nx)
    return river, flux


def generate_terrain(config: TerrainConfig) -> TerrainField:
    rng = np.random.default_rng(config.seed)
    base_noise = _fractal_noise(config, rng)
    alt_config = TerrainConfig(**{**asdict(config), "seed": config.seed + 97})
    resource_noise = _fractal_noise(alt_config, np.random.default_rng(config.seed + 97))

    xs = np.linspace(-1.0, 1.0, config.width)
    ys = np.linspace(-1.0, 1.0, config.height)
    grid_x, grid_y = np.meshgrid(xs, ys)

    spine = 0.9 - 1.45 * np.square(grid_y)
    taper = 0.35 - 0.45 * np.square(grid_x + 0.15) - 0.55 * grid_x
    headland = 0.28 * np.exp(-((grid_x - 0.45) ** 2 / 0.09 + grid_y**2 / 0.26))
    mainland_bridge = 0.22 * np.exp(-((grid_x + 1.0) ** 2 / 0.02 + grid_y**2 / 0.5))
    elevation = 0.85 * base_noise + spine + taper + headland + mainland_bridge
    elevation = _normalize(elevation)

    land_mask = _derive_land_mask(elevation, config.sea_level)
    coast_mask = _derive_coast_mask(land_mask)
    river_mask, water_flux = _derive_river(elevation, land_mask, coast_mask, config)
    coastal_distance = _distance_to_mask(coast_mask)
    river_distance = _distance_to_mask(river_mask)

    slope_y, slope_x = np.gradient(elevation)
    slope = np.sqrt(np.square(slope_x) + np.square(slope_y))
    slope = _normalize(slope, land_mask)

    accessibility = np.exp(-np.sqrt(np.square(grid_x + 1.0) + np.square(grid_y)) * 1.2)
    accessibility = _normalize(accessibility, land_mask)

    arability = (1.0 - slope) * np.exp(-0.18 * river_distance) * (1.0 - np.clip(elevation - config.sea_level, 0.0, 1.0))
    arability = _normalize(arability, land_mask)

    defensibility = 0.55 * slope + 0.45 * _normalize(coastal_distance, land_mask)
    defensibility = _normalize(defensibility, land_mask)

    port_quality = np.exp(-1.1 * coastal_distance) * (1.0 - 0.6 * slope)
    port_quality = _normalize(port_quality, land_mask)

    geology = 0.55 * resource_noise + 0.45 * np.exp(-((grid_x - 0.1) ** 2 / 0.55 + (grid_y + 0.15) ** 2 / 0.3))
    resource_rent = _normalize(geology, land_mask)

    suitability = (
        0.28 * port_quality
        + 0.2 * np.exp(-0.2 * river_distance)
        + 0.18 * accessibility
        + 0.18 * arability
        + 0.1 * defensibility
        + 0.06 * resource_rent
    )
    suitability = _normalize(suitability, land_mask)

    elevation[~land_mask] = 0.0
    water_flux[~land_mask] = 0.0
    coastal_distance[~land_mask] = 0.0
    river_distance[~land_mask] = 0.0
    accessibility[~land_mask] = 0.0
    arability[~land_mask] = 0.0
    resource_rent[~land_mask] = 0.0
    defensibility[~land_mask] = 0.0
    port_quality[~land_mask] = 0.0
    suitability[~land_mask] = 0.0

    return TerrainField(
        config=config,
        elevation=elevation,
        land_mask=land_mask,
        coast_mask=coast_mask,
        river_mask=river_mask,
        water_flux=water_flux,
        coastal_distance=coastal_distance,
        river_distance=river_distance,
        accessibility=accessibility,
        arability=arability,
        resource_rent=resource_rent,
        defensibility=defensibility,
        port_quality=port_quality,
        suitability=suitability,
    )


def select_candidate_sites(terrain: TerrainField, count: int = 15, min_spacing: float = 0.1) -> list[Site]:
    height, width = terrain.elevation.shape
    max_border_distance = max(1.0, min(width, height) / 2.0 - 1.0)
    cells: list[tuple[float, int, int, bool]] = []
    interior_cells: list[tuple[float, int, int, bool]] = []

    for y, x in np.argwhere(terrain.land_mask).tolist():
        border_distance = min(x, width - 1 - x, y, height - 1 - y)
        border_bonus = max(0.0, min(1.0, border_distance / max_border_distance))
        inland_bonus = max(0.0, min(1.0, float(terrain.coastal_distance[y, x]) / 8.0))
        priority = 0.8 * float(terrain.suitability[y, x]) + 0.12 * border_bonus + 0.08 * inland_bonus
        candidate = (priority, int(y), int(x), border_distance == 0)
        cells.append(candidate)
        if border_distance > 0:
            interior_cells.append(candidate)

    ranked = sorted(interior_cells if len(interior_cells) >= count else cells, reverse=True)
    sites: list[Site] = []
    while ranked and len(sites) < count:
        best_index = -1
        best_score = -1.0
        for index, (priority, y, x, _is_border) in enumerate(ranked):
            norm_x = float(x / max(width - 1, 1))
            norm_y = float(y / max(height - 1, 1))
            if sites:
                nearest = min(math.hypot(norm_x - site.x, norm_y - site.y) for site in sites)
                if nearest < min_spacing:
                    continue
            else:
                nearest = 1.0
            spread = min(1.0, nearest / max(min_spacing, 1e-9))
            score = 0.72 * priority + 0.28 * spread
            if score > best_score:
                best_score = score
                best_index = index
        if best_index < 0:
            break

        _priority, y, x, _is_border = ranked.pop(best_index)
        norm_x = float(x / max(width - 1, 1))
        norm_y = float(y / max(height - 1, 1))
        river_access = math.exp(-0.22 * float(terrain.river_distance[y, x]))
        site = Site(
            id=len(sites),
            x=norm_x,
            y=norm_y,
            port_access=float(terrain.port_quality[y, x]),
            river_access=river_access,
            arability=float(terrain.arability[y, x]),
            defensibility=float(terrain.defensibility[y, x]),
            accessibility=float(terrain.accessibility[y, x]),
            resource_rent=float(terrain.resource_rent[y, x]),
            suitability=float(terrain.suitability[y, x]),
        )
        sites.append(site)
    return sites
