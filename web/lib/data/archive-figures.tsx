import type { ReactNode } from "react";

import {
  ComparisonBars,
  EquationFigure,
  OutcomeScatter,
  PolicyRankingBars,
  StatsTable,
  TrendFigure,
} from "@/components/figures";

import {
  DumbbellChartFigure,
  HeatmapFigure,
  HistogramFigure,
  UCBBoundsFigure,
} from "@/components/interactive-assets";

import type {
  ArchivePage,
  CohortSynthesis,
  PolicyPage,
  ScenarioPage,
} from "@/lib/content/types";

type RawResult = Record<string, unknown>;

function figureAt(
  archive: ArchivePage,
  index: number,
  fallbackTitle: string,
  kind: ArchivePage["figureRefs"][number]["kind"],
) {
  return (
    archive.figureRefs[index] ?? {
      id: `${archive.slug}-${index}`,
      title: fallbackTitle,
      caption: fallbackTitle,
      kind,
    }
  );
}

const POLICY_COLORS: Record<string, string> = {
  "sliding-window-ucb": "#4a6a7a",
  "whittle-index": "#7a5c6e",
  "discounted-ucb": "#3f5c52",
  "gaussian-thompson": "#b08060",
  "ucb1": "#8a3824",
  "epsilon-greedy": "#8a8070",
  "discounted-gaussian-thompson": "#5a7890",
  "linucb": "#6a7850",
  "linear-thompson": "#a07848",
  "myopic-oracle": "#a08d81",
};

function shortPolicyName(policyName: string) {
  return policyName
    .replace("sliding-window-", "SW-")
    .replace("discounted-", "D-")
    .replace("gaussian-", "G-")
    .replace("linear-", "Lin-")
    .replace("epsilon-greedy", "Eps")
    .replace("whittle-index", "Whittle")
    .replace("linucb", "LinUCB")
    .replace("ucb1", "UCB1")
    .replace("myopic-oracle", "Oracle");
}

function landingRanking(synthesis: CohortSynthesis | null) {
  if (!synthesis) return [];
  return synthesis.combined_ranking.slice(0, 4).map((entry) => ({
    label: entry.label,
    value: entry.value,
    color: POLICY_COLORS[entry.policy] ?? "var(--ink)",
  }));
}

export function buildLandingVisuals({
  archive,
  cohortSynthesis,
  whittleRun,
}: {
  archive: ArchivePage;
  cohortSynthesis: CohortSynthesis | null;
  whittleRun: RawResult | null;
}): ReactNode[] {
  const rewardHistory = Array.isArray(whittleRun?.reward_history)
    ? (whittleRun.reward_history as number[])
    : [];
  const siteOutcomes = Array.isArray(whittleRun?.site_outcomes)
    ? (whittleRun.site_outcomes as Array<Record<string, number | boolean>>)
    : [];

  const totals = cohortSynthesis?.headline_totals ?? {};
  const cohortItems = Object.entries(totals)
    .filter(([label]) => label !== "total")
    .map(([label, value]) => ({
      label: label.replace("_", " "),
      value,
      color:
        label === "legacy_1m"
          ? "#8a3824"
          : label === "historical_90k"
            ? "#4a6a7a"
            : "#3f5c52",
    }));
  const oracleGapArms = (cohortSynthesis?.paired_vs_oracle ?? []).slice(0, 6).map((entry) => {
    const policy = String(entry.policy ?? "unknown");
    const meanGap = Math.abs(Number(entry.mean_gap ?? 0));
    const ciLow = Number(entry.ci_low ?? 0);
    const ciHigh = Number(entry.ci_high ?? 0);
    return {
      label: shortPolicyName(policy),
      mean: meanGap,
      ucb: Math.max(Math.abs(ciHigh - Number(entry.mean_gap ?? 0)), Math.abs(Number(entry.mean_gap ?? 0) - ciLow)),
      color: POLICY_COLORS[policy] ?? "var(--ink)",
    };
  });

  return [
    <ComparisonBars
      key="cohorts"
      figure={figureAt(
        archive,
        0,
        "The evidence program is organized around three cohorts totalling 1,590,008 planned policy executions.",
        "comparison",
      )}
      items={cohortItems}
    />,
    <ComparisonBars
      key="ranking"
      figure={figureAt(
        archive,
        1,
        "Current policy ranking across the cohort synthesis.",
        "comparison",
      )}
      items={landingRanking(cohortSynthesis)}
    />,
    cohortSynthesis ? (
      <HeatmapFigure
        key="heatmap"
        figure={figureAt(
          archive,
          2,
          "Reward, gap, extraction, concentration, and Zipf response across the current top policy block.",
          "comparison",
        )}
        labelsX={cohortSynthesis.scenario_heatmap.labelsX}
        labelsY={cohortSynthesis.scenario_heatmap.labelsY}
        data={cohortSynthesis.scenario_heatmap.data}
      />
    ) : null,
    <EquationFigure
      key="equation"
      figure={figureAt(
        archive,
        3,
        "The archive now treats the evidence base as a stratified program rather than a single undifferentiated sweep.",
        "equation",
      )}
      latex={String.raw`N_{\mathrm{total}}=N_{\mathrm{legacy}}+N_{\mathrm{historical}}+N_{\mathrm{stress}}=1{,}000{,}008+90{,}000+500{,}000`}
    />,
    oracleGapArms.length ? (
      <UCBBoundsFigure
        key="oracle-gap"
        figure={figureAt(
          archive,
          4,
          "Mean oracle gap with a 95% bootstrap interval for the leading non-oracle policies in the scenario-backed cohorts.",
          "comparison",
        )}
        arms={oracleGapArms}
      />
    ) : null,
    rewardHistory.length ? (
      <TrendFigure
        key="trend"
        values={rewardHistory.slice(0, 80)}
        figure={figureAt(
          archive,
          5,
          "A single Whittle-index trace remains in the archive as a concrete path-dependent run, not as a substitute for cohort evidence.",
          "trend",
        )}
        accent={POLICY_COLORS["whittle-index"]}
      />
    ) : (
      <StatsTable
        key="fallback"
        title="Evidence status"
        rows={[
          {
            label: "Planned executions",
            value: cohortSynthesis?.headline_totals.total ?? 0,
            format: "number",
          },
          {
            label: "Legacy cohort",
            value: cohortSynthesis?.headline_totals.legacy_1m ?? 0,
            format: "number",
          },
          {
            label: "Historical cohort",
            value: cohortSynthesis?.headline_totals.historical_90k ?? 0,
            format: "number",
          },
          {
            label: "Stress cohort",
            value: cohortSynthesis?.headline_totals.stress_500k ?? 0,
            format: "number",
          },
        ]}
      />
    ),
      <OutcomeScatter
        key="scatter"
        figure={figureAt(
          archive,
          6,
          "The checked-in raw run still anchors the site-level story: resource rent and final population refuse to collapse into one dimension.",
          "scatter",
        )}
      points={siteOutcomes.slice(0, 15).map((site, index) => ({
        x: Number(site.resource_rent ?? 0),
        y: Number(site.final_population ?? 0),
        label: `S${index}`,
        boomtown: Boolean(site.boomtown),
      }))}
    />,
    <StatsTable
      key="table"
      title="Program diagnostics"
      rows={[
        {
          label: "Planned evidence base",
          value: cohortSynthesis?.headline_totals.total ?? 0,
          format: "number",
        },
        {
          label: "Legacy planned",
          value: cohortSynthesis?.headline_totals.legacy_1m ?? 0,
          format: "number",
        },
        {
          label: "Historical planned",
          value: cohortSynthesis?.headline_totals.historical_90k ?? 0,
          format: "number",
        },
        {
          label: "Stress planned",
          value: cohortSynthesis?.headline_totals.stress_500k ?? 0,
          format: "number",
        },
      ]}
    />,
  ].filter(Boolean);
}

export function buildScenarioVisuals({
  page,
  rawResult,
}: {
  page: ScenarioPage;
  rawResult: RawResult | null;
}): ReactNode[] {
  const summary = page.result?.summary ?? {};
  const visuals = (page.result?.visuals ?? {}) as Record<string, unknown>;
  const ranking = Array.isArray(visuals.ranking)
    ? (visuals.ranking as Array<{ label: string; value: number; policy: string }>)
    : Object.entries(summary)
        .map(([name, data]) => ({
          label: shortPolicyName(name),
          value: Number(data.mean_cumulative_reward ?? 0),
          policy: name,
        }))
        .sort((left, right) => right.value - left.value);
  const dumbbellItems = Array.isArray(visuals.oracle_gap_dumbbell)
    ? (visuals.oracle_gap_dumbbell as Array<{ label: string; start: number; end: number }>)
    : [];
  const heatmap = (visuals.metric_heatmap ?? {
    labelsX: [],
    labelsY: [],
    data: [],
  }) as { labelsX: string[]; labelsY: string[]; data: number[][] };
  const rewardHistogram = Array.isArray(visuals.reward_histogram)
    ? (visuals.reward_histogram as Array<{ label: string; count: number }>)
    : [];
  const sampleRun = ((rawResult?.results as Record<string, Array<Record<string, unknown>>> | undefined)?.[
    "gaussian-thompson"
  ] ?? [])[0] as Record<string, unknown> | undefined;
  const siteOutcomes = Array.isArray(sampleRun?.site_outcomes)
    ? (sampleRun.site_outcomes as Array<Record<string, number | boolean>>)
    : [];

  return [
    <PolicyRankingBars
      key="ranking"
      figure={figureAt(
        page.archive,
        0,
        `Policy ranking by mean cumulative reward across ${page.result?.runs ?? 0} scenario runs.`,
        "comparison",
      )}
      items={ranking.map((entry) => ({
        label: entry.label,
        value: entry.value,
        color: POLICY_COLORS[entry.policy] ?? "var(--ink)",
      }))}
      oracle={page.result?.oracleSummary.mean_cumulative_reward}
    />,
    dumbbellItems.length ? (
      <DumbbellChartFigure
        key="dumbbell"
        figure={figureAt(
          page.archive,
          1,
          "Oracle-gap shift between the historical and stress cohorts for the dominant policy block.",
          "comparison",
        )}
        items={dumbbellItems}
      />
    ) : (
      <HistogramFigure
        key="histogram"
        figure={figureAt(page.archive, 1, "Scenario reward distribution.", "distribution")}
        bins={rewardHistogram}
        accent={POLICY_COLORS[ranking[0]?.policy ?? "whittle-index"] ?? "var(--ink)"}
      />
    ),
    heatmap.data.length ? (
      <HeatmapFigure
        key="heatmap"
        figure={figureAt(
          page.archive,
          2,
          "Relative policy intensity across reward, regret, extraction, concentration, and Zipf response.",
          "comparison",
        )}
        labelsX={heatmap.labelsX}
        labelsY={heatmap.labelsY}
        data={heatmap.data}
      />
    ) : null,
    siteOutcomes.length ? (
      <OutcomeScatter
        key="scatter"
        figure={figureAt(
          page.archive,
          3,
          "A checked-in raw exemplar still anchors the site-level mechanism story.",
          "scatter",
        )}
        points={siteOutcomes.slice(0, 15).map((site, index) => ({
          x: Number(site.resource_rent ?? 0),
          y: Number(site.final_population ?? 0),
          label: `S${index}`,
          boomtown: Boolean(site.boomtown),
        }))}
      />
    ) : null,
    <EquationFigure
      key="heatmap"
      figure={figureAt(
        page.archive,
        4,
        "Scenario evidence stays tied to reward gaps rather than a single scalar ranking.",
        "equation",
      )}
      latex={String.raw`\Delta_{\pi,\pi'}=\mathbb{E}[R_{\pi}-R_{\pi'}], \qquad \widehat{\Delta}\pm \mathrm{CI}_{0.95}`}
    />,
    <StatsTable key="metrics" title="Scenario diagnostics" rows={page.stats} />,
  ].filter(Boolean);
}

export function buildPolicyVisuals({
  page,
}: {
  page: PolicyPage;
}): ReactNode[] {
  if (!page.dossier) return [];
  const cohortItems = page.dossier.cohort_reward_items.map((item) => ({
    label: item.label.replace("_", " "),
    value: item.value,
    color:
      item.label === "legacy_1m"
        ? "#8a3824"
        : item.label === "historical_90k"
          ? "#4a6a7a"
          : "#3f5c52",
  }));
  const rewardBins = page.dossier.distribution_bins;
  const heatmap = page.dossier.heatmap;
  const scenarioGapItems = page.dossier.scenario_gap_items;
  const summary = page.dossier.summary;

  return [
    <ComparisonBars
      key="cohorts"
      figure={figureAt(
        page.archive,
        0,
        "Cohort mean reward for this policy.",
        "comparison",
      )}
      items={cohortItems}
    />,
    scenarioGapItems.length ? (
      <DumbbellChartFigure
        key="scenario-gap"
        figure={figureAt(
          page.archive,
          1,
          "Scenario-level gap against UCB1 across the historical and stress cohorts.",
          "comparison",
        )}
        items={scenarioGapItems}
      />
    ) : (
      <StatsTable
        key="cohort-bars"
        title="Cohort status"
        rows={[
          {
            label: "Tracked scenarios",
            value: Number(summary.scenario_count ?? 0),
            format: "number",
          },
        ]}
      />
    ),
    rewardBins.length ? (
      <HistogramFigure
        key="histogram"
        figure={figureAt(
          page.archive,
          2,
          "Distribution of checked-in scenario rewards for this policy.",
          "distribution",
        )}
        bins={rewardBins}
        accent={POLICY_COLORS[page.dossier.policy] ?? "var(--ink)"}
      />
    ) : null,
    heatmap.data.length ? (
      <HeatmapFigure
        key="heatmap"
        figure={figureAt(
          page.archive,
          3,
          "Condensed policy profile across reward, gap, extraction, concentration, and Zipf response.",
          "comparison",
        )}
        labelsX={heatmap.labelsX}
        labelsY={heatmap.labelsY}
        data={heatmap.data}
      />
    ) : null,
    <StatsTable
      key="policy-stats"
      title="Policy dossier"
      rows={[
        {
          label: "Mean reward",
          value: Number(summary.mean_cumulative_reward ?? 0),
          format: "number",
        },
        {
          label: "Mean oracle regret",
          value: Number(summary.mean_oracle_regret ?? 0),
          format: "number",
        },
        {
          label: "Tracked cohorts",
          value: cohortItems.length,
          format: "number",
        },
        {
          label: "Scenario count",
          value: Number(summary.scenario_count ?? 0),
          format: "number",
        },
      ]}
    />,
  ].filter(Boolean);
}
