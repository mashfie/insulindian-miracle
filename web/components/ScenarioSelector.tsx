"use client";

import { useState, useEffect } from "react";
import { SCENARIOS } from "@/lib/data/scenarios";

interface ScenarioSelectorProps {
  selected: string | null;
  onSelect: (name: string) => void;
}

export default function ScenarioSelector({
  selected,
  onSelect,
}: ScenarioSelectorProps) {
  const [prevSelected, setPrevSelected] = useState(selected);

  useEffect(() => {
    if (selected !== prevSelected) {
      setPrevSelected(selected);
    }
  }, [selected, prevSelected]);

  return (
    <div className="flex flex-col">
      <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
        scenario
      </div>
      <div className="flex flex-col gap-0">
        {SCENARIOS.map((s, i) => {
          const isSelected = selected === s.name;

          return (
            <button
              key={s.name}
              onClick={() => onSelect(s.name)}
              className={`stagger-item group text-left px-2 py-1.5 border-l-2 select-transition ${
                isSelected
                  ? "border-l-accent bg-accent/8 text-text-bright"
                  : "border-l-transparent hover:border-l-stroke hover:bg-white/[0.02]"
              }`}
              style={{ "--stagger-i": i } as React.CSSProperties}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[13px] select-transition ${
                    isSelected ? "text-accent icon-pulse" : "text-text-muted"
                  }`}
                  onAnimationEnd={(e) =>
                    e.currentTarget.classList.remove("icon-pulse")
                  }
                >
                  {s.icon}
                </span>
                <span className="text-[11px] font-mono small-caps">
                  {s.label}
                </span>
                {s.overrideCount > 0 && (
                  <span className="text-[8px] text-text-muted tabular-nums ml-auto">
                    {s.overrideCount}
                  </span>
                )}
              </div>
              <div
                className="desc-expand text-[9px] text-text-muted leading-tight"
                style={{
                  maxHeight: isSelected ? "80px" : "0px",
                  opacity: isSelected ? 1 : 0,
                  marginTop: isSelected ? "2px" : "0px",
                }}
              >
                {s.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
