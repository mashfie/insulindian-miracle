"use client";

import { useEffect, useMemo, useRef } from "react";
import { Heerich } from "heerich";
import type { AtlasSite } from "@/lib/content/types";

type VoxelMapProps = {
  data: number[][];
  width: number;
  height: number;
  color?: [number, number, number];
  overlayData?: number[][];
  sites?: AtlasSite[];
  landMask?: boolean[][];
};

/**
 * Heerich-powered isometric terrain renderer.
 * Terrain shape comes from `data` (elevation). When `overlayData` is provided,
 * face color is driven by that layer instead — enabling thematic map coloring
 * over a consistent 3D terrain form.
 */
export function VoxelMap({
  data,
  width,
  height,
  color = [100, 110, 120],
  overlayData,
  sites = [],
  landMask,
}: VoxelMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const svgString = useMemo(() => {
    const h = new Heerich({
      tile: 12,
      camera: { type: "oblique", angle: 45, distance: 18 },
    });

    const maxStack = 6;

    h.applyGeometry({
      type: "fill",
      bounds: [[0, 0, 0], [width - 1, maxStack, height - 1]],
      test: (x: number, y: number, z: number) => {
        if (x < 0 || x >= width || z < 0 || z >= height) return false;
        if (landMask) {
          if (!landMask[z]?.[x]) return false;
        }
        const elev = data[z]?.[x] ?? 0;
        const stackH = Math.floor(elev * maxStack);
        return y <= stackH;
      },
      style: {
        default: (x: number, y: number, z: number) => {
          const elev = data[z]?.[x] ?? 0;
          const maxH = Math.floor(elev * maxStack);
          const isTop = y === maxH;
          // Color driven by overlayData when present, elevation otherwise
          const t = overlayData?.[z]?.[x] ?? elev;

          const r = Math.round(color[0] + t * 80);
          const g = Math.round(color[1] + t * 60);
          const b = Math.round(color[2] - t * 30);

          if (isTop) {
            return {
              fill: `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 45)}, ${Math.min(255, b + 20)})`,
              stroke: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`,
              strokeWidth: 0.3,
            };
          }
          return {
            fill: `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 25)}, ${Math.max(0, b - 10)})`,
            stroke: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.08)`,
            strokeWidth: 0.2,
          };
        },
        top: (x: number, _y: number, z: number) => {
          const elev = data[z]?.[x] ?? 0;
          const t = overlayData?.[z]?.[x] ?? elev;
          return {
            fill: `rgb(${Math.min(255, Math.round(color[0] + t * 130))}, ${Math.min(255, Math.round(color[1] + t * 105))}, ${Math.min(255, Math.round(color[2] + t * 50))})`,
            stroke: `rgba(13, 13, 13, 0.12)`,
            strokeWidth: 0.4,
          };
        },
      },
    });

    for (const site of sites) {
      const sx = Math.round(site.x * (width - 1));
      // site.y is normalized top-to-bottom in source coords; data rows are
      // flipped so z=0 is the last source row — mirror the y coordinate
      const sz = (height - 1) - Math.round(site.y * (height - 1));
      const baseElev = data[sz]?.[sx] ?? 0;
      const baseH = Math.floor(baseElev * maxStack);

      if (site.boomtown) {
        h.applyGeometry({
          type: "box",
          position: [sx, baseH + 1, sz],
          size: [1, 4, 1],
          style: {
            default: { fill: "#8a3824", stroke: "#4a1810", strokeWidth: 0.5 },
            top: { fill: "#c44d32", stroke: "#8a3824", strokeWidth: 0.5 },
          },
        });
      } else if (site.trade_cluster) {
        h.applyGeometry({
          type: "box",
          position: [sx - 1, baseH + 1, sz - 1],
          size: [3, 2, 3],
          style: {
            default: { fill: "#3f5c52", stroke: "#1a2c26", strokeWidth: 0.5 },
            top: { fill: "#5a8a78", stroke: "#3f5c52", strokeWidth: 0.5 },
          },
        });
      } else {
        h.applyGeometry({
          type: "box",
          position: [sx, baseH + 1, sz],
          size: [1, 2, 1],
          style: {
            default: { fill: "#0d0d0d", stroke: "#333", strokeWidth: 0.4 },
            top: { fill: "#fef5f0", stroke: "#0d0d0d", strokeWidth: 0.5 },
          },
        });
      }

      h.applyGeometry({
        type: "box",
        position: [sx, baseH + (site.boomtown ? 5 : 3), sz],
        size: 1,
        content: `<text font-family="var(--font-ui)" font-size="8" fill="#0d0d0d" font-weight="bold" text-anchor="middle" dominant-baseline="central">S${site.id}</text>`,
        opaque: false,
      });
    }

    return h.toSVG({ padding: 20 });
  }, [data, width, height, color, overlayData, sites, landMask]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = svgString;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "100%";
    }
  }, [svgString]);

  return (
    <div
      ref={containerRef}
      className="voxel-map"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
