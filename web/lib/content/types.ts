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
  kind: "trend" | "comparison" | "scatter" | "table" | "atlas" | "equation";
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
  collection: "scenarios" | "policies" | "theory";
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
