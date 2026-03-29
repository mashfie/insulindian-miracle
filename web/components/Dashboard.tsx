"use client";

import { useState, useMemo, useCallback } from "react";
import type { LayerName, Site } from "@/lib/terrain/types";
import { DEFAULT_CONFIG } from "@/lib/terrain/types";
import { generateTerrain, selectCandidateSites } from "@/lib/terrain/generate";
import TerrainMap from "./TerrainMap";
import LayerToggle from "./LayerToggle";
import PolicySelector from "./PolicySelector";
import ScenarioSelector from "./ScenarioSelector";
import SeedControl from "./SeedControl";
import SiteTooltip from "./SiteTooltip";

export default function Dashboard() {
  const [seed, setSeed] = useState(DEFAULT_CONFIG.seed);
  const [activeLayer, setActiveLayer] = useState<LayerName>("elevation");
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(
    "gaussian-thompson"
  );
  const [selectedScenario, setSelectedScenario] = useState<string | null>(
    "baseline"
  );
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);

  const { terrain, sites } = useMemo(() => {
    const config = { ...DEFAULT_CONFIG, seed };
    const terrain = generateTerrain(config);
    const sites = selectCandidateSites(terrain, 15, 0.12);
    return { terrain, sites };
  }, [seed]);

  const handleSiteHover = useCallback((site: Site | null) => {
    setHoveredSite(site);
  }, []);

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Full-bleed terrain background */}
      <div className="absolute inset-0 z-0">
        <TerrainMap
          terrain={terrain}
          sites={sites}
          activeLayer={activeLayer}
          onSiteHover={handleSiteHover}
          fullBleed
        />
        {/* Vignette overlay for card readability */}
        <div className="vignette absolute inset-0 z-[2] pointer-events-none" />
      </div>

      {/* Overlay UI */}
      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        {/* Header */}
        <header className="pointer-events-auto glass-card mx-4 mt-3 px-4 py-2 flex items-center justify-between animate-header">
          <div className="flex items-center gap-3">
            <h1 className="text-[12px] text-text-bright small-caps tracking-[0.2em]">
              insulindian miracle
            </h1>
            <span className="text-[8px] text-text-muted tracking-widest">
              v0.2.0
            </span>
          </div>
          <div className="text-[8px] text-text-muted tracking-wider">
            MAB POLICY SIMULATION TESTBED
          </div>
        </header>

        {/* Main content area with floating cards */}
        <div className="flex-1 flex p-4 gap-4 items-start">
          {/* Left floating card: Scenario + Policy selectors */}
          <div className="pointer-events-auto glass-card w-64 max-h-[calc(100vh-100px)] overflow-y-auto p-3 flex flex-col gap-5 animate-card-left">
            <ScenarioSelector
              selected={selectedScenario}
              onSelect={setSelectedScenario}
            />
            <div className="border-t border-border/40" />
            <PolicySelector
              selected={selectedPolicy}
              onSelect={setSelectedPolicy}
            />
          </div>

          {/* Center spacer — terrain shows through */}
          <div className="flex-1" />

          {/* Right floating card: Controls + Site info */}
          <div className="pointer-events-auto glass-card w-56 max-h-[calc(100vh-100px)] overflow-y-auto p-3 flex flex-col gap-5 animate-card-right">
            <SeedControl seed={seed} onChange={setSeed} />
            <LayerToggle active={activeLayer} onChange={setActiveLayer} />

            <div>
              <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
                site readout
              </div>
              <SiteTooltip site={hoveredSite} />
            </div>

            {/* Status bar */}
            <div className="mt-auto">
              <div className="text-[8px] text-text-muted tabular-nums border-t border-border/40 pt-2 flex flex-col gap-0.5">
                <div>{sites.length} candidate sites</div>
                <div>
                  {terrain.config.width}&times;{terrain.config.height} grid
                </div>
                <div>
                  {selectedPolicy && (
                    <span className="text-accent">{selectedPolicy}</span>
                  )}
                  {selectedPolicy && selectedScenario && " / "}
                  {selectedScenario && (
                    <span className="text-text">{selectedScenario}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
