"use client";

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
  return (
    <div className="flex flex-col">
      <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
        mab policy
      </div>
      <div className="flex flex-col gap-0">
        {POLICIES.map((p) => (
          <button
            key={p.name}
            onClick={() => onSelect(p.name)}
            className={`group text-left px-2 py-1.5 border-l-2 transition-colors ${
              selected === p.name
                ? "border-l-accent bg-accent/5 text-text-bright"
                : "border-l-transparent hover:border-l-stroke hover:bg-surface-raised"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono small-caps">
                {p.label}
              </span>
              <span
                className={`text-[8px] tracking-widest uppercase ${TYPE_COLORS[p.type]}`}
              >
                {p.type}
              </span>
            </div>
            {selected === p.name && (
              <div className="text-[9px] text-text-muted mt-0.5 leading-tight">
                {p.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
