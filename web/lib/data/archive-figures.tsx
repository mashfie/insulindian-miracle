import type { ReactNode } from "react";

import {
  ComparisonBars,
  EquationFigure,
  OutcomeScatter,
  StatsTable,
  TrendFigure,
} from "@/components/figures";
import type { ArchivePage, ScenarioPage } from "@/lib/content/types";

type RawResult = Record<string, unknown>;

function figureAt(archive: ArchivePage, index: number, fallbackTitle: string, kind: ArchivePage["figureRefs"][number]["kind"]) {
  return (
    archive.figureRefs[index] ?? {
      id: `${archive.slug}-${index}`,
      title: fallbackTitle,
      caption: fallbackTitle,
      kind,
    }
  );
}

export function buildLandingVisuals({
  archive,
  whittleRun,
  ucbBaitSummary,
}: {
  archive: ArchivePage;
  whittleRun: RawResult | null;
  ucbBaitSummary: RawResult | null;
}): ReactNode[] {
  const rewardHistory = Array.isArray(whittleRun?.reward_history)
    ? (whittleRun?.reward_history as number[])
    : [];
  const siteOutcomes = Array.isArray(whittleRun?.site_outcomes)
    ? (whittleRun?.site_outcomes as Array<Record<string, number | boolean>>)
    : [];
  const summary = (ucbBaitSummary?.summary ?? {}) as Record<string, Record<string, number>>;
  const oracleSummary = (ucbBaitSummary?.oracle_summary ?? {}) as Record<string, number>;
  const metrics = (whittleRun?.metrics ?? {}) as Record<string, number>;

  return [
    <TrendFigure
      key="trend"
      values={rewardHistory.slice(0, 80)}
      figure={figureAt(archive, 0, "Reward history across a single Whittle-index run.", "trend")}
    />,
    <ComparisonBars
      key="comparison"
      figure={figureAt(
        archive,
        1,
        "Mean cumulative reward in the ucb-bait scenario, benchmarked against the oracle.",
        "comparison",
      )}
      items={[
        { label: "Oracle", value: oracleSummary.mean_cumulative_reward ?? 0 },
        { label: "Gauss TS", value: summary["gaussian-thompson"]?.mean_cumulative_reward ?? 0 },
        { label: "UCB1", value: summary.ucb1?.mean_cumulative_reward ?? 0 },
        { label: "Whittle", value: summary["whittle-index"]?.mean_cumulative_reward ?? 0 },
      ]}
    />,
    <EquationFigure
      key="equation"
      figure={figureAt(
        archive,
        2,
        "The archive tracks regret against the oracle and concentration through HHI rather than treating raw reward as a sufficient statistic.",
        "equation",
      )}
      latex={String.raw`\mathrm{regret}_{\pi}=R_{\mathrm{oracle}}-R_{\pi}, \qquad \mathrm{HHI}=\sum_i s_i^2`}
    />,
    <OutcomeScatter
      key="scatter"
      figure={figureAt(
        archive,
        3,
        "Resource rent and final population do not collapse into a single axis; boomtowns can remain rich while failing to dominate the urban system.",
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
      title="Run diagnostics"
      rows={[
        {
          label: "Mean final extraction",
          value: Number(metrics.mean_final_extraction ?? 0),
          format: "percent",
        },
        {
          label: "Population HHI",
          value: Number(metrics.population_hhi ?? 0),
          format: "percent",
        },
        {
          label: "Zipf slope",
          value: Number(metrics.zipf_slope ?? 0),
          format: "signed",
        },
        {
          label: "Selection HHI",
          value: Number(metrics.selection_hhi ?? 0),
          format: "percent",
        },
      ]}
    />,
  ];
}

export function buildScenarioVisuals({
  page,
  rawResult,
}: {
  page: ScenarioPage;
  rawResult: RawResult | null;
}): ReactNode[] {
  const summary = page.result?.summary ?? {};
  const sampleRun = ((rawResult?.results as Record<string, Array<Record<string, unknown>>> | undefined)?.[
    "gaussian-thompson"
  ] ?? [])[0] as Record<string, unknown> | undefined;
  const rewardHistory = Array.isArray(sampleRun?.reward_history)
    ? (sampleRun.reward_history as number[])
    : [];
  const siteOutcomes = Array.isArray(sampleRun?.site_outcomes)
    ? (sampleRun.site_outcomes as Array<Record<string, number | boolean>>)
    : [];

  return [
    <ComparisonBars
      key="summary-bars"
      figure={figureAt(
        page.archive,
        0,
        "UCB1, Gaussian Thompson, and Whittle index diverge sharply under boomtown pressure.",
        "comparison",
      )}
      items={[
        { label: "Oracle", value: page.result?.oracleSummary.mean_cumulative_reward ?? 0 },
        { label: "Gauss TS", value: summary["gaussian-thompson"]?.mean_cumulative_reward ?? 0 },
        { label: "UCB1", value: summary.ucb1?.mean_cumulative_reward ?? 0 },
        { label: "Whittle", value: summary["whittle-index"]?.mean_cumulative_reward ?? 0 },
      ]}
    />,
    <TrendFigure
      key="trend"
      values={rewardHistory.slice(0, 120)}
      figure={figureAt(
        page.archive,
        1,
        "A single Gaussian Thompson run: the early boom does not survive institutional drift.",
        "trend",
      )}
    />,
    <OutcomeScatter
      key="scatter"
      figure={figureAt(
        page.archive,
        2,
        "The boomtown remains legible in resource space even when it stops justifying repeated selection.",
        "scatter",
      )}
      points={siteOutcomes.slice(0, 15).map((site, index) => ({
        x: Number(site.resource_rent ?? 0),
        y: Number(site.final_population ?? 0),
        label: `S${index}`,
        boomtown: Boolean(site.boomtown),
      }))}
    />,
    <EquationFigure
      key="equation"
      figure={figureAt(
        page.archive,
        3,
        "The boomtown trap is visible as a difference between immediate resource payoff and longer-run institutional cost.",
        "equation",
      )}
      latex={String.raw`r_t = g_i + \rho_i(0.2 + 1.35 e_t) + \gamma_t - \kappa_t`}
    />,
    <StatsTable
      key="metrics"
      title="Scenario diagnostics"
      rows={page.stats}
    />,
  ];
}
