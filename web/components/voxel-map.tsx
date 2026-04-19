"use client";

import { useEffect, useMemo, useRef } from "react";
import { Heerich } from "heerich";
import type { AtlasSite } from "@/lib/content/types";

type HeerichWithDecals = Heerich & {
  defineDecal: (name: string, decal: { content: string }) => void;
};

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
 * Fixed for Y-up/down visual alignment and subtle gradients.
 */
export function VoxelMap({
  data,
  width,
  height,
  overlayData,
  sites = [],
  landMask,
}: VoxelMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const svgString = useMemo(() => {
    const h = new Heerich({
      tile: 12,
      camera: { type: "oblique", angle: 45, distance: 18 },
    }) as HeerichWithDecals;

    // Define decals for sites
    h.defineDecal("boomtown-mark", {
      content: '<path d="M 0.2 0.2 L 0.8 0.8 M 0.8 0.2 L 0.2 0.8" stroke="#fef5f0" stroke-width="0.1" fill="none" vector-effect="non-scaling-stroke"/>'
    });
    
    h.defineDecal("trade-mark", {
      content: '<circle cx="0.5" cy="0.5" r="0.3" stroke="#fef5f0" stroke-width="0.1" fill="none" vector-effect="non-scaling-stroke"/>'
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
        // Builds from Y=0 (bottom) up to stackH (top)
        return y <= stackH;
      },
      style: {
        default: (x: number, y: number, z: number) => {
          const elev = data[z]?.[x] ?? 0;
          const maxH = Math.floor(elev * maxStack);
          const isTop = y === maxH;
          const t = overlayData?.[z]?.[x] ?? elev;

          // Hiroshige palette mapping: Indigo for valleys, Sandstone/Moss for mid, Dawn Pink for peaks
          const baseColor = t < 0.3 ? "#243D5C" : t < 0.7 ? "#5D7275" : "#F0C1A4";
          const stroke = "#2B2821";

          if (isTop) {
            return {
              fill: `color-mix(in lab, ${baseColor}, #fff ${10 + y * 4}%)`,
              stroke,
              strokeWidth: 0.3,
            };
          }
          return {
            fill: `color-mix(in lab, ${baseColor}, #000 ${20 - y * 3}%)`,
            stroke,
            strokeWidth: 0.2,
            opacity: 0.8,
            hatch: {
              angle: 45,
              period: 3,
              stroke: `color-mix(in lab, ${baseColor}, #000 40%)`,
              strokeWidth: 0.5
            }
          };
        },
        top: (x: number, y: number, z: number) => {
          const elev = data[z]?.[x] ?? 0;
          const t = overlayData?.[z]?.[x] ?? elev;
          const baseColor = t < 0.3 ? "#243D5C" : t < 0.7 ? "#5D7275" : "#F0C1A4";
          return {
            fill: `color-mix(in lab, ${baseColor}, #fff ${30 + y * 5}%)`,
            stroke: "#2B2821",
            strokeWidth: 0.4,
          };
        },
      },
    });

    for (const site of sites) {
      const sx = Math.round(site.x * (width - 1));
      const sz = (height - 1) - Math.round(site.y * (height - 1));
      const baseElev = data[sz]?.[sx] ?? 0;
      const baseH = Math.floor(baseElev * maxStack);

      if (site.boomtown) {
        h.applyGeometry({
          type: "box",
          position: [sx, baseH + 1, sz],
          size: [1, 4, 1],
          style: {
            default: { fill: "#8a3824", stroke: "rgba(13,13,13,0.2)", strokeWidth: 0.4 },
            top: { fill: "#c44d32", stroke: "rgba(13,13,13,0.3)", strokeWidth: 0.4, decal: "boomtown-mark" },
          },
        });
      } else if (site.trade_cluster) {
        h.applyGeometry({
          type: "box",
          position: [sx - 1, baseH + 1, sz - 1],
          size: [3, 2, 3],
          style: {
            default: { fill: "#3f5c52", stroke: "rgba(13,13,13,0.2)", strokeWidth: 0.4 },
            top: { fill: "#5a8a78", stroke: "rgba(13,13,13,0.3)", strokeWidth: 0.4, decal: "trade-mark" },
          },
        });
      } else {
        h.applyGeometry({
          type: "box",
          position: [sx, baseH + 1, sz],
          size: [1, 2, 1],
          style: {
            default: { fill: "#0d0d0d", stroke: "rgba(13,13,13,0.2)", strokeWidth: 0.4 },
            top: { fill: "#fef5f0", stroke: "rgba(13,13,13,0.3)", strokeWidth: 0.4 },
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
  }, [data, width, height, overlayData, sites, landMask]);

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
