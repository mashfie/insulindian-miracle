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
}

const CANVAS_SIZE = 640;
const CONTOUR_LEVELS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

function idx(y: number, x: number, w: number): number {
  return y * w + x;
}

/** Get the layer data array from terrain by name. */
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
}: TerrainMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSite, setHoveredSite] = useState<number | null>(null);
  const { width, height } = terrain.config;
  const cellSize = CANVAS_SIZE / width;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = getLayerData(terrain, activeLayer);

    // Clear to void
    ctx.fillStyle = rgbStr(VOID);
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // --- Point cloud: render land cells as dots ---
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = idx(y, x, width);
        if (!terrain.landMask[i]) continue;

        const value = data[i];
        const color = layerColor(activeLayer, value);
        const alpha = 0.3 + 0.7 * value;
        const dotSize = 2 + 4 * value;

        ctx.fillStyle = rgbStr(color, alpha);
        ctx.beginPath();
        ctx.arc(
          (x + 0.5) * cellSize,
          (y + 0.5) * cellSize,
          dotSize * 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // --- Contour strata: hollow isolines ---
    ctx.strokeStyle = rgbStr(CONTOUR_STROKE, 0.4);
    ctx.lineWidth = 0.7;

    for (const level of CONTOUR_LEVELS) {
      ctx.beginPath();
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
          // Simple marching squares for this cell
          const v00 = terrain.elevation[idx(y, x, width)];
          const v10 = terrain.elevation[idx(y, x + 1, width)];
          const v01 = terrain.elevation[idx(y + 1, x, width)];
          const v11 = terrain.elevation[idx(y + 1, x + 1, width)];

          // Skip if all same side
          const a = v00 >= level ? 1 : 0;
          const b = v10 >= level ? 1 : 0;
          const c = v11 >= level ? 1 : 0;
          const d = v01 >= level ? 1 : 0;
          const code = a | (b << 1) | (c << 2) | (d << 3);
          if (code === 0 || code === 15) continue;

          // Interpolate edge crossings
          const lerpEdge = (va: number, vb: number): number => {
            if (Math.abs(vb - va) < 1e-10) return 0.5;
            return (level - va) / (vb - va);
          };

          const px = (x: number) => x * cellSize;
          const py = (y: number) => y * cellSize;

          // Top edge (v00→v10)
          const tTop = lerpEdge(v00, v10);
          const topX = px(x + tTop);
          const topY = py(y);
          // Right edge (v10→v11)
          const tRight = lerpEdge(v10, v11);
          const rightX = px(x + 1);
          const rightY = py(y + tRight);
          // Bottom edge (v01→v11)
          const tBottom = lerpEdge(v01, v11);
          const bottomX = px(x + tBottom);
          const bottomY = py(y + 1);
          // Left edge (v00→v01)
          const tLeft = lerpEdge(v00, v01);
          const leftX = px(x);
          const leftY = py(y + tLeft);

          const segments: [number, number, number, number][] = [];

          switch (code) {
            case 1:
              segments.push([topX, topY, leftX, leftY]);
              break;
            case 2:
              segments.push([topX, topY, rightX, rightY]);
              break;
            case 3:
              segments.push([leftX, leftY, rightX, rightY]);
              break;
            case 4:
              segments.push([rightX, rightY, bottomX, bottomY]);
              break;
            case 5:
              segments.push([topX, topY, rightX, rightY]);
              segments.push([bottomX, bottomY, leftX, leftY]);
              break;
            case 6:
              segments.push([topX, topY, bottomX, bottomY]);
              break;
            case 7:
              segments.push([leftX, leftY, bottomX, bottomY]);
              break;
            case 8:
              segments.push([leftX, leftY, bottomX, bottomY]);
              break;
            case 9:
              segments.push([topX, topY, bottomX, bottomY]);
              break;
            case 10:
              segments.push([topX, topY, leftX, leftY]);
              segments.push([rightX, rightY, bottomX, bottomY]);
              break;
            case 11:
              segments.push([rightX, rightY, bottomX, bottomY]);
              break;
            case 12:
              segments.push([leftX, leftY, rightX, rightY]);
              break;
            case 13:
              segments.push([topX, topY, rightX, rightY]);
              break;
            case 14:
              segments.push([topX, topY, leftX, leftY]);
              break;
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
    ctx.strokeStyle = rgbStr(RIVER, 0.8);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    // Trace connected river cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!terrain.riverMask[idx(y, x, width)]) continue;
        const cx = (x + 0.5) * cellSize;
        const cy = (y + 0.5) * cellSize;
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
    }
    ctx.stroke();

    // Better river: trace the actual connected path
    // Find river source (first river cell scanning from high elevation)
    const riverCells: [number, number][] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (terrain.riverMask[idx(y, x, width)]) {
          riverCells.push([y, x]);
        }
      }
    }
    if (riverCells.length > 1) {
      // Sort by elevation descending to find source
      riverCells.sort(
        (a, b) =>
          terrain.elevation[idx(b[0], b[1], width)] -
          terrain.elevation[idx(a[0], a[1], width)]
      );
      ctx.beginPath();
      ctx.strokeStyle = rgbStr(RIVER, 0.9);
      ctx.lineWidth = 1.2;
      ctx.moveTo(
        (riverCells[0][1] + 0.5) * cellSize,
        (riverCells[0][0] + 0.5) * cellSize
      );

      // Trace: from each cell, find the next neighbor in the river
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
              ny >= 0 &&
              ny < height &&
              nx >= 0 &&
              nx < width &&
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
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!terrain.coastMask[idx(y, x, width)]) continue;
        const cx = (x + 0.5) * cellSize;
        const cy = (y + 0.5) * cellSize;
        // Draw small dot at coast
        ctx.moveTo(cx + 1, cy);
        ctx.arc(cx, cy, 1, 0, Math.PI * 2);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Site markers: hollow circles + crosshairs ---
    for (const site of sites) {
      const sx = site.x * CANVAS_SIZE;
      const sy = site.y * CANVAS_SIZE;
      const isHovered = hoveredSite === site.id;
      const color = isHovered ? ACCENT : SITE_MARKER;
      const radius = isHovered ? 8 : 6;

      // Crosshair
      ctx.strokeStyle = rgbStr(color, 0.6);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx - radius - 2, sy);
      ctx.lineTo(sx - radius + 3, sy);
      ctx.moveTo(sx + radius - 3, sy);
      ctx.lineTo(sx + radius + 2, sy);
      ctx.moveTo(sx, sy - radius - 2);
      ctx.lineTo(sx, sy - radius + 3);
      ctx.moveTo(sx, sy + radius - 3);
      ctx.lineTo(sx, sy + radius + 2);
      ctx.stroke();

      // Hollow circle
      ctx.strokeStyle = rgbStr(color, isHovered ? 1 : 0.7);
      ctx.lineWidth = isHovered ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = rgbStr(color, isHovered ? 1 : 0.6);
      ctx.font = `${isHovered ? 10 : 9}px "JetBrains Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`S${site.id}`, sx + radius + 3, sy - 2);
    }

    // --- Registration marks ---
    ctx.strokeStyle = rgbStr(CONTOUR_STROKE, 0.3);
    ctx.lineWidth = 0.5;
    const tickLen = 8;

    // Corner ticks
    const corners = [
      [0, 0],
      [CANVAS_SIZE, 0],
      [0, CANVAS_SIZE],
      [CANVAS_SIZE, CANVAS_SIZE],
    ];
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      const dx = cx === 0 ? 1 : -1;
      const dy = cy === 0 ? 1 : -1;
      ctx.moveTo(cx, cy + dy * tickLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * tickLen, cy);
      ctx.stroke();
    }

    // Seed readout
    ctx.fillStyle = rgbStr(CONTOUR_STROKE, 0.4);
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(
      `SEED ${terrain.config.seed}  ${width}×${height}`,
      CANVAS_SIZE - 4,
      4
    );

    // Layer label
    ctx.textAlign = "left";
    ctx.fillText(activeLayer.toUpperCase(), 4, 4);

    // Scale ticks along bottom edge
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let i = 0; i <= 4; i++) {
      const tx = (i / 4) * CANVAS_SIZE;
      ctx.beginPath();
      ctx.moveTo(tx, CANVAS_SIZE);
      ctx.lineTo(tx, CANVAS_SIZE - 4);
      ctx.stroke();
      if (i > 0 && i < 4) {
        ctx.fillText(`${(i / 4).toFixed(2)}`, tx, CANVAS_SIZE - 5);
      }
    }
  }, [terrain, sites, activeLayer, hoveredSite, width, height, cellSize]);

  useEffect(() => {
    render();
  }, [render]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      let closest: Site | null = null;
      let minDist = 0.03; // ~20px threshold at 640px canvas
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
    [sites, onSiteHover]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredSite(null);
    onSiteHover?.(null);
  }, [onSiteHover]);

  return (
    <div className="relative scanlines">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="block"
        style={{ imageRendering: "pixelated" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
