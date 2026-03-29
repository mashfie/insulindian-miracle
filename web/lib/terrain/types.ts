export interface TerrainConfig {
  width: number;
  height: number;
  seed: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seaLevel: number;
  riverSourceQuantile: number;
}

export interface Site {
  id: number;
  x: number;
  y: number;
  portAccess: number;
  riverAccess: number;
  arability: number;
  defensibility: number;
  accessibility: number;
  resourceRent: number;
  suitability: number;
}

export interface TerrainField {
  config: TerrainConfig;
  elevation: Float64Array;
  landMask: Uint8Array;
  coastMask: Uint8Array;
  riverMask: Uint8Array;
  waterFlux: Float64Array;
  coastalDistance: Float64Array;
  riverDistance: Float64Array;
  accessibility: Float64Array;
  arability: Float64Array;
  resourceRent: Float64Array;
  defensibility: Float64Array;
  portQuality: Float64Array;
  suitability: Float64Array;
}

export type LayerName =
  | "elevation"
  | "arability"
  | "resourceRent"
  | "defensibility"
  | "portQuality"
  | "suitability";

export const DEFAULT_CONFIG: TerrainConfig = {
  width: 64,
  height: 64,
  seed: 7,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0,
  seaLevel: 0.08,
  riverSourceQuantile: 0.8,
};
