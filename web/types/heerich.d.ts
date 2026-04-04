declare module "heerich" {
  type FaceName = "top" | "bottom" | "left" | "right" | "front" | "back" | "default";

  type StyleObject = {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    [key: string]: unknown;
  };

  type StyleFn = (x: number, y: number, z: number) => StyleObject;

  type FaceStyles = Partial<Record<FaceName, StyleObject | StyleFn>>;

  type CameraConfig =
    | { type: "oblique"; angle?: number; distance?: number }
    | { type: "perspective"; position?: [number, number]; distance?: number };

  type GeometryOptions = {
    type: "box" | "sphere" | "line" | "fill";
    position?: [number, number, number];
    center?: [number, number, number];
    size?: number | [number, number, number];
    radius?: number;
    from?: [number, number, number];
    to?: [number, number, number];
    bounds?: [[number, number, number], [number, number, number]];
    test?: (x: number, y: number, z: number) => boolean;
    mode?: "union" | "subtract" | "intersect" | "exclude";
    style?: FaceStyles;
    content?: string;
    opaque?: boolean;
    meta?: Record<string, unknown>;
    rotate?: { axis: "x" | "y" | "z"; turns: number };
    scale?: [number, number, number] | ((x: number, y: number, z: number) => [number, number, number] | null);
    scaleOrigin?: [number, number, number];
    shape?: "rounded" | "square";
  };

  type SVGOptions = {
    padding?: number;
    viewBox?: [number, number, number, number];
    offset?: [number, number];
    prepend?: string;
    append?: string;
    faces?: unknown[];
    faceAttributes?: (face: unknown) => Record<string, string>;
    occlusion?: boolean;
    resolveOcclusion?: (subject: unknown, occluders: unknown[]) => string | null;
  };

  export class Heerich {
    constructor(options?: {
      tile?: number;
      camera?: CameraConfig;
      style?: FaceStyles;
    });

    applyGeometry(options: GeometryOptions): void;
    removeGeometry(options: GeometryOptions): void;
    addGeometry(options: GeometryOptions): void;
    applyStyle(options: GeometryOptions): void;
    setCamera(config: Partial<CameraConfig>): void;
    rotate(options: { axis: "x" | "y" | "z"; turns: number; center?: [number, number, number] }): void;
    toSVG(options?: SVGOptions): string;
    getFaces(): unknown[];
    getBounds(padding?: number, faces?: unknown[]): { x: number; y: number; w: number; h: number };
    getVoxel(position: [number, number, number]): unknown | null;
    hasVoxel(position: [number, number, number]): boolean;
    toJSON(): unknown;
    [Symbol.iterator](): Iterator<unknown>;
  }
}
