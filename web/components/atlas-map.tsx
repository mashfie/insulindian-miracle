"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";

import { type AtlasChapter, type AtlasSource } from "@/lib/content/types";

type AtlasMapProps = {
  source: AtlasSource;
  chapters: AtlasChapter[];
};

type Point = { x: number; y: number };

import { VoxelMap } from "@/components/voxel-map";

const COLORS = {
  resourceRent: [138, 56, 36], // --danger
  accessibility: [46, 77, 93], // --accent
  defensibility: [32, 44, 58], // deep blue
  suitability: [63, 92, 82],   // sea green
  default: [13, 13, 13],       // --ink
};

function downsample(data: number[][], factor: number): number[][] {
  const result: number[][] = [];
  for (let y = 0; y < data.length; y += factor) {
    const row: number[] = [];
    for (let x = 0; x < data[0].length; x += factor) {
      row.push(data[y][x]);
    }
    result.push(row);
  }
  return result;
}

export function AtlasMap({ source, chapters }: AtlasMapProps) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "terrain");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ origin: Point; offset: Point } | null>(null);
  const deferredChapterId = useDeferredValue(chapterId);
  const chapter = chapters.find((entry) => entry.id === deferredChapterId) ?? chapters[0];

  const layer = source[chapter.layer];
  const isVoxelView = chapter.layer === "elevation";

  // Draw Heatmap on Canvas (only if not voxel view)
  useEffect(() => {
    if (isVoxelView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = source;
    const imageData = ctx.createImageData(width, height);
    const rgb = COLORS[chapter.layer as keyof typeof COLORS] || COLORS.default;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const val = layer[y][x];
        const isLand = source.landMask[y][x];

        if (!isLand) {
          imageData.data[i] = 255;
          imageData.data[i + 1] = 255;
          imageData.data[i + 2] = 255;
          imageData.data[i + 3] = 40; 
        } else {
          imageData.data[i] = rgb[0];
          imageData.data[i + 1] = rgb[1];
          imageData.data[i + 2] = rgb[2];
          imageData.data[i + 3] = Math.floor(Math.max(0.1, val) * 255);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [chapter, layer, source, isVoxelView]);

  const handleChapterChange = (id: string) => {
    startTransition(() => {
      setChapterId(id);
      window.history.replaceState(null, "", `#${id}`);
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = {
      origin: { x: event.clientX, y: event.clientY },
      offset,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const x = draggingRef.current.offset.x + (e.clientX - draggingRef.current.origin.x);
      const y = draggingRef.current.offset.y + (e.clientY - draggingRef.current.origin.y);
      setOffset({ x, y });
    };
    const up = () => {
      draggingRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const direction = event.deltaY > 0 ? -0.1 : 0.1;
    setZoom((current) => Math.min(4, Math.max(0.5, current + direction)));
  };

  return (
    <section className="atlas">
      <div className="atlas__controls">
        {chapters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            data-active={entry.id === chapter.id}
            onClick={() => handleChapterChange(entry.id)}
          >
            {entry.title.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="atlas__grid">
        <div
          ref={viewportRef}
          className={`atlas__viewport${isDragging ? " is-dragging" : ""}`}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
        >
          {/* Paper Grain Overlay */}
          <div className="atlas__grain" />

          <div
            className="atlas__zoom-layer"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          >
            <div className="atlas__canvas-wrap" style={{ width: source.width * 10, height: source.height * 10 }}>
              {isVoxelView ? (
                <VoxelMap
                  data={downsample(source.elevation, 4)}
                  width={16}
                  height={16}
                  color={[140, 130, 115]}
                  sites={source.sites}
                  landMask={source.landMask}
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  className="atlas__canvas"
                  width={source.width}
                  height={source.height}
                />
              )}

              {/* Blueprint SVG Overlays */}
              <svg
                className="atlas__overlay-svg"
                viewBox={`0 0 ${source.width} ${source.height}`}
              >
                {/* Coastline */}
                {!isVoxelView && chapter.overlays.includes("coast") && source.coastMask.map((row, y) =>
                  row.map((val, x) => val ? (
                    <rect key={`c-${x}-${y}`} x={x} y={y} width="1" height="1" fill="none" stroke="var(--ink)" strokeWidth="0.1" opacity="0.3" />
                  ) : null)
                )}

                {/* Rivers */}
                {!isVoxelView && chapter.overlays.includes("river") && source.riverMask.map((row, y) =>
                  row.map((val, x) => val ? (
                    <rect key={`r-${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--accent)" opacity="0.6" />
                  ) : null)
                )}

                {/* Sites / Cities */}
                {chapter.overlays.includes("sites") && source.sites.map((site) => (
                  <g key={site.id} style={{ opacity: isVoxelView ? 0.4 : 1 }}>
                    {/* Architectural Crosshair */}
                    <line x1={site.x * 63 - 1} y1={site.y * 63} x2={site.x * 63 + 1} y2={site.y * 63} stroke="var(--ink)" strokeWidth="0.2" />
                    <line x1={site.x * 63} y1={site.y * 63 - 1} x2={site.x * 63} y2={site.y * 63 + 1} stroke="var(--ink)" strokeWidth="0.2" />
                    <circle
                      cx={site.x * 63}
                      cy={site.y * 63}
                      r="0.8"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="0.2"
                    />
                    <text
                      x={site.x * 63 + 1.2}
                      y={site.y * 63 - 1.2}
                      fontFamily="var(--font-heading)"
                      fontSize="2"
                      fill="var(--ink)"
                      fontWeight="bold"
                    >
                      S{site.id}
                    </text>
                  </g>
                ))}

                {/* Boomtown Highlight */}
                {chapter.overlays.includes("boomtowns") && source.sites.filter(s => s.boomtown).map(site => (
                   <circle
                    key={`b-${site.id}`}
                    cx={site.x * 63}
                    cy={site.y * 63}
                    r="2.5"
                    fill="none"
                    stroke="var(--danger)"
                    strokeWidth="0.3"
                    strokeDasharray="0.5 0.5"
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
        <aside className="atlas__narrative">
          <div className="section-kicker">ATLAS CHAPTER</div>
          <h2 className="atlas__chapter-title">{chapter.title.toUpperCase()}</h2>
          <p className="atlas__chapter-narrative">{chapter.narrative}</p>
          <ul className="atlas__site-list">
            {chapter.linkedSites.map((siteId) => {
              const site = source.sites.find((entry) => entry.id === siteId);
              if (!site) return null;
              return (
                <li key={site.id} className="atlas__site-item">
                  <strong className="atlas__site-label">SITE {site.id}</strong> —
                  <span className="atlas__site-type">
                    {site.boomtown ? "EXTRACTIVE BOOMTOWN" : site.trade_cluster ? "TRADE CLUSTER" : "STABLE CANDIDATE"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="atlas__draft-note">
            Drafting Grid v4.0 // Scale 1:15000 // Multi-Layered Inference
          </p>
        </aside>
      </div>
    </section>
  );
}
