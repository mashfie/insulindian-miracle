export type ArchiveSection = {
  id: string;
  title: string;
  html: string;
  layout: "full" | "split";
};

export type FigureRef = {
  id: string;
  title: string;
  caption: string;
  kind: "trend" | "comparison" | "scatter" | "table" | "atlas" | "equation" | "distribution";
};

export type PullQuote = {
  text: string;
  attribution?: string;
};

export type ArchivePage = {
  slug: string;
  title: string;
  dek: string;
  lede: string;
  sections: ArchiveSection[];
  figureRefs: FigureRef[];
  references: string[];
  pullQuotes: PullQuote[];
};

export type ReferenceEntry = {
  id: string;
  category: string;
  tier: string;
  type: string;
  title: string;
  authors: string[];
  year: number | null;
  landingUrl: string | null;
  downloadUrl: string | null;
  openAccess: boolean;
  notes: string;
  annotation?: string;
};

export type NormalizedDoc = {
  slug: string;
  route: string;
  title: string;
  collection: "scenarios" | "policies" | "archive";
  sourceGroup: string;
  html: string;
  summaryHtml: string;
  sections: ArchiveSection[];
  related: string[];
  tags: string[];
};

export type ScenarioSummaryStat = {
  label: string;
  value: number;
  format: "number" | "percent" | "signed";
};

export type ScenarioResultPayload = {
  fileSlug: string;
  policyKeys: string[];
  summary: Record<string, Record<string, number>>;
  oracleSummary: Record<string, number>;
  scenario: {
    name: string;
    description: string;
    overrides: Record<string, number>;
  };
  runs: number;
  sampleFileSlug?: string | null;
  cohorts?: Record<
    string,
    {
      runs: number;
      summary: Record<string, Record<string, number>>;
      oracle_summary?: Record<string, number>;
    }
  >;
  visuals?: Record<string, unknown>;
  paired_effects?: Array<Record<string, unknown>>;
};

export type ScenarioPage = {
  slug: string;
  archive: ArchivePage;
  document: NormalizedDoc | null;
  result: ScenarioResultPayload | null;
  stats: ScenarioSummaryStat[];
};

export type PolicyPage = {
  slug: string;
  archive: ArchivePage;
  document: NormalizedDoc;
  evidenceScenario: string | null;
  dossier: PolicyDossier | null;
};

export type CohortEvidenceStatus = {
  status: string;
  rows: number;
  input_path: string;
  output_path: string;
};

export type CohortSynthesis = {
  generated_at: string;
  headline_totals: Record<string, number>;
  cohort_breakdown: Array<{
    cohort: string;
    label: string;
    executions: number;
    config_count: number;
    policy_count: number;
  }>;
  legacy_ranking: Array<{ label: string; value: number; policy: string }>;
  combined_ranking: Array<{ label: string; value: number; policy: string }>;
  scenario_heatmap: {
    labelsX: string[];
    labelsY: string[];
    data: number[][];
  };
  scenario_winners: Array<{ label: string; value: number; color: string }>;
  paired_vs_ucb1: Array<Record<string, unknown>>;
  paired_vs_oracle: Array<Record<string, unknown>>;
};

export type PolicyDossier = {
  policy: string;
  summary: Record<string, number | null>;
  cohort_reward_items: Array<{ label: string; value: number }>;
  distribution_bins: Array<{ label: string; count: number }>;
  heatmap: {
    labelsX: string[];
    labelsY: string[];
    data: number[][];
  };
  scenario_gap_items: Array<{ label: string; start: number; end: number }>;
  paired_vs_oracle: Array<Record<string, unknown>>;
};

export type PolicyDossiersPayload = {
  [policy: string]: PolicyDossier;
};

export type AtlasSite = {
  id: number;
  x: number;
  y: number;
  port_access: number;
  river_access: number;
  arability: number;
  defensibility: number;
  accessibility: number;
  resource_rent: number;
  suitability: number;
  boomtown?: boolean;
  trade_cluster?: boolean;
};

export type AtlasSource = {
  width: number;
  height: number;
  elevation: number[][];
  resourceRent: number[][];
  suitability: number[][];
  accessibility: number[][];
  defensibility: number[][];
  landMask: boolean[][];
  riverMask: boolean[][];
  coastMask: boolean[][];
  sites: AtlasSite[];
};

export type AtlasChapter = {
  id: string;
  title: string;
  layer: keyof Pick<
    AtlasSource,
    "elevation" | "resourceRent" | "suitability" | "accessibility" | "defensibility"
  >;
  overlays: Array<"river" | "coast" | "sites" | "boomtowns" | "trade-clusters">;
  narrative: string;
  linkedSites: number[];
};
