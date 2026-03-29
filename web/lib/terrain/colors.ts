import type { LayerName } from "./types";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Linearly interpolate between two colors. */
function lerp(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/** Interpolate through a color ramp at position t ∈ [0, 1]. */
function ramp(colors: RGB[], t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  const segment = clamped * (colors.length - 1);
  const i = Math.min(Math.floor(segment), colors.length - 2);
  return lerp(colors[i], colors[i + 1], segment - i);
}

/** Hex string to RGB. */
function hex(s: string): RGB {
  const v = parseInt(s.replace("#", ""), 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

// Muted, desaturated ramps — algorithmic art aesthetic
const RAMPS: Record<LayerName, RGB[]> = {
  elevation: [
    hex("#141e28"),
    hex("#1e2d3d"),
    hex("#2a3d4d"),
    hex("#3a5060"),
    hex("#4a6474"),
    hex("#5a7888"),
    hex("#6a8a98"),
  ],
  arability: [
    hex("#1a1e1a"),
    hex("#222e22"),
    hex("#2a3d2a"),
    hex("#344a34"),
    hex("#3e5a3e"),
    hex("#486a48"),
  ],
  resourceRent: [
    hex("#1a1814"),
    hex("#2a2418"),
    hex("#3a3020"),
    hex("#4a3e2a"),
    hex("#5a4e34"),
    hex("#6a5a3a"),
  ],
  defensibility: [
    hex("#18181e"),
    hex("#222230"),
    hex("#2c2c3e"),
    hex("#38384e"),
    hex("#44445e"),
    hex("#50506e"),
  ],
  portQuality: [
    hex("#101820"),
    hex("#1a2a3a"),
    hex("#243a4a"),
    hex("#2e4a5a"),
    hex("#385a6a"),
    hex("#426a7a"),
  ],
  suitability: [
    hex("#161414"),
    hex("#221e1e"),
    hex("#302828"),
    hex("#403434"),
    hex("#504040"),
    hex("#625050"),
    hex("#746060"),
  ],
};

/** Map a layer value [0,1] to an RGB color. */
export function layerColor(layer: LayerName, value: number): RGB {
  return ramp(RAMPS[layer], value);
}

/** Void / sea color. */
export const VOID: RGB = hex("#08090d");

/** Stroke color for contour lines. */
export const CONTOUR_STROKE: RGB = hex("#2a3a4a");

/** River color. */
export const RIVER: RGB = hex("#3a7a8a");

/** Site marker color. */
export const SITE_MARKER: RGB = hex("#6a8a9a");

/** Accent color for hover/selected. */
export const ACCENT: RGB = hex("#4a9ead");

/** Format RGB to CSS string. */
export function rgbStr(c: RGB, alpha: number = 1): string {
  if (alpha >= 1) return `rgb(${c.r},${c.g},${c.b})`;
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}
