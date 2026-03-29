"use client";

import type { LayerName } from "@/lib/terrain/types";

const LAYERS: { key: LayerName; label: string }[] = [
  { key: "elevation", label: "ELEV" },
  { key: "arability", label: "ARAB" },
  { key: "resourceRent", label: "RSRC" },
  { key: "defensibility", label: "DFNS" },
  { key: "portQuality", label: "PORT" },
  { key: "suitability", label: "SUIT" },
];

interface LayerToggleProps {
  active: LayerName;
  onChange: (layer: LayerName) => void;
}

export default function LayerToggle({ active, onChange }: LayerToggleProps) {
  return (
    <div className="flex flex-col gap-0">
      <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
        strata layer
      </div>
      <div className="flex flex-wrap gap-1">
        {LAYERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-2 py-1 text-[10px] font-mono tracking-wider border transition-colors ${
              active === key
                ? "border-accent text-accent bg-accent/5"
                : "border-border text-text-muted hover:border-stroke hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
