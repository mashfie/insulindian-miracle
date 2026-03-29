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
        {LAYERS.map(({ key, label }, i) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`stagger-item px-2 py-1 text-[10px] font-mono tracking-wider border select-transition ${
              active === key
                ? "border-accent text-accent bg-accent/8"
                : "border-border/60 text-text-muted hover:border-accent/40 hover:text-text"
            }`}
            style={{ "--stagger-i": i + 12 } as React.CSSProperties}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
