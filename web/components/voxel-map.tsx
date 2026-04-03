"use client";

import { useEffect, useRef } from "react";

type VoxelMapProps = {
  data: number[][];
  width: number;
  height: number;
  color?: [number, number, number];
};

/**
 * A high-performance isometric voxel renderer for topography.
 * Visualizes a 2D grid as a 3D stack of Heerich-inspired blocks.
 */
export function VoxelMap({ data, width, height, color = [13, 13, 13] }: VoxelMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    canvas.width = w;
    canvas.height = h;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const SIZE = canvas.clientWidth / (width * 1.5);
    const offsetX = canvas.clientWidth / 2;
    const offsetY = canvas.clientHeight / 1.4;

    // Isometric projection constants
    const isoX = 0.866; // cos(30)
    const isoY = 0.5;   // sin(30)

    const drawVoxel = (x: number, y: number, z: number) => {
      const px = offsetX + (x - y) * SIZE * isoX;
      const py = offsetY + (x + y) * SIZE * isoY - z * SIZE;

      // Colors based on face
      const topColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      const leftColor = `rgb(${Math.max(0, color[0] - 40)}, ${Math.max(0, color[1] - 40)}, ${Math.max(0, color[2] - 40)})`;
      const rightColor = `rgb(${Math.max(0, color[0] - 80)}, ${Math.max(0, color[1] - 80)}, ${Math.max(0, color[2] - 80)})`;

      // Top face
      ctx.beginPath();
      ctx.moveTo(px, py - SIZE);
      ctx.lineTo(px + SIZE * isoX, py - SIZE * isoY);
      ctx.lineTo(px, py);
      ctx.lineTo(px - SIZE * isoX, py - SIZE * isoY);
      ctx.closePath();
      ctx.fillStyle = topColor;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Left face
      ctx.beginPath();
      ctx.moveTo(px - SIZE * isoX, py - SIZE * isoY);
      ctx.lineTo(px, py);
      ctx.lineTo(px, py + SIZE);
      ctx.lineTo(px - SIZE * isoX, py + SIZE - SIZE * isoY);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();
      ctx.stroke();

      // Right face
      ctx.beginPath();
      ctx.moveTo(px + SIZE * isoX, py - SIZE * isoY);
      ctx.lineTo(px, py);
      ctx.lineTo(px, py + SIZE);
      ctx.lineTo(px + SIZE * isoX, py + SIZE - SIZE * isoY);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();
      ctx.stroke();
    };

    // Sort by depth (back to front)
    for (let i = 0; i < width + height; i++) {
      for (let x = 0; x <= i; x++) {
        const y = i - x;
        if (x < width && y < height) {
          const val = data[y][x];
          // Each point can be a stack or just a block at height
          // For Heerich style, we draw a block at the terrain height
          const z = Math.floor(val * 8); 
          for (let baseZ = 0; baseZ <= z; baseZ++) {
             drawVoxel(x - width/2, y - height/2, baseZ);
          }
        }
      }
    }
  }, [data, width, height, color]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: "100%", height: "100%", cursor: "default" }} 
    />
  );
}
