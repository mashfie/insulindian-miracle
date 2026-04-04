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

const COLORS: Record<string, [number, number, number]> = {
  elevation:    [140, 130, 115],
  resourceRent: [138,  56,  36],
  accessibility: [46,  77,  93],
  defensibility: [32,  44,  58],
  suitability:  [ 63,  92,  82],
};

const DOWNSAMPLE_FACTOR = 4;

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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ origin: Point; offset: Point } | null>(null);
  const deferredChapterId = useDeferredValue(chapterId);
  const chapter = chapters.find((entry) => entry.id === deferredChapterId) ?? chapters[0];

  // Elevation is the terrain shape — flip rows so the voxel Z-axis matches
  // the 2D map orientation (row 0 = top of peninsula = back of isometric view)
  const elevationDs = downsample(source.elevation, DOWNSAMPLE_FACTOR).reverse();
  const voxelW = elevationDs[0]?.length ?? 16;
  const voxelH = elevationDs.length;

  // Layer data for coloring — elevation chapter uses elevation itself (no overlay needed)
  const layerData = source[chapter.layer];
  const overlayDs = chapter.layer === "elevation"
    ? undefined
    : downsample(layerData as number[][], DOWNSAMPLE_FACTOR).reverse();

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

  // Only pass sites to VoxelMap for chapters that include the "sites" overlay
  const voxelSites = chapter.overlays.includes("sites") ? source.sites : [];

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
              <VoxelMap
                data={elevationDs}
                width={voxelW}
                height={voxelH}
                color={COLORS[chapter.layer] ?? COLORS.elevation}
                overlayData={overlayDs}
                sites={voxelSites}
                landMask={source.landMask}
              />
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
