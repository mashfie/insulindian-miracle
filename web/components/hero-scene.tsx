"use client";

import React, { useEffect, useState } from "react";

type HeroSceneProps = {
  title: string;
  variant: "archive" | "cartographic-ledger" | "polyhedral-report";
};

const VARIANT_COLORS: Record<HeroSceneProps["variant"], { top: string; left: string; right: string }> = {
  archive: { top: "#fef5f0", left: "#dccbbf", right: "#a08d81" },
  "cartographic-ledger": { top: "#ffffff", left: "#c2d1cd", right: "#1a2c26" },
  "polyhedral-report": { top: "#ffffff", left: "#dccbbf", right: "#3a2517" },
};

// Unique voxel sets for different sections
const VOXEL_SETS: Record<string, number[][]> = {
  home: [
    [0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1],
    [0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0],
    [0, 4, 1], [0, 4, 2], [0, 3, 2],
    [1, 3, 0], [2, 3, 0], [2, 4, 0], [2, 5, 0],
    [-1, 2, 0], [-2, 2, 0], [-2, 2, -1], [-2, 3, -1], [-1, 3, -1], [0, 3, -1],
    [3, 1, 2], [3, 2, 2], [1, -1, 3],
  ],
  atlas: [
    // Topographic pyramid
    [-2, 0, -2], [-1, 0, -2], [0, 0, -2], [1, 0, -2], [2, 0, -2],
    [-2, 0, -1], [-1, 0, -1], [0, 0, -1], [1, 0, -1], [2, 0, -1],
    [-2, 0, 0], [-1, 0, 0], [0, 0, 0], [1, 0, 0], [2, 0, 0],
    [-2, 0, 1], [-1, 0, 1], [0, 0, 1], [1, 0, 1], [2, 0, 1],
    [-2, 0, 2], [-1, 0, 2], [0, 0, 2], [1, 0, 2], [2, 0, 2],
    [-1, 1, -1], [0, 1, -1], [1, 1, -1],
    [-1, 1, 0], [0, 1, 0], [1, 1, 0],
    [-1, 1, 1], [0, 1, 1], [1, 1, 1],
    [0, 2, 0],
  ],
  scenarios: [
    // Interlocking knot
    [0,0,0], [1,0,0], [2,0,0], [2,1,0], [2,2,0], [1,2,0], [0,2,0], [0,1,0],
    [0,0,1], [0,0,2], [1,0,2], [2,0,2], [2,1,2], [2,2,2], [1,2,2], [0,2,2], [0,1,2],
    [0,2,1], [2,2,1], [2,0,1],
  ],
  policies: [
    // Monolithic pillar
    [-1,0,-1], [0,0,-1], [1,0,-1],
    [-1,0,0], [0,0,0], [1,0,0],
    [-1,0,1], [0,0,1], [1,0,1],
    [0,1,0], [0,2,0], [0,3,0], [0,4,0], [0,5,0],
    [-1,5,-1], [0,5,-1], [1,5,-1],
    [-1,5,0], [0,5,0], [1,5,0],
    [-1,5,1], [0,5,1], [1,5,1],
  ],
  references: [
    // Archival grid
    [-2,0,-1], [0,0,-1], [2,0,-1],
    [-2,0,1], [0,0,1], [2,0,1],
    [-2,1,-1], [0,1,-1], [2,1,-1],
    [-2,1,1], [0,1,1], [2,1,1],
    [-2,2,-1], [0,2,-1], [2,2,-1],
  ]
};

function getVoxelSet(title: string): number[][] {
  const t = title.toLowerCase();
  if (t === "atlas") return VOXEL_SETS.atlas;
  if (t === "scenarios" || t.includes("scenario")) return VOXEL_SETS.scenarios;
  if (t === "policies" || t.includes("policy")) return VOXEL_SETS.policies;
  if (t === "references") return VOXEL_SETS.references;
  return VOXEL_SETS.home;
}

export function HeroScene({ title, variant }: HeroSceneProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.archive;
  const SIZE = 40;

  const voxels = getVoxelSet(title);
  const sortedVoxels = [...voxels].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));

  useEffect(() => {
    setVisibleCount(0);
    const timer = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= sortedVoxels.length) {
          clearInterval(timer);
          return sortedVoxels.length;
        }
        return c + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [title]);

  return (
    <section className="site-hero" aria-hidden="true" style={{ background: "var(--paper)" }}>
      <svg
        className="site-hero__stage"
        viewBox="-400 -300 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(0, 50)">
          {sortedVoxels.slice(0, visibleCount).map(([x, y, z], i) => {
            const px = (x - z) * SIZE * 0.866;
            const py = (x + z) * SIZE * 0.5 - y * SIZE;

            const pTop = `0,${-SIZE} ${SIZE * 0.866},${-SIZE * 0.5} 0,0 ${-SIZE * 0.866},${-SIZE * 0.5}`;
            const pLeft = `0,0 ${-SIZE * 0.866},${-SIZE * 0.5} ${-SIZE * 0.866},${SIZE * 0.5} 0,${SIZE}`;
            const pRight = `0,0 ${SIZE * 0.866},${-SIZE * 0.5} ${SIZE * 0.866},${SIZE * 0.5} 0,${SIZE}`;

            return (
              <g key={i} transform={`translate(${px}, ${py})`} style={{ transition: "all 0.3s ease" }}>
                <polygon points={pLeft} fill={colors.left} stroke="var(--ink)" strokeWidth="1" strokeLinejoin="round" />
                <polygon points={pRight} fill={colors.right} stroke="var(--ink)" strokeWidth="1" strokeLinejoin="round" />
                <polygon points={pTop} fill={colors.top} stroke="var(--ink)" strokeWidth="1" strokeLinejoin="round" />
              </g>
            );
          })}
        </g>

        <text
          x="-350"
          y="250"
          fill="var(--ink)"
          fontFamily="var(--font-ui)"
          fontSize="24"
          fontWeight="bold"
          letterSpacing="0.2em"
          style={{ opacity: visibleCount > 5 ? 1 : 0, transition: "opacity 1s ease" }}
        >
          {title.toUpperCase()}
        </text>
        <line 
          x1="-350" y1="270" x2="-200" y2="270" 
          stroke="var(--ink)" 
          strokeWidth="4" 
          style={{ 
            strokeDasharray: 150, 
            strokeDashoffset: visibleCount > 5 ? 0 : 150, 
            transition: "stroke-dashoffset 1s ease" 
          }} 
        />
      </svg>
    </section>
  );
}
