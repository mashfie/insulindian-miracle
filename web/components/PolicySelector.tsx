"use client";

import { useState, useRef, useEffect } from "react";
import { POLICIES, type PolicyInfo } from "@/lib/data/policies";

const TYPE_COLORS: Record<PolicyInfo["type"], string> = {
  baseline: "text-text-muted",
  optimistic: "text-[#6a8a6a]",
  bayesian: "text-[#8a7a6a]",
  contextual: "text-[#6a7a8a]",
  restless: "text-[#8a6a7a]",
  oracle: "text-[#7a7a6a]",
};

interface PolicySelectorProps {
  selected: string | null;
  onSelect: (name: string) => void;
}

export default function PolicySelector({
  selected,
  onSelect,
}: PolicySelectorProps) {
  const [prevSelected, setPrevSelected] = useState(selected);
  const iconRef = useRef<HTMLSpanElement>(null);

  // Trigger icon pulse on selection change
  useEffect(() => {
    if (selected !== prevSelected) {
      setPrevSelected(selected);
    }
  }, [selected, prevSelected]);

  return (
    <div className="flex flex-col">
      <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
        mab policy
      </div>
      <div className="flex flex-col gap-0">
        {POLICIES.map((p, i) => {
          const isSelected = selected === p.name;
          const justSelected = isSelected && prevSelected !== p.name;

          return (
            <button
              key={p.name}
              onClick={() => onSelect(p.name)}
              className={`stagger-item group text-left px-2 py-1.5 border-l-2 select-transition ${
                isSelected
                  ? "border-l-accent bg-accent/8 text-text-bright"
                  : "border-l-transparent hover:border-l-stroke hover:bg-white/[0.02]"
              }`}
              style={{ "--stagger-i": i } as React.CSSProperties}
            >
              <div className="flex items-center gap-2">
                <span
                  ref={isSelected ? iconRef : undefined}
                  className={`text-[13px] select-transition ${
                    isSelected ? "text-accent icon-pulse" : "text-text-muted"
                  }`}
                  onAnimationEnd={(e) =>
                    e.currentTarget.classList.remove("icon-pulse")
                  }
                >
                  {p.icon}
                </span>
                <span className="text-[11px] font-mono small-caps">
                  {p.label}
                </span>
                <span
                  className={`text-[8px] tracking-widest uppercase ml-auto ${TYPE_COLORS[p.type]}`}
                >
                  {p.type}
                </span>
              </div>
              <div
                className="desc-expand text-[9px] text-text-muted leading-tight"
                style={{
                  maxHeight: isSelected ? "80px" : "0px",
                  opacity: isSelected ? 1 : 0,
                  marginTop: isSelected ? "2px" : "0px",
                }}
              >
                {p.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
