"use client";

import { SCENARIOS } from "@/lib/data/scenarios";

interface ScenarioSelectorProps {
  selected: string | null;
  onSelect: (name: string) => void;
}

export default function ScenarioSelector({
  selected,
  onSelect,
}: ScenarioSelectorProps) {
  return (
    <div className="flex flex-col">
      <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
        scenario
      </div>
      <div className="flex flex-col gap-0">
        {SCENARIOS.map((s) => (
          <button
            key={s.name}
            onClick={() => onSelect(s.name)}
            className={`group text-left px-2 py-1.5 border-l-2 transition-colors ${
              selected === s.name
                ? "border-l-accent bg-accent/5 text-text-bright"
                : "border-l-transparent hover:border-l-stroke hover:bg-surface-raised"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono small-caps">
                {s.label}
              </span>
              {s.overrideCount > 0 && (
                <span className="text-[8px] text-text-muted tabular-nums">
                  {s.overrideCount} overrides
                </span>
              )}
            </div>
            {selected === s.name && (
              <div className="text-[9px] text-text-muted mt-0.5 leading-tight">
                {s.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
