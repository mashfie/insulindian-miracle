"use client";

import type { Site } from "@/lib/terrain/types";

interface SiteTooltipProps {
  site: Site | null;
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-bright tabular-nums">{value.toFixed(3)}</span>
    </div>
  );
}

export default function SiteTooltip({ site }: SiteTooltipProps) {
  if (!site) {
    return (
      <div className="text-[9px] text-text-muted italic">
        hover a site marker
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-0.5 text-[9px] font-mono"
      style={{
        animation: "card-enter-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <div className="text-accent small-caps text-[11px] mb-1">
        site {site.id}
      </div>
      <div className="text-[8px] text-text-muted mb-1 tabular-nums">
        ({site.x.toFixed(3)}, {site.y.toFixed(3)})
      </div>
      <StatRow label="suitability" value={site.suitability} />
      <StatRow label="port access" value={site.portAccess} />
      <StatRow label="river access" value={site.riverAccess} />
      <StatRow label="arability" value={site.arability} />
      <StatRow label="defensibility" value={site.defensibility} />
      <StatRow label="accessibility" value={site.accessibility} />
      <StatRow label="resource rent" value={site.resourceRent} />
    </div>
  );
}
