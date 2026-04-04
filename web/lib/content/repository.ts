import "server-only";

import { cache } from "react";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  type ArchivePage,
  type ArchiveSection,
  type AtlasChapter,
  type AtlasSource,
  type NormalizedDoc,
  type PolicyPage,
  type ReferenceEntry,
  type ScenarioPage,
  type ScenarioResultPayload,
} from "@/lib/content/types";
import { renderMarkdown, splitMarkdownSections } from "@/lib/content/markdown";

const SOURCE_ROOT = path.join(process.cwd(), "content", "source");
const DOCS_ROOT = path.join(SOURCE_ROOT, "docs");
const RESULTS_ROOT = path.join(SOURCE_ROOT, "results");
const RESEARCH_ROOT = path.join(SOURCE_ROOT, "research");
const EXEMPLARS_PATH = path.join(process.cwd(), "content", "generated", "exemplars.json");
const ATLAS_SOURCE_PATH = path.join(process.cwd(), "content", "generated", "atlas-source.json");

const SCENARIO_ROUTE_ALIASES: Record<string, string> = {
  "resource-curse": "resource-curse-scenario",
  "balanced-urban-system": "balanced-urban",
};

const SCENARIO_ROUTE_INVERSE = Object.fromEntries(
  Object.entries(SCENARIO_ROUTE_ALIASES).map(([key, value]) => [value, key]),
) as Record<string, string>;

const POLICY_RESULT_ALIASES: Record<string, string> = {
  "thompson-sampling": "gaussian-thompson",
  "discounted-thompson": "discounted-gaussian-thompson",
};

type ExemplarCollection = {
  landing?: ArchivePage;
  scenarios?: Record<string, ArchivePage>;
  bibliography?: Record<string, string>;
};

type GeneratedExemplarPage = {
  slug?: string;
  title: string;
  dek: string;
  lede: string;
  reference_ids?: string[];
  sections?: Array<{
    id: string;
    title: string;
    paragraphs?: string[];
  }>;
  pull_quotes?: Array<{
    quote: string;
    attribution?: string;
  }>;
  figure_captions?: Array<{
    id: string;
    caption: string;
  }>;
};

type GeneratedExemplarCollection = {
  landing_page?: GeneratedExemplarPage;
  scenario_pages?: Record<string, GeneratedExemplarPage>;
  bibliography_annotations?: Record<
    string,
    {
      annotation?: string;
    } | string
  >;
};

const DEFAULT_FIGURE_KINDS: ArchivePage["figureRefs"][number]["kind"][] = [
  "trend",
  "comparison",
  "equation",
  "scatter",
  "table",
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function paragraphHtml(paragraphs: string[] = []) {
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function captionTitle(caption: string, id: string) {
  const sentence = caption.split(".")[0]?.trim();
  return sentence?.length ? sentence : titleFromSlug(id);
}

function normalizeGeneratedPage(page: GeneratedExemplarPage): ArchivePage {
  return {
    slug: page.slug ?? page.title.toLowerCase().replace(/\s+/g, "-"),
    title: page.title,
    dek: page.dek,
    lede: page.lede,
    sections: (page.sections ?? []).map((section, index) => ({
      id: section.id,
      title: section.title,
      html: paragraphHtml(section.paragraphs),
      layout: index % 2 === 0 ? "split" : "full",
    })),
    figureRefs: (page.figure_captions ?? []).map((figure, index) => ({
      id: figure.id,
      title: captionTitle(figure.caption, figure.id),
      caption: figure.caption,
      kind: DEFAULT_FIGURE_KINDS[index % DEFAULT_FIGURE_KINDS.length],
    })),
    references: page.reference_ids ?? [],
    pullQuotes: (page.pull_quotes ?? []).map((quote) => ({
      text: quote.quote,
      attribution: quote.attribution,
    })),
  };
}

function normalizeGeneratedExemplars(raw: GeneratedExemplarCollection): ExemplarCollection {
  const bibliography = Object.fromEntries(
    Object.entries(raw.bibliography_annotations ?? {}).map(([id, value]) => [
      id,
      typeof value === "string" ? value : (value.annotation ?? ""),
    ]),
  );

  return {
    landing: raw.landing_page ? normalizeGeneratedPage(raw.landing_page) : undefined,
    scenarios: raw.scenario_pages
      ? Object.fromEntries(
          Object.entries(raw.scenario_pages).map(([slug, page]) => [
            slug,
            normalizeGeneratedPage({
              ...page,
              slug: page.slug ?? slug,
            }),
          ]),
        )
      : undefined,
    bibliography,
  };
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function deriveRoute(group: string, slug: string) {
  if (group === "policies") {
    return `/policies/${slug}`;
  }
  if (group === "scenarios") {
    return `/scenarios/${slug}`;
  }
  return `/`;
}

function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listMarkdownFiles(entryPath);
    }
    return entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

function docRouteMap() {
  const map: Record<string, string> = {
    "insulindian-miracle": "/",
  };

  for (const file of listMarkdownFiles(DOCS_ROOT)) {
    const relative = path.relative(DOCS_ROOT, file);
    const segments = relative.split(path.sep);
    const group = segments[0] ?? "archive";
    const slug = path.basename(file, ".md");
    const route = deriveRoute(group, slug);

    map[slug.toLowerCase()] = route;
  }

  for (const [alias, slug] of Object.entries(SCENARIO_ROUTE_ALIASES)) {
    map[alias] = `/scenarios/${slug}`;
  }

  return map;
}

async function readDoc(filePath: string, routeMap: Record<string, string>): Promise<NormalizedDoc> {
  const relative = path.relative(DOCS_ROOT, filePath);
  const [rawGroup] = relative.split(path.sep);
  const sourceGroup = rawGroup ?? "archive";
  const collection =
    sourceGroup === "policies"
      ? "policies"
      : sourceGroup === "scenarios"
        ? "scenarios"
        : "archive";
  const slug = path.basename(filePath, ".md");
  const route = deriveRoute(collection, slug);
  const raw = readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const lines = content.trim().split(/\r?\n/);
  const firstHeading = lines.find((line) => line.startsWith("# "));
  const title = firstHeading ? firstHeading.slice(2).trim() : titleFromSlug(slug);
  const withoutTitle = firstHeading
    ? content.replace(firstHeading, "").trim()
    : content.trim();
  const { intro, sections } = splitMarkdownSections(withoutTitle);
  const summaryHtml = await renderMarkdown(intro, routeMap);
  const renderedSections: ArchiveSection[] = await Promise.all(
    sections.map(async (section, index) => ({
      id: section.id,
      title: section.title,
      html: await renderMarkdown(section.markdown, routeMap),
      layout: index % 2 === 0 ? "split" : "full",
    })),
  );

  return {
    slug,
    route,
    title,
    collection,
    sourceGroup,
    html: await renderMarkdown(withoutTitle, routeMap),
    summaryHtml,
    sections: renderedSections,
    related: Array.isArray(data.related)
      ? data.related.map((value) => String(value))
      : [],
    tags: Array.isArray(data.tags)
      ? data.tags.map((value) => String(value))
      : [],
  };
}

export const getDocuments = cache(async () => {
  const routeMap = docRouteMap();
  const docs = await Promise.all(
    listMarkdownFiles(DOCS_ROOT).map((file) => readDoc(file, routeMap)),
  );
  return docs.sort((left, right) => left.title.localeCompare(right.title));
});

export const getDocumentByRoute = cache(async (collection: NormalizedDoc["collection"], slug: string) => {
  const docs = await getDocuments();
  return docs.find((doc) => doc.collection === collection && doc.slug === slug) ?? null;
});

export const getResultsIndex = cache(() => {
  if (!existsSync(RESULTS_ROOT)) return {};
  const resultFiles = readdirSync(RESULTS_ROOT)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const output: Record<string, ScenarioResultPayload> = {};
  for (const file of resultFiles) {
    const fileSlug = file.replace(/\.json$/, "");
    const payload = JSON.parse(readFileSync(path.join(RESULTS_ROOT, file), "utf8")) as Record<string, unknown>;

    if (!("summary" in payload) || !("scenario" in payload)) {
      continue;
    }

    const summary = payload.summary as Record<string, Record<string, number>>;
    const oracleSummary = (payload.oracle_summary ?? {}) as Record<string, number>;
    const scenario = payload.scenario as {
      name: string;
      description: string;
      overrides: Record<string, number>;
    };
    output[fileSlug] = {
      fileSlug,
      policyKeys: Object.keys(summary),
      summary,
      oracleSummary,
      scenario,
      runs: Number(payload.runs ?? 0),
    };
  }

  return output;
});

export const getRawResultFile = cache((fileSlug: string) => {
  const filePath = path.join(RESULTS_ROOT, `${fileSlug}.json`);
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
});

export const getPrimaryScenarioResult = cache((slug: string) => {
  const results = getResultsIndex();
  const candidates = Object.values(results).filter(
    (result) => result.scenario.name === slug,
  );
  if (candidates.length === 0) return null;
  // Prefer the file with the most policies and runs
  candidates.sort(
    (a, b) => b.policyKeys.length * b.runs - a.policyKeys.length * a.runs,
  );
  return candidates[0] ?? null;
});

export const getReferenceEntries = cache(() => {
  const payload = JSON.parse(
    readFileSync(path.join(RESEARCH_ROOT, "index.json"), "utf8"),
  ) as {
    entries: Array<{
      id: string;
      category: string;
      tier: string;
      type: string;
      title: string;
      authors: string[];
      year?: number;
      landing_url?: string;
      download_url?: string | null;
      open_access?: boolean;
      notes?: string;
    }>;
  };

  const annotations = getExemplars().bibliography ?? {};

  return payload.entries.map<ReferenceEntry>((entry) => ({
    id: entry.id,
    category: entry.category,
    tier: entry.tier,
    type: entry.type,
    title: entry.title,
    authors: entry.authors,
    year: entry.year ?? null,
    landingUrl: entry.landing_url ?? null,
    downloadUrl: entry.download_url ?? null,
    openAccess: Boolean(entry.open_access),
    notes: entry.notes ?? "",
    annotation: annotations[entry.id],
  }));
});

export const getExemplars = cache((): ExemplarCollection => {
  if (!existsSync(EXEMPLARS_PATH)) {
    return {};
  }
  const parsed = JSON.parse(readFileSync(EXEMPLARS_PATH, "utf8")) as
    | ExemplarCollection
    | GeneratedExemplarCollection;

  if ("landing" in parsed || "scenarios" in parsed || "bibliography" in parsed) {
    return parsed as ExemplarCollection;
  }

  return normalizeGeneratedExemplars(parsed as GeneratedExemplarCollection);
});

function fallbackArchive(slug: string, title: string, dek: string): ArchivePage {
  return {
    slug,
    title,
    dek,
    lede: dek,
    sections: [],
    figureRefs: [],
    references: [],
    pullQuotes: [],
  };
}

export async function getLandingArchivePage() {
  const landing = getExemplars().landing;
  return (
    landing ??
    fallbackArchive(
      "home",
      "Insulindian Miracle",
      "A computational archive on city formation, institutional drift, and the resource curse.",
    )
  );
}

function formatScenarioStats(result: ScenarioResultPayload | null) {
  if (!result) {
    return [];
  }

  const ts = result.summary["gaussian-thompson"];
  const whittle = result.summary["whittle-index"];
  const ucb1 = result.summary["ucb1"];
  const oracle = result.oracleSummary;

  return [
    {
      label: "Mean Oracle Reward",
      value: Number(oracle.mean_cumulative_reward ?? 0),
      format: "number" as const,
    },
    {
      label: "Gaussian Thompson Reward",
      value: Number(ts?.mean_cumulative_reward ?? 0),
      format: "number" as const,
    },
    {
      label: "Whittle Concentration",
      value: Number(whittle?.mean_selection_hhi ?? 0),
      format: "percent" as const,
    },
    {
      label: "UCB1 Regret",
      value: Number(ucb1?.mean_oracle_regret ?? 0),
      format: "number" as const,
    },
  ];
}

export async function getScenarioPage(slug: string): Promise<ScenarioPage> {
  const canonicalSlug = SCENARIO_ROUTE_INVERSE[slug] ?? slug;
  const docSlug = SCENARIO_ROUTE_ALIASES[canonicalSlug] ?? slug;
  const document = await getDocumentByRoute("scenarios", docSlug);
  const result = getPrimaryScenarioResult(canonicalSlug);
  const exemplar = getExemplars().scenarios?.[canonicalSlug] ?? getExemplars().scenarios?.[slug];

  return {
    slug,
    archive:
      exemplar ??
      fallbackArchive(
        slug,
        document?.title ?? titleFromSlug(slug),
        result?.scenario.description ?? document?.title ?? titleFromSlug(slug),
      ),
    document,
    result,
    stats: formatScenarioStats(result),
  };
}

export async function getScenarioPages() {
  const docs = await getDocuments();
  return Promise.all(
    docs
      .filter((doc) => doc.collection === "scenarios")
      .map((doc) => getScenarioPage(doc.slug)),
  );
}

export async function getPolicyPage(slug: string): Promise<PolicyPage | null> {
  const document = await getDocumentByRoute("policies", slug);
  if (!document) {
    return null;
  }

  const mappedPolicy = POLICY_RESULT_ALIASES[slug] ?? slug;
  const ucbBait = getPrimaryScenarioResult("ucb-bait");
  const evidenceScenario = ucbBait?.summary[mappedPolicy] ? "ucb-bait" : null;

  return {
    slug,
    archive: fallbackArchive(
      slug,
      document.title,
      "Algorithmic policy notes, implementation posture, and scenario evidence.",
    ),
    document,
    evidenceScenario,
  };
}

export async function getPolicyPages() {
  const docs = await getDocuments();
  const entries = await Promise.all(
    docs
      .filter((doc) => doc.collection === "policies")
      .map((doc) => getPolicyPage(doc.slug)),
  );
  return entries.filter((entry): entry is PolicyPage => Boolean(entry));
}

export const getAtlasSource = cache((): AtlasSource | null => {
  if (!existsSync(ATLAS_SOURCE_PATH)) {
    return null;
  }

  return JSON.parse(readFileSync(ATLAS_SOURCE_PATH, "utf8")) as AtlasSource;
});

export function getAtlasChapters(): AtlasChapter[] {
  return [
    {
      id: "terrain",
      title: "Terrain Envelope",
      layer: "elevation",
      overlays: ["coast", "river", "sites"],
      narrative:
        "The peninsula is the prior distribution. A long taper with a river spine, coastal friction, and an interior that never fully escapes the sea. Every algorithm inherits this geography before it makes a single choice.",
      linkedSites: [0, 3, 6],
    },
    {
      id: "strata",
      title: "Extractive Strata",
      layer: "resourceRent",
      overlays: ["sites", "boomtowns"],
      narrative:
        "Resource rent condenses into pockets rather than spreading evenly. The extractive strata are the curse's geography — spatially narrow, institutionally expensive, and precisely where optimistic algorithms concentrate their attention.",
      linkedSites: [3, 6, 14],
    },
    {
      id: "access",
      title: "Access Corridors",
      layer: "accessibility",
      overlays: ["river", "sites", "trade-clusters"],
      narrative:
        "Accessibility is a directional field — highest near the mainland bridge and river corridor, attenuated as the peninsula thins. The Hanseatic and Dutch Republic scenarios live or die by this layer: trade networks reward position, not endowment.",
      linkedSites: [1, 5, 10],
    },
    {
      id: "defense",
      title: "Defensible Interior",
      layer: "defensibility",
      overlays: ["coast", "sites"],
      narrative:
        "Defensibility rewards slope and inland distance — the brake on pure littoral logic. It explains why the highest-suitability sites do not all collapse onto the shore, and why the interior retains strategic value even when trade favours the coast.",
      linkedSites: [4, 8, 12],
    },
    {
      id: "settlement",
      title: "Settlement Suitability",
      layer: "suitability",
      overlays: ["river", "coast", "sites", "boomtowns", "trade-clusters"],
      narrative:
        "Suitability composites every layer — ports, river adjacency, access, arability, defence, resource rent — into a single prior score. This is the landscape before institutional dynamics begin to distort it. The gap between suitability and outcome is the gap the archive measures.",
      linkedSites: [0, 3, 7, 14],
    },
  ];
}
