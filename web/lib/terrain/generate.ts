import { createRng, fractalNoise } from "./perlin";
import type { TerrainConfig, TerrainField, Site } from "./types";

/** Index into a width×height flat array. */
function idx(y: number, x: number, width: number): number {
  return y * width + x;
}

/** Normalize array values to [0, 1]. If mask provided, only normalize land cells. */
function normalize(
  values: Float64Array,
  width: number,
  height: number,
  mask?: Uint8Array
): Float64Array {
  const out = new Float64Array(values.length);
  let lo = Infinity;
  let hi = -Infinity;

  for (let i = 0; i < values.length; i++) {
    if (mask && !mask[i]) continue;
    if (values[i] < lo) lo = values[i];
    if (values[i] > hi) hi = values[i];
  }

  if (Math.abs(hi - lo) < 1e-12) return out;

  const scale = 1.0 / (hi - lo);
  for (let i = 0; i < values.length; i++) {
    if (mask && !mask[i]) {
      out[i] = 0;
    } else {
      out[i] = (values[i] - lo) * scale;
    }
  }
  return out;
}

/** Euclidean distance from each cell to nearest true cell in mask. */
function distanceToMask(
  mask: Uint8Array,
  width: number,
  height: number
): Float64Array {
  const dist = new Float64Array(width * height);
  const coords: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[idx(y, x, width)]) coords.push([y, x]);
    }
  }
  if (coords.length === 0) {
    dist.fill(width + height);
    return dist;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minD = Infinity;
      for (const [cy, cx] of coords) {
        const d = Math.sqrt((y - cy) ** 2 + (x - cx) ** 2);
        if (d < minD) minD = d;
      }
      dist[idx(y, x, width)] = minD;
    }
  }
  return dist;
}

/** Derive land mask from elevation. */
function deriveLandMask(
  elevation: Float64Array,
  seaLevel: number,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(y, x, width);
      mask[i] = elevation[i] > seaLevel || x === 0 ? 1 : 0;
    }
  }
  return mask;
}

/** Derive coast mask: land cells adjacent to water. */
function deriveCoastMask(
  landMask: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const coast = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!landMask[idx(y, x, width)]) continue;
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        coast[idx(y, x, width)] = 1;
        continue;
      }
      outer: for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dy === 0 && dx === 0) continue;
          if (!landMask[idx(y + dy, x + dx, width)]) {
            coast[idx(y, x, width)] = 1;
            break outer;
          }
        }
      }
    }
  }
  return coast;
}

/** Compute downstream flow direction for each land cell. Returns [downY, downX] arrays. */
function computeDownstream(
  elevation: Float64Array,
  landMask: Uint8Array,
  width: number,
  height: number
): [Int32Array, Int32Array] {
  const downY = new Int32Array(width * height).fill(-1);
  const downX = new Int32Array(width * height).fill(-1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(y, x, width);
      if (!landMask[i]) continue;
      let bestY = y,
        bestX = x,
        bestElev = elevation[i];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dy === 0 && dx === 0) continue;
          const ny = y + dy,
            nx = x + dx;
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
          const ni = idx(ny, nx, width);
          if (elevation[ni] < bestElev) {
            bestY = ny;
            bestX = nx;
            bestElev = elevation[ni];
          }
        }
      }
      downY[i] = bestY;
      downX[i] = bestX;
    }
  }
  return [downY, downX];
}

/** Derive river network via flow accumulation. */
function deriveRiver(
  elevation: Float64Array,
  landMask: Uint8Array,
  coastMask: Uint8Array,
  config: TerrainConfig,
  width: number,
  height: number
): [Uint8Array, Float64Array] {
  const [downY, downX] = computeDownstream(
    elevation,
    landMask,
    width,
    height
  );

  // Flow accumulation
  const flux = new Float64Array(width * height);
  for (let i = 0; i < flux.length; i++) flux[i] = landMask[i] ? 1 : 0;

  // Sort land cells by elevation descending
  const landCells: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (landMask[idx(y, x, width)]) landCells.push([y, x]);
    }
  }
  landCells.sort(
    (a, b) => elevation[idx(b[0], b[1], width)] - elevation[idx(a[0], a[1], width)]
  );

  for (const [y, x] of landCells) {
    const i = idx(y, x, width);
    const ny = downY[i],
      nx = downX[i];
    if (ny === y && nx === x) continue;
    flux[idx(ny, nx, width)] += flux[i];
  }

  // Find river source: high elevation, inland, max flux×elevation
  const inlandDist = distanceToMask(coastMask, width, height);
  let bestScore = -1;
  let sourceY = 0,
    sourceX = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(y, x, width);
      if (!landMask[i] || inlandDist[i] <= 4) continue;
      // Check quantile inline: only consider top cells
      if (elevation[i] < config.seaLevel + 0.5) continue;
      const score = flux[i] * elevation[i];
      if (score > bestScore) {
        bestScore = score;
        sourceY = y;
        sourceX = x;
      }
    }
  }

  // If we didn't find a good source, relax constraints
  if (bestScore < 0) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = idx(y, x, width);
        if (!landMask[i]) continue;
        const score = flux[i] * elevation[i];
        if (score > bestScore) {
          bestScore = score;
          sourceY = y;
          sourceX = x;
        }
      }
    }
  }

  // Trace river from source downstream to coast
  const river = new Uint8Array(width * height);
  let ry = sourceY,
    rx = sourceX;
  for (let step = 0; step < width * height; step++) {
    const ri = idx(ry, rx, width);
    if (!landMask[ri]) break;
    river[ri] = 1;
    if (coastMask[ri]) break;
    const ny = downY[ri],
      nx = downX[ri];
    if (ny === ry && nx === rx) break;
    ry = ny;
    rx = nx;
  }

  return [river, flux];
}

/**
 * Generate full terrain field from config. Port of Python generate_terrain().
 */
export function generateTerrain(config: TerrainConfig): TerrainField {
  const { width, height } = config;
  const rng = createRng(config.seed);

  // Base fractal noise
  const baseNoise = fractalNoise(
    width,
    height,
    config.octaves,
    config.persistence,
    config.lacunarity,
    rng
  );

  // Resource noise with different seed
  const rng2 = createRng(config.seed + 97);
  const resourceNoise = fractalNoise(
    width,
    height,
    config.octaves,
    config.persistence,
    config.lacunarity,
    rng2
  );

  // Build coordinate grids
  const gridX = new Float64Array(width * height);
  const gridY = new Float64Array(width * height);
  for (let iy = 0; iy < height; iy++) {
    const y = -1 + (2 * iy) / (height - 1);
    for (let ix = 0; ix < width; ix++) {
      const x = -1 + (2 * ix) / (width - 1);
      const i = idx(iy, ix, width);
      gridX[i] = x;
      gridY[i] = y;
    }
  }

  // Peninsula shaping
  const elevation = new Float64Array(width * height);
  for (let i = 0; i < elevation.length; i++) {
    const x = gridX[i],
      y = gridY[i];
    const spine = 0.9 - 1.45 * y * y;
    const taper = 0.35 - 0.45 * (x + 0.15) ** 2 - 0.55 * x;
    const headland =
      0.28 * Math.exp(-((x - 0.45) ** 2 / 0.09 + (y * y) / 0.26));
    const bridge =
      0.22 * Math.exp(-((x + 1.0) ** 2 / 0.02 + (y * y) / 0.5));
    elevation[i] = 0.85 * baseNoise[i] + spine + taper + headland + bridge;
  }

  const normElev = normalize(elevation, width, height);

  // Masks
  const landMask = deriveLandMask(normElev, config.seaLevel, width, height);
  const coastMask = deriveCoastMask(landMask, width, height);
  const [riverMask, waterFlux] = deriveRiver(
    normElev,
    landMask,
    coastMask,
    config,
    width,
    height
  );

  // Distance fields
  const coastalDistance = distanceToMask(coastMask, width, height);
  const riverDistance = distanceToMask(riverMask, width, height);

  // Slope
  const slopeArr = new Float64Array(width * height);
  for (let iy = 0; iy < height; iy++) {
    for (let ix = 0; ix < width; ix++) {
      const i = idx(iy, ix, width);
      const ex =
        ix < width - 1
          ? normElev[idx(iy, ix + 1, width)] - normElev[i]
          : normElev[i] - normElev[idx(iy, ix - 1, width)];
      const ey =
        iy < height - 1
          ? normElev[idx(iy + 1, ix, width)] - normElev[i]
          : normElev[i] - normElev[idx(iy - 1, ix, width)];
      slopeArr[i] = Math.sqrt(ex * ex + ey * ey);
    }
  }
  const normSlope = normalize(slopeArr, width, height, landMask);

  // Accessibility
  const accessRaw = new Float64Array(width * height);
  for (let i = 0; i < accessRaw.length; i++) {
    accessRaw[i] = Math.exp(
      -Math.sqrt((gridX[i] + 1) ** 2 + gridY[i] ** 2) * 1.2
    );
  }
  const accessibility = normalize(accessRaw, width, height, landMask);

  // Arability
  const arabilityRaw = new Float64Array(width * height);
  for (let i = 0; i < arabilityRaw.length; i++) {
    arabilityRaw[i] =
      (1 - normSlope[i]) *
      Math.exp(-0.18 * riverDistance[i]) *
      (1 - Math.max(0, Math.min(1, normElev[i] - config.seaLevel)));
  }
  const arability = normalize(arabilityRaw, width, height, landMask);

  // Defensibility
  const defRaw = new Float64Array(width * height);
  const normCoastDist = normalize(coastalDistance, width, height, landMask);
  for (let i = 0; i < defRaw.length; i++) {
    defRaw[i] = 0.55 * normSlope[i] + 0.45 * normCoastDist[i];
  }
  const defensibility = normalize(defRaw, width, height, landMask);

  // Port quality
  const portRaw = new Float64Array(width * height);
  for (let i = 0; i < portRaw.length; i++) {
    portRaw[i] =
      Math.exp(-1.1 * coastalDistance[i]) * (1 - 0.6 * normSlope[i]);
  }
  const portQuality = normalize(portRaw, width, height, landMask);

  // Resource rent
  const geologyRaw = new Float64Array(width * height);
  for (let i = 0; i < geologyRaw.length; i++) {
    const x = gridX[i],
      y = gridY[i];
    geologyRaw[i] =
      0.55 * resourceNoise[i] +
      0.45 *
        Math.exp(
          -((x - 0.1) ** 2 / 0.55 + (y + 0.15) ** 2 / 0.3)
        );
  }
  const resourceRent = normalize(geologyRaw, width, height, landMask);

  // Suitability
  const suitRaw = new Float64Array(width * height);
  for (let i = 0; i < suitRaw.length; i++) {
    suitRaw[i] =
      0.28 * portQuality[i] +
      0.2 * Math.exp(-0.2 * riverDistance[i]) +
      0.18 * accessibility[i] +
      0.18 * arability[i] +
      0.1 * defensibility[i] +
      0.06 * resourceRent[i];
  }
  const suitability = normalize(suitRaw, width, height, landMask);

  // Zero out sea cells
  const layers = [
    normElev,
    waterFlux,
    coastalDistance,
    riverDistance,
    accessibility,
    arability,
    resourceRent,
    defensibility,
    portQuality,
    suitability,
  ];
  for (const layer of layers) {
    for (let i = 0; i < layer.length; i++) {
      if (!landMask[i]) layer[i] = 0;
    }
  }

  return {
    config,
    elevation: normElev,
    landMask,
    coastMask,
    riverMask,
    waterFlux,
    coastalDistance: coastalDistance,
    riverDistance: riverDistance,
    accessibility,
    arability,
    resourceRent,
    defensibility,
    portQuality,
    suitability,
  };
}

/**
 * Select candidate settlement sites. Port of Python select_candidate_sites().
 */
export function selectCandidateSites(
  terrain: TerrainField,
  count: number = 15,
  minSpacing: number = 0.12
): Site[] {
  const { width, height } = terrain.config;
  const sites: Site[] = [];

  // Collect all land cells with suitability
  const cells: { y: number; x: number; suit: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(y, x, width);
      if (terrain.landMask[i]) {
        cells.push({ y, x, suit: terrain.suitability[i] });
      }
    }
  }
  cells.sort((a, b) => b.suit - a.suit);

  for (const cell of cells) {
    const normX = cell.x / Math.max(width - 1, 1);
    const normY = cell.y / Math.max(height - 1, 1);

    const tooClose = sites.some(
      (s) => Math.hypot(normX - s.x, normY - s.y) < minSpacing
    );
    if (tooClose) continue;

    const i = idx(cell.y, cell.x, width);
    sites.push({
      id: sites.length,
      x: normX,
      y: normY,
      portAccess: terrain.portQuality[i],
      riverAccess: Math.exp(-0.22 * terrain.riverDistance[i]),
      arability: terrain.arability[i],
      defensibility: terrain.defensibility[i],
      accessibility: terrain.accessibility[i],
      resourceRent: terrain.resourceRent[i],
      suitability: terrain.suitability[i],
    });

    if (sites.length >= count) break;
  }

  return sites;
}
