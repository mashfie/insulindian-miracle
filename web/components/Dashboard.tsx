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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-[12px] text-text-bright small-caps tracking-[0.2em]">
            insulindian miracle
          </h1>
          <span className="text-[8px] text-text-muted tracking-widest">
            v0.1.0
          </span>
        </div>
        <div className="text-[8px] text-text-muted tracking-wider">
          MAB POLICY SIMULATION TESTBED
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: scenario + policy selectors */}
        <aside className="w-56 border-r border-border overflow-y-auto p-3 flex flex-col gap-6">
          <ScenarioSelector
            selected={selectedScenario}
            onSelect={setSelectedScenario}
          />
          <PolicySelector
            selected={selectedPolicy}
            onSelect={setSelectedPolicy}
          />
        </aside>

        {/* Center: terrain map */}
        <main className="flex-1 flex items-center justify-center bg-void p-4">
          <TerrainMap
            terrain={terrain}
            sites={sites}
            activeLayer={activeLayer}
            onSiteHover={handleSiteHover}
          />
        </main>

        {/* Right panel: controls + site info */}
        <aside className="w-52 border-l border-border overflow-y-auto p-3 flex flex-col gap-6">
          <SeedControl seed={seed} onChange={setSeed} />
          <LayerToggle active={activeLayer} onChange={setActiveLayer} />
          <div>
            <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
              site readout
            </div>
            <SiteTooltip site={hoveredSite} />
          </div>

          {/* Site count */}
          <div className="mt-auto">
            <div className="text-[8px] text-text-muted tabular-nums border-t border-border pt-2">
              <div>{sites.length} candidate sites</div>
              <div>{terrain.config.width}×{terrain.config.height} grid</div>
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
        </aside>
      </div>
    </div>
  );
}
