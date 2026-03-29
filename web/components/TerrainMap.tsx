"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { TerrainField, Site, LayerName } from "@/lib/terrain/types";
import {
  layerColor,
  VOID,
  CONTOUR_STROKE,
  RIVER,
  SITE_MARKER,
  ACCENT,
  rgbStr,
} from "@/lib/terrain/colors";

interface TerrainMapProps {
  terrain: TerrainField;
  sites: Site[];
  activeLayer: LayerName;
  onSiteHover?: (site: Site | null) => void;
  fullBleed?: boolean;
}

const BASE_SIZE = 640;
const CONTOUR_LEVELS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

function idx(y: number, x: number, w: number): number {
  return y * w + x;
}

function getLayerData(terrain: TerrainField, layer: LayerName): Float64Array {
  switch (layer) {
    case "elevation":
      return terrain.elevation;
    case "arability":
      return terrain.arability;
    case "resourceRent":
      return terrain.resourceRent;
    case "defensibility":
      return terrain.defensibility;
    case "portQuality":
      return terrain.portQuality;
    case "suitability":
      return terrain.suitability;
  }
}

export default function TerrainMap({
  terrain,
  sites,
  activeLayer,
  onSiteHover,
  fullBleed = false,
}: TerrainMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSite, setHoveredSite] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState(BASE_SIZE);
  const [transitioning, setTransitioning] = useState(false);
  const prevLayerRef = useRef(activeLayer);
  const { width, height } = terrain.config;

  // Resize observer for full-bleed mode
  useEffect(() => {
    if (!fullBleed || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const size = Math.max(entry.contentRect.width, entry.contentRect.height);
        setCanvasSize(Math.ceil(size));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fullBleed]);

  const renderToCanvas = useCallback(
    (canvas: HTMLCanvasElement, layer: LayerName, size: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const data = getLayerData(terrain, layer);
      const cellSize = size / width;

      // Clear to void
      ctx.fillStyle = rgbStr(VOID);
      ctx.fillRect(0, 0, size, size);

      // --- Point cloud: render land cells as dots ---
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = idx(y, x, width);
          if (!terrain.landMask[i]) continue;

          const value = data[i];
          const color = layerColor(layer, value);
          const alpha = 0.3 + 0.7 * value;
          const dotSize = 2 + 4 * value;
          const scale = size / BASE_SIZE;

          ctx.fillStyle = rgbStr(color, alpha);
          ctx.beginPath();
          ctx.arc(
            (x + 0.5) * cellSize,
            (y + 0.5) * cellSize,
            dotSize * 0.5 * scale,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // --- Contour strata: hollow isolines ---
      ctx.strokeStyle = rgbStr(CONTOUR_STROKE, 0.4);
      ctx.lineWidth = 0.7 * (size / BASE_SIZE);

      for (const level of CONTOUR_LEVELS) {
        ctx.beginPath();
        for (let cy = 0; cy < height - 1; cy++) {
          for (let cx = 0; cx < width - 1; cx++) {
            const v00 = terrain.elevation[idx(cy, cx, width)];
            const v10 = terrain.elevation[idx(cy, cx + 1, width)];
            const v01 = terrain.elevation[idx(cy + 1, cx, width)];
            const v11 = terrain.elevation[idx(cy + 1, cx + 1, width)];

            const a = v00 >= level ? 1 : 0;
            const b = v10 >= level ? 1 : 0;
            const c = v11 >= level ? 1 : 0;
            const d = v01 >= level ? 1 : 0;
            const code = a | (b << 1) | (c << 2) | (d << 3);
            if (code === 0 || code === 15) continue;

            const lerpEdge = (va: number, vb: number): number => {
              if (Math.abs(vb - va) < 1e-10) return 0.5;
              return (level - va) / (vb - va);
            };

            const px = (gx: number) => gx * cellSize;
            const py = (gy: number) => gy * cellSize;

            const tTop = lerpEdge(v00, v10);
            const topX = px(cx + tTop);
            const topY = py(cy);
            const tRight = lerpEdge(v10, v11);
            const rightX = px(cx + 1);
            const rightY = py(cy + tRight);
            const tBottom = lerpEdge(v01, v11);
            const bottomX = px(cx + tBottom);
            const bottomY = py(cy + 1);
            const tLeft = lerpEdge(v00, v01);
            const leftX = px(cx);
            const leftY = py(cy + tLeft);

            const segments: [number, number, number, number][] = [];

            switch (code) {
              case 1: segments.push([topX, topY, leftX, leftY]); break;
              case 2: segments.push([topX, topY, rightX, rightY]); break;
              case 3: segments.push([leftX, leftY, rightX, rightY]); break;
              case 4: segments.push([rightX, rightY, bottomX, bottomY]); break;
              case 5:
                segments.push([topX, topY, rightX, rightY]);
                segments.push([bottomX, bottomY, leftX, leftY]);
                break;
              case 6: segments.push([topX, topY, bottomX, bottomY]); break;
              case 7: segments.push([leftX, leftY, bottomX, bottomY]); break;
              case 8: segments.push([leftX, leftY, bottomX, bottomY]); break;
              case 9: segments.push([topX, topY, bottomX, bottomY]); break;
              case 10:
                segments.push([topX, topY, leftX, leftY]);
                segments.push([rightX, rightY, bottomX, bottomY]);
                break;
              case 11: segments.push([rightX, rightY, bottomX, bottomY]); break;
              case 12: segments.push([leftX, leftY, rightX, rightY]); break;
              case 13: segments.push([topX, topY, rightX, rightY]); break;
              case 14: segments.push([topX, topY, leftX, leftY]); break;
            }

            for (const [x1, y1, x2, y2] of segments) {
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
            }
          }
        }
        ctx.stroke();
      }

      // --- River trace ---
      const riverCells: [number, number][] = [];
      for (let ry = 0; ry < height; ry++) {
        for (let rx = 0; rx < width; rx++) {
          if (terrain.riverMask[idx(ry, rx, width)]) {
            riverCells.push([ry, rx]);
          }
        }
      }
      if (riverCells.length > 1) {
        riverCells.sort(
          (ra, rb) =>
            terrain.elevation[idx(rb[0], rb[1], width)] -
            terrain.elevation[idx(ra[0], ra[1], width)]
        );
        ctx.beginPath();
        ctx.strokeStyle = rgbStr(RIVER, 0.9);
        ctx.lineWidth = 1.2 * (size / BASE_SIZE);
        ctx.moveTo(
          (riverCells[0][1] + 0.5) * cellSize,
          (riverCells[0][0] + 0.5) * cellSize
        );

        const visited = new Set<string>();
        let current = riverCells[0];
        visited.add(`${current[0]},${current[1]}`);

        for (let step = 0; step < riverCells.length; step++) {
          let found = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dy === 0 && dx === 0) continue;
              const ny = current[0] + dy;
              const nx = current[1] + dx;
              const key = `${ny},${nx}`;
              if (
                ny >= 0 && ny < height && nx >= 0 && nx < width &&
                terrain.riverMask[idx(ny, nx, width)] &&
                !visited.has(key)
              ) {
                ctx.lineTo((nx + 0.5) * cellSize, (ny + 0.5) * cellSize);
                visited.add(key);
                current = [ny, nx];
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (!found) break;
        }
        ctx.stroke();
      }

      // --- Coast boundary: dotted line ---
      ctx.strokeStyle = rgbStr(CONTOUR_STROKE, 0.5);
      ctx.lineWidth = 0.8 * (size / BASE_SIZE);
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      for (let cy = 0; cy < height; cy++) {
        for (let cx = 0; cx < width; cx++) {
          if (!terrain.coastMask[idx(cy, cx, width)]) continue;
          const ccx = (cx + 0.5) * cellSize;
          const ccy = (cy + 0.5) * cellSize;
          ctx.moveTo(ccx + 1, ccy);
          ctx.arc(ccx, ccy, 1 * (size / BASE_SIZE), 0, Math.PI * 2);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Site markers: hollow circles + crosshairs ---
      const scale = size / BASE_SIZE;
      for (const site of sites) {
        const sx = site.x * size;
        const sy = site.y * size;
        const isHovered = hoveredSite === site.id;
        const color = isHovered ? ACCENT : SITE_MARKER;
        const radius = (isHovered ? 8 : 6) * scale;

        ctx.strokeStyle = rgbStr(color, 0.6);
        ctx.lineWidth = 0.8 * scale;
        ctx.beginPath();
        ctx.moveTo(sx - radius - 2 * scale, sy);
        ctx.lineTo(sx - radius + 3 * scale, sy);
        ctx.moveTo(sx + radius - 3 * scale, sy);
        ctx.lineTo(sx + radius + 2 * scale, sy);
        ctx.moveTo(sx, sy - radius - 2 * scale);
        ctx.lineTo(sx, sy - radius + 3 * scale);
        ctx.moveTo(sx, sy + radius - 3 * scale);
        ctx.lineTo(sx, sy + radius + 2 * scale);
        ctx.stroke();

        ctx.strokeStyle = rgbStr(color, isHovered ? 1 : 0.7);
        ctx.lineWidth = (isHovered ? 1.5 : 1) * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = rgbStr(color, isHovered ? 1 : 0.6);
        ctx.font = `${(isHovered ? 10 : 9) * scale}px "Geist Mono", monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(`S${site.id}`, sx + radius + 3 * scale, sy - 2 * scale);
      }

      // --- Registration marks ---
      ctx.strokeStyle = rgbStr(CONTOUR_STROKE, 0.3);
      ctx.lineWidth = 0.5 * scale;
      const tickLen = 8 * scale;

      const corners = [
        [0, 0], [size, 0], [0, size], [size, size],
      ];
      for (const [ccx, ccy] of corners) {
        ctx.beginPath();
        const ddx = ccx === 0 ? 1 : -1;
        const ddy = ccy === 0 ? 1 : -1;
        ctx.moveTo(ccx, ccy + ddy * tickLen);
        ctx.lineTo(ccx, ccy);
        ctx.lineTo(ccx + ddx * tickLen, ccy);
        ctx.stroke();
      }

      // Seed readout
      ctx.fillStyle = rgbStr(CONTOUR_STROKE, 0.4);
      ctx.font = `${8 * scale}px "Geist Mono", monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(
        `SEED ${terrain.config.seed}  ${width}\u00D7${height}`,
        size - 4 * scale,
        4 * scale
      );

      ctx.textAlign = "left";
      ctx.fillText(layer.toUpperCase(), 4 * scale, 4 * scale);

      // Scale ticks along bottom
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      for (let i = 0; i <= 4; i++) {
        const tx = (i / 4) * size;
        ctx.beginPath();
        ctx.moveTo(tx, size);
        ctx.lineTo(tx, size - 4 * scale);
        ctx.stroke();
        if (i > 0 && i < 4) {
          ctx.fillText(`${(i / 4).toFixed(2)}`, tx, size - 5 * scale);
        }
      }
    },
    [terrain, sites, hoveredSite, width, height]
  );

  // Layer crossfade effect
  useEffect(() => {
    if (prevLayerRef.current !== activeLayer) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        prevLayerRef.current = activeLayer;
        setTransitioning(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [activeLayer]);

  // Render front canvas
  useEffect(() => {
    const canvas = frontCanvasRef.current;
    if (!canvas || transitioning) return;
    renderToCanvas(canvas, activeLayer, canvasSize);
  }, [renderToCanvas, activeLayer, canvasSize, transitioning]);

  // Also render when transitioning ends
  useEffect(() => {
    if (!transitioning) {
      const canvas = frontCanvasRef.current;
      if (canvas) renderToCanvas(canvas, activeLayer, canvasSize);
    }
  }, [transitioning, renderToCanvas, activeLayer, canvasSize]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      let closest: Site | null = null;
      let minDist = fullBleed ? 0.04 : 0.03;
      for (const site of sites) {
        const d = Math.hypot(mx - site.x, my - site.y);
        if (d < minDist) {
          minDist = d;
          closest = site;
        }
      }
      setHoveredSite(closest?.id ?? null);
      onSiteHover?.(closest);
    },
    [sites, onSiteHover, fullBleed]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredSite(null);
    onSiteHover?.(null);
  }, [onSiteHover]);

  if (fullBleed) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 scanlines animate-terrain"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={frontCanvasRef}
          width={canvasSize}
          height={canvasSize}
          className={`w-full h-full object-cover terrain-canvas ${
            transitioning ? "terrain-transitioning" : ""
          }`}
          style={{ imageRendering: "pixelated" }}
        />
        <canvas
          ref={backCanvasRef}
          width={canvasSize}
          height={canvasSize}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative scanlines"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={frontCanvasRef}
        width={BASE_SIZE}
        height={BASE_SIZE}
        className={`block terrain-canvas ${
          transitioning ? "terrain-transitioning" : ""
        }`}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
