"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useDeferredValue,
  useEffect,
  useEffectEvent,
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

function colorFor(value: number, chapter: AtlasChapter["layer"]) {
  const alpha = Math.max(0.16, value * 0.92);
  if (chapter === "resourceRent") {
    return `rgba(131, 71, 50, ${alpha})`;
  }
  if (chapter === "accessibility") {
    return `rgba(46, 77, 93, ${alpha})`;
  }
  if (chapter === "defensibility") {
    return `rgba(32, 44, 58, ${alpha})`;
  }
  if (chapter === "suitability") {
    return `rgba(63, 92, 82, ${alpha})`;
  }
  return `rgba(19, 19, 19, ${Math.max(0.1, value * 0.8)})`;
}

export function AtlasMap({ source, chapters }: AtlasMapProps) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "terrain");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ origin: Point; offset: Point } | null>(null);
  const deferredChapterId = useDeferredValue(chapterId);
  const chapter = chapters.find((entry) => entry.id === deferredChapterId) ?? chapters[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && chapters.some(c => c.id === hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChapterId(hash);
    }
    
    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1);
      if (newHash && chapters.some(c => c.id === newHash)) {
        setChapterId(newHash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [chapters]);

  const handleChapterChange = (id: string) => {
    startTransition(() => {
      setChapterId(id);
      window.history.replaceState(null, "", `#${id}`);
    });
  };

  const handlePointerMove = useEffectEvent((event: PointerEvent) => {
    const drag = draggingRef.current;
    if (!drag) {
      return;
    }
    const x = drag.offset.x + (event.clientX - drag.origin.x);
    const y = drag.offset.y + (event.clientY - drag.origin.y);
    setOffset({ x, y });
  });

  const handlePointerUp = useEffectEvent(() => {
    draggingRef.current = null;
    setIsDragging(false);
  });

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom((current) => Math.min(2.4, Math.max(0.85, current + direction)));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = {
      origin: { x: event.clientX, y: event.clientY },
      offset,
    };
    setIsDragging(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const PAN_STEP = 20;
    const ZOOM_STEP = 0.08;
    
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        setOffset(prev => ({ ...prev, y: prev.y + PAN_STEP }));
        break;
      case "ArrowDown":
        event.preventDefault();
        setOffset(prev => ({ ...prev, y: prev.y - PAN_STEP }));
        break;
      case "ArrowLeft":
        event.preventDefault();
        setOffset(prev => ({ ...prev, x: prev.x + PAN_STEP }));
        break;
      case "ArrowRight":
        event.preventDefault();
        setOffset(prev => ({ ...prev, x: prev.x - PAN_STEP }));
        break;
      case "+":
      case "=":
        setZoom(current => Math.min(2.4, current + ZOOM_STEP));
        break;
      case "-":
        setZoom(current => Math.max(0.85, current - ZOOM_STEP));
        break;
      case "Home":
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        break;
    }
  };

  const layer = source[chapter.layer];

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
            {entry.title}
          </button>
        ))}
      </div>
      <div className="atlas__grid">
        <div
          ref={viewportRef}
          className="atlas__viewport"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="application"
          aria-label={`Interactive map for ${chapter.title}`}
          aria-roledescription="interactive map"
        >
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "50% 50%",
              transition: isDragging || prefersReducedMotion ? "none" : "transform 240ms ease",
            }}
          >
            <svg viewBox={`0 0 ${source.width} ${source.height}`} role="img" aria-label={chapter.title}>
              {layer.flatMap((row, y) =>
                row.map((value, x) => {
                  if (!source.landMask[y]?.[x]) {
                    return (
                      <rect
                        key={`water-${x}-${y}`}
                        x={x}
                        y={y}
                        width="1"
                        height="1"
                        fill="rgba(255,255,255,0.42)"
                      />
                    );
                  }
                  return (
                    <rect
                      key={`${x}-${y}`}
                      x={x}
                      y={y}
                      width="1"
                      height="1"
                      fill={colorFor(value, chapter.layer)}
                    />
                  );
                }),
              )}
              {chapter.overlays.includes("coast") &&
                source.coastMask.flatMap((row, y) =>
                  row.map((value, x) =>
                    value ? (
                      <rect
                        key={`coast-${x}-${y}`}
                        x={x}
                        y={y}
                        width="1"
                        height="1"
                        fill="none"
                        stroke="rgba(19,19,19,0.22)"
                        strokeWidth="0.16"
                      />
                    ) : null,
                  ),
                )}
              {chapter.overlays.includes("river") &&
                source.riverMask.flatMap((row, y) =>
                  row.map((value, x) =>
                    value ? (
                      <rect
                        key={`river-${x}-${y}`}
                        x={x}
                        y={y}
                        width="1"
                        height="1"
                        fill="rgba(46,77,93,0.86)"
                      />
                    ) : null,
                  ),
                )}
              {chapter.overlays.includes("sites") &&
                source.sites.map((site) => (
                  <g key={site.id}>
                    <circle
                      cx={site.x * (source.width - 1)}
                      cy={site.y * (source.height - 1)}
                      r="1.15"
                      fill="rgba(255,255,255,0.22)"
                      stroke="rgba(19,19,19,0.8)"
                      strokeWidth="0.25"
                    />
                    <text
                      x={site.x * (source.width - 1) + 1.5}
                      y={site.y * (source.height - 1) - 1.2}
                      fontFamily="var(--font-suisse)"
                      fontSize="2.2"
                      fill="rgba(19,19,19,0.82)"
                    >
                      S{site.id}
                    </text>
                  </g>
                ))}
              {chapter.overlays.includes("boomtowns") &&
                source.sites
                  .filter((site) => site.boomtown)
                  .map((site) => (
                    <circle
                      key={`boomtown-${site.id}`}
                      cx={site.x * (source.width - 1)}
                      cy={site.y * (source.height - 1)}
                      r="2.1"
                      fill="none"
                      stroke="rgba(131,71,50,0.82)"
                      strokeWidth="0.34"
                      strokeDasharray="0.75 0.6"
                    />
                  ))}
              {chapter.overlays.includes("trade-clusters") &&
                source.sites
                  .filter((site) => site.trade_cluster)
                  .map((site) => (
                    <rect
                      key={`cluster-${site.id}`}
                      x={site.x * (source.width - 1) - 1.1}
                      y={site.y * (source.height - 1) - 1.1}
                      width="2.2"
                      height="2.2"
                      fill="none"
                      stroke="rgba(63,92,82,0.86)"
                      strokeWidth="0.3"
                    />
                  ))}
            </svg>
          </div>
        </div>
        <aside className="atlas__narrative">
          <div className="kicker">Atlas Chapter</div>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>{chapter.title}</h2>
          <p>{chapter.narrative}</p>
          <ul className="atlas__site-list">
            {chapter.linkedSites.map((siteId) => {
              const site = source.sites.find((entry) => entry.id === siteId);
              if (!site) {
                return null;
              }
              return (
                <li key={site.id}>
                  <strong>S{site.id}</strong>{" "}
                  {site.boomtown ? "boomtown" : site.trade_cluster ? "trade cluster" : "candidate"}{" "}
                  with suitability {site.suitability.toFixed(2)} and resource rent {site.resource_rent.toFixed(2)}.
                </li>
              );
            })}
          </ul>
          <p className="comparison-note">
            Drag to pan. Scroll to zoom. Use arrow keys to pan, +/- to zoom, and Home to reset. The map remains static-first; only the focused layer and overlay system change client-side.
          </p>
        </aside>
      </div>
    </section>
  );
}