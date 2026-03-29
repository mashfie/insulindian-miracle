/**
 * Seeded PRNG (mulberry32). Returns values in [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Perlin fade curve: 6t^5 - 15t^4 + 10t^3 */
function fade(t: number): number {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

/**
 * Generate a single octave of Perlin noise on a width×height grid.
 * `resolution` controls the gradient grid size.
 */
export function perlinNoise(
  width: number,
  height: number,
  resolution: number,
  rng: () => number
): Float64Array {
  // Build gradient vectors
  const gSize = resolution + 1;
  const gx = new Float64Array(gSize * gSize);
  const gy = new Float64Array(gSize * gSize);
  for (let i = 0; i < gSize * gSize; i++) {
    const angle = rng() * 2.0 * Math.PI;
    gx[i] = Math.cos(angle);
    gy[i] = Math.sin(angle);
  }

  const noise = new Float64Array(height * width);
  for (let iy = 0; iy < height; iy++) {
    const py = (iy / Math.max(height - 1, 1)) * resolution;
    const y0 = Math.floor(py);
    const y1 = Math.min(y0 + 1, resolution);
    const ty = py - y0;
    const sy = fade(ty);

    for (let ix = 0; ix < width; ix++) {
      const px = (ix / Math.max(width - 1, 1)) * resolution;
      const x0 = Math.floor(px);
      const x1 = Math.min(x0 + 1, resolution);
      const tx = px - x0;
      const sx = fade(tx);

      const i00 = y0 * gSize + x0;
      const i10 = y0 * gSize + x1;
      const i01 = y1 * gSize + x0;
      const i11 = y1 * gSize + x1;

      const d00 = gx[i00] * tx + gy[i00] * ty;
      const d10 = gx[i10] * (tx - 1) + gy[i10] * ty;
      const d01 = gx[i01] * tx + gy[i01] * (ty - 1);
      const d11 = gx[i11] * (tx - 1) + gy[i11] * (ty - 1);

      const nx0 = (1 - sx) * d00 + sx * d10;
      const nx1 = (1 - sx) * d01 + sx * d11;
      noise[iy * width + ix] = (1 - sy) * nx0 + sy * nx1;
    }
  }
  return noise;
}

/**
 * Fractal Brownian motion: sum multiple octaves of Perlin noise.
 */
export function fractalNoise(
  width: number,
  height: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  rng: () => number
): Float64Array {
  const total = new Float64Array(width * height);
  let amplitude = 1.0;
  let frequency = 2;
  let amplitudeSum = 0.0;

  for (let o = 0; o < octaves; o++) {
    const octave = perlinNoise(width, height, frequency, rng);
    for (let i = 0; i < total.length; i++) {
      total[i] += amplitude * octave[i];
    }
    amplitudeSum += amplitude;
    amplitude *= persistence;
    frequency = Math.max(2, Math.round(frequency * lacunarity));
  }

  const scale = 1.0 / Math.max(amplitudeSum, 1e-9);
  for (let i = 0; i < total.length; i++) {
    total[i] *= scale;
  }
  return total;
}
