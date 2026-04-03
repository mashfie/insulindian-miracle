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

const COLORS = {
  resourceRent: [138, 56, 36], // --danger
  accessibility: [46, 77, 93], // --accent
  defensibility: [32, 44, 58], // deep blue
  suitability: [63, 92, 82],   // sea green
  default: [13, 13, 13],       // --ink
};

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

  // Draw Heatmap on Canvas
  useEffect(() => {
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
          // Water color (very faint blue/white)
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
  }, [chapter, layer, source]);

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
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.05em" }}
          >
            {entry.title.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="atlas__grid">
        <div
          ref={viewportRef}
          className="atlas__viewport"
          style={{ 
            background: "var(--paper)", 
            position: "relative",
            overflow: "hidden",
            border: "2px solid var(--ink)",
            cursor: isDragging ? "grabbing" : "grab",
            boxShadow: "inset 0 0 100px rgba(0,0,0,0.05)"
          }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
        >
          {/* Paper Grain Overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            pointerEvents: "none",
            background: "url('https://www.transparenttextures.com/patterns/felt.png')"
          }} />

          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "50% 50%",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div style={{ position: "relative", width: source.width * 10, height: source.height * 10 }}>
              {/* Heatmap Layer */}
              <canvas
                ref={canvasRef}
                width={source.width}
                height={source.height}
                style={{
                  width: "100%",
                  height: "100%",
                  imageRendering: "pixelated",
                  position: "absolute",
                  inset: 0,
                }}
              />

              {/* Blueprint SVG Overlays */}
              <svg 
                viewBox={`0 0 ${source.width} ${source.height}`} 
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              >
                {/* Coastline */}
                {chapter.overlays.includes("coast") && source.coastMask.map((row, y) =>
                  row.map((val, x) => val ? (
                    <rect key={`c-${x}-${y}`} x={x} y={y} width="1" height="1" fill="none" stroke="var(--ink)" strokeWidth="0.1" opacity="0.3" />
                  ) : null)
                )}

                {/* Rivers */}
                {chapter.overlays.includes("river") && source.riverMask.map((row, y) =>
                  row.map((val, x) => val ? (
                    <rect key={`r-${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--accent)" opacity="0.6" />
                  ) : null)
                )}

                {/* Sites / Cities */}
                {chapter.overlays.includes("sites") && source.sites.map((site) => (
                  <g key={site.id}>
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
        <aside className="atlas__narrative" style={{ padding: "2rem", border: "2px solid var(--ink)", background: "var(--paper)" }}>
          <div className="kicker" style={{ fontFamily: "var(--font-heading)" }}>ATLAS CHAPTER</div>
          <h2 style={{ fontSize: "3rem", marginBottom: "1.5rem", lineHeight: "0.9" }}>{chapter.title.toUpperCase()}</h2>
          <p style={{ fontSize: "1.2rem", lineHeight: "1.6" }}>{chapter.narrative}</p>
          <ul className="atlas__site-list" style={{ marginTop: "2rem", listStyle: "none", padding: 0 }}>
            {chapter.linkedSites.map((siteId) => {
              const site = source.sites.find((entry) => entry.id === siteId);
              if (!site) return null;
              return (
                <li key={site.id} style={{ marginBottom: "1rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
                  <strong style={{ fontFamily: "var(--font-heading)" }}>SITE {site.id}</strong> — 
                  <span style={{ fontSize: "0.9rem", marginLeft: "0.5rem", color: "var(--ink-soft)" }}>
                    {site.boomtown ? "EXTRACTIVE BOOMTOWN" : site.trade_cluster ? "TRADE CLUSTER" : "STABLE CANDIDATE"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="comparison-note" style={{ marginTop: "3rem", opacity: 0.6, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Drafting Grid v4.0 // Scale 1:15000 // Multi-Layered Inference
          </p>
        </aside>
      </div>
    </section>
  );
}
