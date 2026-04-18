"use client";

import { useEffect, useMemo, useRef } from "react";
import { Heerich } from "heerich";

type HeroSceneProps = {
  title: string;
  variant: "archive" | "cartographic-ledger" | "polyhedral-report";
  slug?: string;
};

const HIROSHIGE_COLORS = {
  washi: "#E3CFB4",
  indigo: "#243D5C",
  ironRed: "#A73836",
  pine: "#624C3C",
  teal: "#5C8B93",
  sandstone: "#D9AC8B",
  moss: "#5D7275",
  dawnPink: "#F0C1A4",
  sky: "#A4C8E1",
  sumi: "#2B2821",
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
 * RESTORED COORDINATE LOGIC:
 * Y=0 is TOP (Peak), Y=12 is BOTTOM (Base).
 */
const SCENE_BUILDERS: Record<string, SceneBuilder> = {
  // --- ORIGINAL LANDING PAGE ASSETS (FULLY RESTORED) ---
  
  home: (h, p) => {
    h.applyGeometry({
      type: "box",
      position: [0, 2, 0],
      size: [7, 10, 5],
      style: {
        default: { 
          fill: p.base, stroke: p.shadow, strokeWidth: 0.4,
          hatch: { angle: 45, period: 4, stroke: p.shadow, strokeWidth: 0.3 }
        },
        top: { fill: p.top, stroke: p.accent, strokeWidth: 0.3, decal: "grid-decal" },
        front: { fill: p.base, stroke: p.shadow, strokeWidth: 0.4, decal: "arch-decal" },
        right: { fill: p.base, stroke: p.shadow, strokeWidth: 0.4, decal: "grid-decal" }
      },
    });
    h.removeGeometry({ type: "sphere", center: [3, 7, 0], radius: 2.5, style: { default: { fill: p.shadow, stroke: "#0d0d0d", strokeWidth: 0.3 } } });
    h.removeGeometry({ type: "box", position: [5, 5, 1], size: [3, 4, 2], style: { default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.3 } } });
    h.applyGeometry({
      type: "box",
      position: [1, 0, 1],
      size: [3, 2, 2],
      style: {
        default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.4 },
        top: { 
          fill: p.top, stroke: p.accent, strokeWidth: 0.3,
          hatch: { angle: -45, period: 5, stroke: p.accent, strokeWidth: 0.4 }
        },
      },
    });
    h.applyGeometry({
      type: "box",
      position: [6, 6, 4],
      size: [1, 6, 1],
      style: {
        default: { 
          fill: p.accent, stroke: p.shadow, strokeWidth: 0.5,
          hatch: { angle: 90, period: 3, stroke: p.shadow, strokeWidth: 0.5 }
        },
        top: { fill: "#fef5f0", stroke: p.accent, strokeWidth: 0.5, decal: "cross-decal" },
      },
    });
  },

  atlas: (h, p) => {
    for (let layer = 0; layer < 5; layer++) {
      const sz = 9 - layer * 2;
      if (sz < 1) break;
      h.applyGeometry({
        type: "box",
        position: [layer, 10 - layer * 2, layer], 
        size: [sz, 2, sz],
        style: {
          default: (_x: number, y: number) => ({
            fill: y < 10 - layer * 2 + 1
              ? `hsl(35, ${25 + layer * 10}%, ${65 + layer * 5}%)`
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
    h.applyGeometry({
      type: "box",
      position: [4, 0, 4],
      size: 1,
      style: {
        default: { fill: "#0d0d0d", stroke: "#0d0d0d", strokeWidth: 0.5 },
        top: { fill: "#fef5f0", stroke: "#0d0d0d", strokeWidth: 0.5 },
      },
    });
  },

  scenarios: (h, p) => {
    h.applyGeometry({
      type: "box",
      position: [0, 8, 0],
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
    h.applyGeometry({
      type: "box",
      position: [3, 8, 3],
      size: [3, 2, 5],
      style: {
        default: { fill: `hsl(25, 30%, 55%)`, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: `hsl(25, 25%, 72%)`, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    h.applyGeometry({
      type: "box",
      position: [4, 3, 5],
      size: [2, 5, 3],
      style: {
        default: { fill: `hsl(25, 35%, 45%)`, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: `hsl(25, 30%, 65%)`, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    h.removeGeometry({ type: "sphere", center: [3, 7, 3], radius: 1.8, style: { default: { fill: p.shadow, stroke: "#0d0d0d", strokeWidth: 0.2 } } });
  },

  policies: (h, p) => {
    h.applyGeometry({
      type: "box",
      position: [0, 0, 0],
      size: [5, 12, 4],
      style: {
        default: { fill: p.base, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.top, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
    h.removeGeometry({ type: "box", position: [1, 4, -1], size: [3, 5, 6], style: { default: { fill: p.shadow, stroke: "#0d0d0d", strokeWidth: 0.3 } } });
    h.applyGeometry({
      type: "box",
      position: [-1, 12, -1],
      size: [7, 1, 6],
      style: {
        default: { fill: p.accent, stroke: p.shadow, strokeWidth: 0.4 },
        top: { fill: p.base, stroke: p.accent, strokeWidth: 0.3 },
      },
    });
  },

  references: (h, p) => {
    const shelves = [
      { x: 0, z: 0, w: 3, d: 2, h: 2, y: 10 },
      { x: 4, z: 0, w: 2, d: 2, h: 3, y: 9 },
      { x: 0, z: 3, w: 4, d: 2, h: 1, y: 11 },
      { x: 5, z: 3, w: 2, d: 2, h: 4, y: 8 },
      { x: 0, z: 0, w: 2, d: 2, h: 5, y: 7 },
      { x: 2, z: 5, w: 3, d: 2, h: 2, y: 10 },
      { x: 6, z: 1, w: 1, d: 3, h: 6, y: 6 },
    ];
    shelves.forEach((s, i) => {
      const hue = 30 + i * 5;
      const light = 50 + (i % 3) * 8;
      h.applyGeometry({
        type: "box",
        position: [s.x, s.y, s.z],
        size: [s.w, s.h, s.d],
        style: {
          default: { fill: `hsl(${hue}, 18%, ${light}%)`, stroke: p.shadow, strokeWidth: 0.4 },
          top: { fill: `hsl(${hue}, 22%, ${light + 15}%)`, stroke: p.accent, strokeWidth: 0.3 },
        },
      });
    });
  },

  // --- REFINED SPECIALIZED HEROES (NO RANDOMIZATION / CORRECT AXIS) ---

  "balanced-urban": (h) => {
    const c = HIROSHIGE_COLORS.sandstone;
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        const h_val = 2 + Math.sin(x * 0.8) * 3 + Math.cos(z * 0.8) * 2;
        const y_pos = 12 - h_val;
        h.applyGeometry({
          type: "box",
          position: [x * 2.5, y_pos, z * 2.5],
          size: [1.8, h_val, 1.8],
          style: { 
            default: { fill: c, stroke, strokeWidth: 0.4 }, 
            top: { fill: HIROSHIGE_COLORS.washi, stroke, strokeWidth: 0.3 } 
          },
        });
        if ((x + z) % 3 === 0) {
          h.applyGeometry({
            type: "box",
            position: [x * 2.5 + 0.4, y_pos, z * 2.5 + 0.4],
            size: [1, 0.1, 1],
            style: { default: { fill: HIROSHIGE_COLORS.ironRed, stroke: "none" } },
          });
        }
      }
    }
  },

  baseline: (h) => {
    const c = HIROSHIGE_COLORS.moss;
    const stroke = HIROSHIGE_COLORS.sumi;
    h.applyGeometry({
      type: "box",
      position: [0, 0, 0],
      size: [10, 14, 8],
      style: { 
        default: { fill: c, stroke, strokeWidth: 0.4 }, 
        top: { fill: HIROSHIGE_COLORS.washi, stroke, strokeWidth: 0.3 } 
      },
    });
    for (let i = 0; i < 8; i++) {
      h.removeGeometry({
        type: "box",
        position: [i, 12 - i * 1.5, -1],
        size: [2, 2, 10],
        style: { default: { fill: HIROSHIGE_COLORS.sumi, stroke, strokeWidth: 0.3 } }
      });
    }
  },

  botswana: (h) => {
    const c = HIROSHIGE_COLORS.indigo;
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 8; i++) {
      const s = 10 - i;
      const y_pos = 14 - i * 2;
      h.applyGeometry({
        type: "box",
        position: [i * 0.5, y_pos, i * 0.5],
        size: [s, 2, s],
        style: { 
          default: { fill: c, stroke, strokeWidth: 0.4 }, 
          top: { fill: HIROSHIGE_COLORS.sky, stroke, strokeWidth: 0.3 } 
        },
      });
      h.applyGeometry({
        type: "box",
        position: [i * 0.5 + s / 2, y_pos + 0.5, i * 0.5 + s],
        size: [0.6, 0.6, 0.1],
        style: { default: { fill: HIROSHIGE_COLORS.ironRed, stroke: "none" } }
      });
    }
  },

  "megacity-trap": (h) => {
    const c = HIROSHIGE_COLORS.sumi;
    const stroke = HIROSHIGE_COLORS.pine;
    for (let i = 0; i < 16; i++) {
      const r = 6;
      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const h_val = 4 + (i % 4) * 2;
      h.applyGeometry({
        type: "box",
        position: [8 + x, 14 - h_val, 8 + z],
        size: [2.5, h_val, 2.5],
        style: { 
          default: { fill: c, stroke, strokeWidth: 0.4 }, 
          top: { fill: HIROSHIGE_COLORS.dawnPink, stroke, strokeWidth: 0.3 } 
        },
      });
    }
    h.applyGeometry({
      type: "box",
      position: [6.5, 0, 6.5],
      size: [3, 3, 3],
      style: { 
        default: { fill: HIROSHIGE_COLORS.ironRed, stroke: "none" }, 
        top: { fill: "#ffffff", stroke: HIROSHIGE_COLORS.sumi, strokeWidth: 0.4 } 
      }
    });
  },

  "merchant-republic": (h) => {
    const c = HIROSHIGE_COLORS.teal;
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 4; i++) {
      const h_val = 2 + i * 2;
      h.applyGeometry({
        type: "box",
        position: [i * 2, 12 - h_val, 0],
        size: [2, h_val, 10],
        style: { 
          default: { fill: c, stroke, strokeWidth: 0.4 }, 
          top: { fill: HIROSHIGE_COLORS.washi, stroke, strokeWidth: 0.3 } 
        }
      });
    }
    for (let i = 0; i < 6; i++) {
      h.applyGeometry({
        type: "box",
        position: [10, i * 1.5, i * 1.5],
        size: [4, 1, 1],
        style: { 
          default: { fill: HIROSHIGE_COLORS.ironRed, stroke: "none" }, 
          top: { fill: HIROSHIGE_COLORS.dawnPink, stroke, strokeWidth: 0.3 } 
        }
      });
    }
  },

  "open-cluster": (h) => {
    const c = HIROSHIGE_COLORS.sky;
    const stroke = HIROSHIGE_COLORS.indigo;
    for (let i = 0; i < 24; i++) {
      const x = (i * 7) % 12;
      const y = (i * 3) % 12;
      const z = (i * 5) % 12;
      const s = 0.8 + (i % 3) * 0.4;
      h.applyGeometry({
        type: "box",
        position: [x, y, z],
        size: [s, s, s],
        style: { 
          default: { fill: c, stroke, strokeWidth: 0.3, opacity: 0.7 }, 
          top: { fill: HIROSHIGE_COLORS.washi, stroke, strokeWidth: 0.3 } 
        },
      });
    }
  },

  "resource-curse-scenario": (h) => {
    const c = HIROSHIGE_COLORS.pine;
    const stroke = HIROSHIGE_COLORS.sumi;
    h.applyGeometry({ 
      type: "box", position: [0, 12, 0], size: [10, 2, 10], 
      style: { default: { fill: c, stroke, strokeWidth: 0.4 }, top: { fill: HIROSHIGE_COLORS.washi } } 
    });
    for (let i = 0; i < 12; i++) {
      const s = 4 - i * 0.3;
      if (s < 0.5) break;
      h.applyGeometry({
        type: "box",
        position: [5 - s/2, 11 - i, 5 - s/2],
        size: [s, 1, s],
        style: { 
          default: { fill: HIROSHIGE_COLORS.ironRed, stroke, strokeWidth: 0.3 }, 
          top: { fill: HIROSHIGE_COLORS.sandstone, stroke, strokeWidth: 0.3 } 
        }
      });
    }
    h.removeGeometry({ type: "sphere", center: [5, 12, 5], radius: 4 });
  },

  "shock-reform": (h) => {
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 30; i++) {
      const x = (i * 13) % 15 - 7.5;
      const y = (i * 7) % 15 - 7.5;
      const z = (i * 11) % 15 - 7.5;
      h.applyGeometry({
        type: "box",
        position: [8 + x, 8 + y, 8 + z],
        size: [1, 1, 1],
        style: { 
          default: { fill: i % 3 === 0 ? HIROSHIGE_COLORS.ironRed : HIROSHIGE_COLORS.sumi, stroke, strokeWidth: 0.3 }, 
          top: { fill: HIROSHIGE_COLORS.washi, stroke: "none" } 
        }
      });
    }
  },

  "ucb-bait": (h) => {
    const c = HIROSHIGE_COLORS.indigo;
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 4; i++) {
      const sides = [
        { pos: [i * 2, 12 - i, 0] },
        { pos: [6, 11 - i, i * 2] },
        { pos: [6 - i * 2, 10 - i, 6] },
        { pos: [0, 9 - i, 6 - i * 2] }
      ];
      sides.forEach(s => {
        h.applyGeometry({ 
          type: "box", position: s.pos as [number, number, number], size: [2, 1, 2], 
          style: { default: { fill: c, stroke, strokeWidth: 0.4 }, top: { fill: HIROSHIGE_COLORS.washi, stroke, strokeWidth: 0.3 } } 
        });
      });
    }
  },

  "thompson-sampling": (h) => {
    const c = HIROSHIGE_COLORS.moss;
    for (let i = 0; i < 60; i++) {
      const dist = Math.sqrt((i * 0.17) % 1) * 8;
      const angle = ((i * 0.63) % 1) * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = ((i * 0.29) % 1) * 4 + 6;
      h.applyGeometry({
        type: "box",
        position: [8 + x, y, 8 + z],
        size: [0.4, 0.4, 0.4],
        style: { default: { fill: c, stroke: "rgba(13,13,13,0.1)", strokeWidth: 0.2, opacity: 0.4 + (i % 5) * 0.1 } }
      });
    }
  },

  "whittle-index": (h) => {
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 7; i++) {
      const h_val = 2 + i * 2.5;
      const y_pos = 14 - h_val;
      h.applyGeometry({
        type: "box",
        position: [i * 2, y_pos, i],
        size: [1.5, h_val, 1.5],
        style: { 
          default: { fill: i % 2 === 0 ? HIROSHIGE_COLORS.ironRed : HIROSHIGE_COLORS.indigo, stroke, strokeWidth: 0.4 }, 
          top: { fill: HIROSHIGE_COLORS.sandstone, stroke, strokeWidth: 0.3 } 
        }
      });
      h.applyGeometry({
        type: "box",
        position: [i * 2 + 0.25, y_pos, i + 0.25],
        size: [1, 0.1, 1],
        style: { default: { fill: HIROSHIGE_COLORS.washi, stroke: "none" } }
      });
    }
  },

  "epsilon-greedy": (h) => {
    const stroke = HIROSHIGE_COLORS.sumi;
    h.applyGeometry({ type: "box", position: [0, 12, 0], size: [12, 1, 12], style: { default: { fill: HIROSHIGE_COLORS.sumi, stroke, strokeWidth: 0.4 }, top: { fill: HIROSHIGE_COLORS.pine } } });
    for (let i = 0; i < 15; i++) {
      const x = (i * 7) % 11;
      const z = (i * 3) % 11;
      h.applyGeometry({
        type: "box",
        position: [x, 11, z],
        size: [0.5, 0.5, 0.5],
        style: { default: { fill: HIROSHIGE_COLORS.ironRed, stroke: "none" } }
      });
    }
  },

  linucb: (h) => {
    const c = HIROSHIGE_COLORS.indigo;
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 6; i++) {
      const styles = { default: { fill: c, stroke, strokeWidth: 0.35 } };
      h.applyGeometry({ type: "box", position: [i * 2, 0, 0], size: [0.2, 12, 0.2], style: styles });
      h.applyGeometry({ type: "box", position: [0, i * 2, 0], size: [12, 0.2, 0.2], style: styles });
      h.applyGeometry({ type: "box", position: [0, 0, i * 2], size: [0.2, 0.2, 12], style: styles });
    }
  },

  "discounted-ucb": (h) => {
    const c = HIROSHIGE_COLORS.sky;
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 10; i++) {
      const alpha = Math.pow(0.8, i);
      const h_val = 12 * alpha;
      h.applyGeometry({
        type: "box",
        position: [i, 12 - h_val, i],
        size: [2, h_val, 2],
        style: { 
          default: { fill: c, stroke, strokeWidth: 0.4, opacity: alpha }, 
          top: { fill: HIROSHIGE_COLORS.washi, stroke, strokeWidth: 0.2 } 
        }
      });
    }
  },

  "myopic-oracle": (h) => {
    const stroke = HIROSHIGE_COLORS.sumi;
    h.applyGeometry({ 
      type: "box", position: [0, 8, 0], size: [12, 4, 12], 
      style: { default: { fill: HIROSHIGE_COLORS.washi, stroke, strokeWidth: 0.4 }, top: { fill: HIROSHIGE_COLORS.sandstone } } 
    });
    h.removeGeometry({ type: "sphere", center: [6, 8, 6], radius: 5 });
    h.applyGeometry({ type: "sphere", center: [6, 8, 6], radius: 1, style: { default: { fill: HIROSHIGE_COLORS.ironRed, stroke: "none" } } });
  },

  "sliding-window-ucb": (h) => {
    const stroke = HIROSHIGE_COLORS.sumi;
    h.applyGeometry({ type: "box", position: [0, 12, 0], size: [14, 1, 14], style: { default: { fill: HIROSHIGE_COLORS.pine, opacity: 0.3, stroke, strokeWidth: 0.35 } } });
    for (let i = 0; i < 5; i++) {
      h.applyGeometry({
        type: "box",
        position: [4 + i, 8, 4 + i],
        size: [4, 4, 4],
        style: { default: { fill: HIROSHIGE_COLORS.pine, stroke, strokeWidth: 0.4, opacity: 0.2 + i * 0.15 } }
      });
    }
  },

  ucb1: (h) => {
    const c = HIROSHIGE_COLORS.sandstone;
    const stroke = HIROSHIGE_COLORS.sumi;
    h.applyGeometry({ 
      type: "box", position: [2, 10, 2], size: [8, 2, 8], 
      style: { default: { fill: c, stroke, strokeWidth: 0.4 }, top: { fill: HIROSHIGE_COLORS.washi } } 
    });
    for (let i = 0; i < 4; i++) {
      h.applyGeometry({
        type: "box",
        position: [2, 8 - i * 2, 2],
        size: [8, 0.5, 8],
        style: { default: { fill: HIROSHIGE_COLORS.indigo, opacity: 0.6 - i * 0.15, stroke, strokeWidth: 0.3 } }
      });
    }
  },

  "linear-thompson": (h) => {
    const c = HIROSHIGE_COLORS.teal;
    const stroke = HIROSHIGE_COLORS.sumi;
    h.applyGeometry({ type: "box", position: [0, 8, 0], size: [12, 0.5, 12], style: { default: { fill: c, opacity: 0.4, stroke, strokeWidth: 0.3 } } });
    for (let i = 0; i < 30; i++) {
      const x = (i * 11) % 11;
      const z = (i * 7) % 11;
      const y = 4 + (i % 5);
      h.applyGeometry({
        type: "box",
        position: [x, y, z],
        size: [0.3, 0.3, 0.3],
        style: { default: { fill: HIROSHIGE_COLORS.moss, stroke: "none" } }
      });
    }
  },

  "discounted-thompson": (h) => {
    const c = HIROSHIGE_COLORS.dawnPink;
    const stroke = HIROSHIGE_COLORS.sumi;
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      h.applyGeometry({
        type: "box",
        position: [i * 1.2, 12 - i * 0.8, 6],
        size: [1.5, 1.5, 1.5],
        style: { 
          default: { fill: c, opacity: 1 - t, stroke, strokeWidth: 0.3 }, 
          top: { fill: HIROSHIGE_COLORS.washi, stroke: "none" } 
        }
      });
    }
  }
};

function getSceneKey(title: string, slug?: string): string {
  if (slug && SCENE_BUILDERS[slug]) return slug;
  
  const t = title.toLowerCase();
  if (t.includes("balanced urban")) return "balanced-urban";
  if (t.includes("baseline")) return "baseline";
  if (t.includes("botswana")) return "botswana";
  if (t.includes("megacity trap")) return "megacity-trap";
  if (t.includes("merchant republic")) return "merchant-republic";
  if (t.includes("open cluster")) return "open-cluster";
  if (t.includes("resource curse")) return "resource-curse-scenario";
  if (t.includes("shock reform")) return "shock-reform";
  if (t.includes("ucb bait")) return "ucb-bait";
  
  if (t.includes("thompson sampling")) return "thompson-sampling";
  if (t.includes("whittle index")) return "whittle-index";
  if (t.includes("epsilon greedy")) return "epsilon-greedy";
  if (t.includes("linucb")) return "linucb";
  if (t.includes("discounted ucb")) return "discounted-ucb";
  if (t.includes("myopic oracle")) return "myopic-oracle";
  if (t.includes("sliding window")) return "sliding-window-ucb";

  if (t === "atlas") return "atlas";
  if (t === "scenarios" || t.includes("scenario")) return "scenarios";
  if (t === "policies" || t.includes("policy")) return "policies";
  if (t === "references" || t.includes("bibliography")) return "references";
  return "home";
}

export function HeroScene({ title, variant, slug }: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const palette = VARIANT_PALETTES[variant] || VARIANT_PALETTES.archive;

  const svgString = useMemo(() => {
    const key = getSceneKey(title, slug);
    const isSpecial = key !== "home" && key !== "atlas" && key !== "scenarios" && key !== "policies" && key !== "references";
    
    const h = new Heerich({
      tile: 32,
      camera: { 
        type: "oblique", 
        angle: isSpecial ? 135 : 315, 
        distance: isSpecial ? 12 : 18 
      },
    });

    const builder = SCENE_BUILDERS[key] || SCENE_BUILDERS.home;
    builder(h, palette);

    return h.toSVG({ padding: 40 });
  }, [title, palette, slug]);

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
      <div ref={containerRef} className="site-hero__inner" style={{ width: "100%", height: "100%" }} />
    </section>
  );
}

