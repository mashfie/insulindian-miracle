"use client";

import { useEffect, useMemo, useRef } from "react";
import { Heerich } from "heerich";

type HeroSceneProps = {
  title: string;
  variant: "archive" | "cartographic-ledger" | "polyhedral-report";
};

const VARIANT_PALETTES: Record<
  HeroSceneProps["variant"],
  { base: string; accent: string; shadow: string; top: string }
> = {
  archive: {
    base: "#d4c4b8",
    accent: "#a08d81",
    shadow: "#6b5d54",
    top: "#f0e6dd",
  },
  "cartographic-ledger": {
    base: "#b8ccc6",
    accent: "#3f5c52",
    shadow: "#1a2c26",
    top: "#e0ece8",
  },
  "polyhedral-report": {
    base: "#d4b8a0",
    accent: "#7d4e33",
    shadow: "#3a2517",
    top: "#f0e2d4",
  },
};

type SceneBuilder = (h: InstanceType<typeof Heerich>, palette: typeof VARIANT_PALETTES.archive) => void;

/**
 * Each page gets a unique Heerich sculpture.
 * These go beyond cubes — using spheres, carved voids,
 * scaled voxels, and boolean operations for distinct silhouettes.
 */
const SCENE_BUILDERS: Record<string, SceneBuilder> = {
  // Home: Eroded monolith — a solid mass with carved voids, suggesting geological time
  home: (h, p) => {
    // Main mass
    h.applyGeometry({
      type: "box",
      position: [0, 0, 0],
      size: [7, 10, 5],
      style: {
        default: { fill: p.base, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.top, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    // Carve erosion channels
    h.removeGeometry({
      type: "sphere",
      center: [3, 5, 0],
      radius: 2.5,
      style: { default: { fill: p.shadow, stroke: "#0d0d0d", strokeWidth: 0.3 } },
    });
    h.removeGeometry({
      type: "box",
      position: [5, 3, 1],
      size: [3, 4, 2],
      style: { default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.3 } },
    });
    // Stepped terrace on top
    h.applyGeometry({
      type: "box",
      position: [1, 10, 1],
      size: [3, 2, 2],
      style: {
        default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.top, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    // Small sentinel pillar
    h.applyGeometry({
      type: "box",
      position: [6, 0, 4],
      size: [1, 6, 1],
      style: {
        default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.5 },
        top: { fill: "#fef5f0", stroke: p.accent, strokeWidth: 0.5 },
      },
    });
  },

  // Atlas: Topographic pyramid — layered contour rings suggesting elevation
  atlas: (h, p) => {
    // Stacked contour rings, each smaller than the last
    for (let layer = 0; layer < 5; layer++) {
      const inset = layer;
      const sz = 9 - layer * 2;
      if (sz < 1) break;
      h.applyGeometry({
        type: "box",
        position: [inset, layer * 2, inset],
        size: [sz, 2, sz],
        style: {
          default: (_x: number, y: number) => ({
            fill: y === layer * 2 + 1
              ? `hsl(35, ${20 + layer * 8}%, ${55 + layer * 7}%)`
              : `hsl(35, ${15 + layer * 5}%, ${45 + layer * 5}%)`,
            stroke: p.shadow,
            strokeWidth: 0.3,
          }),
          top: {
            fill: `hsl(35, ${25 + layer * 10}%, ${65 + layer * 5}%)`,
            stroke: p.accent,
            strokeWidth: 0.3,
          },
        },
      });
    }
    // Peak marker
    h.applyGeometry({
      type: "box",
      position: [4, 10, 4],
      size: 1,
      style: {
        default: { fill: "#0d0d0d", stroke: "#0d0d0d", strokeWidth: 0.5 },
        top: { fill: "#fef5f0", stroke: "#0d0d0d", strokeWidth: 0.5 },
      },
    });
  },

  // Scenarios: Interlocking L-shapes — representing divergent paths
  scenarios: (h, p) => {
    // L-shape 1: horizontal base + vertical arm
    h.applyGeometry({
      type: "box",
      position: [0, 0, 0],
      size: [6, 2, 3],
      style: {
        default: { fill: p.base, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.top, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    h.applyGeometry({
      type: "box",
      position: [0, 2, 0],
      size: [2, 6, 3],
      style: {
        default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.top, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    // L-shape 2: rotated, interlocking
    h.applyGeometry({
      type: "box",
      position: [3, 0, 3],
      size: [3, 2, 5],
      style: {
        default: { fill: `hsl(25, 30%, 55%)`, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: `hsl(25, 25%, 72%)`, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    h.applyGeometry({
      type: "box",
      position: [4, 2, 5],
      size: [2, 5, 3],
      style: {
        default: { fill: `hsl(25, 35%, 45%)`, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: `hsl(25, 30%, 65%)`, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    // Carve intersection void
    h.removeGeometry({
      type: "sphere",
      center: [3, 3, 3],
      radius: 1.8,
      style: { default: { fill: p.shadow, stroke: "#0d0d0d", strokeWidth: 0.2 } },
    });
  },

  // Policies: Monolith with window — institutional solidity with transparency
  policies: (h, p) => {
    // Solid monolith
    h.applyGeometry({
      type: "box",
      position: [0, 0, 0],
      size: [5, 12, 4],
      style: {
        default: { fill: p.base, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.top, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    // Carve window/archway
    h.removeGeometry({
      type: "box",
      position: [1, 3, -1],
      size: [3, 5, 6],
      style: { default: { fill: p.shadow, stroke: "#0d0d0d", strokeWidth: 0.3 } },
    });
    // Stepped plinth
    h.applyGeometry({
      type: "box",
      position: [-1, 0, -1],
      size: [7, 1, 6],
      style: {
        default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.base, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
  },

  // References: Archival shelves — stacked offset blocks like books
  references: (h, p) => {
    const shelves = [
      { x: 0, z: 0, w: 3, d: 2, h: 2 },
      { x: 4, z: 0, w: 2, d: 2, h: 3 },
      { x: 0, z: 3, w: 4, d: 2, h: 1 },
      { x: 5, z: 3, w: 2, d: 2, h: 4 },
      { x: 0, z: 0, w: 2, d: 2, h: 5 },
      { x: 2, z: 5, w: 3, d: 2, h: 2 },
      { x: 6, z: 1, w: 1, d: 3, h: 6 },
    ];
    shelves.forEach((s, i) => {
      const hue = 30 + i * 5;
      const light = 50 + (i % 3) * 8;
      h.applyGeometry({
        type: "box",
        position: [s.x, 0, s.z],
        size: [s.w, s.h, s.d],
        style: {
          default: { fill: `hsl(${hue}, 18%, ${light}%)`, stroke: p.shadow, strokeWidth: 0.4 },
          top: { fill: `hsl(${hue}, 22%, ${light + 15}%)`, stroke: p.accent, strokeWidth: 0.3 },
        },
      });
    });
  },
};

function getSceneKey(title: string): string {
  const t = title.toLowerCase();
  if (t === "atlas") return "atlas";
  if (t === "scenarios" || t.includes("scenario")) return "scenarios";
  if (t === "policies" || t.includes("policy")) return "policies";
  if (t === "references") return "references";
  return "home";
}

export function HeroScene({ title, variant }: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const palette = VARIANT_PALETTES[variant] || VARIANT_PALETTES.archive;

  const svgString = useMemo(() => {
    const h = new Heerich({
      tile: 28,
      camera: { type: "oblique", angle: 315, distance: 18 },
    });

    const key = getSceneKey(title);
    const builder = SCENE_BUILDERS[key] || SCENE_BUILDERS.home;
    builder(h, palette);

    return h.toSVG({ padding: 40 });
  }, [title, palette]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = svgString;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.setAttribute("class", "site-hero__stage");
    }
  }, [svgString]);

  return (
    <section className="site-hero" aria-hidden="true" style={{ background: "var(--paper)" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <div className="site-hero__title-bar">
        <span className="site-hero__title-text">{title.toUpperCase()}</span>
        <span className="site-hero__title-rule" />
      </div>
    </section>
  );
}
