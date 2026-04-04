import type { ReactNode } from "react";

import {
  ComparisonBars,
  EquationFigure,
  OutcomeScatter,
  PolicyRankingBars,
  RewardTrajectory,
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

const POLICY_COLORS: Record<string, string> = {
  "sliding-window-ucb": "#1a5276",
  "whittle-index": "#7d3c98",
  "discounted-ucb": "#117a65",
  "gaussian-thompson": "#b9770e",
  "ucb1": "#922b21",
  "epsilon-greedy": "#7f8c8d",
  "discounted-gaussian-thompson": "#2e86c1",
  "linucb": "#28b463",
  "linear-thompson": "#d4ac0d",
};

function computeAggregateSeries(
  rawResult: RawResult | null,
  policies: string[],
) {
  if (!rawResult) return [];
  const results = rawResult.results as Record<string, Array<Record<string, unknown>>> | undefined;
  if (!results) return [];

  return policies
    .filter((p) => results[p] && results[p].length > 0)
    .map((policyName) => {
      const runs = results[policyName];
      const horizon = (runs[0]?.reward_history as number[] | undefined)?.length ?? 0;
      const mean: number[] = [];
      const std: number[] = [];

      for (let t = 0; t < horizon; t++) {
        let sum = 0;
        let count = 0;
        for (const run of runs) {
          const rh = run.reward_history as number[] | undefined;
          if (rh && t < rh.length) {
            sum += rh[t];
            count++;
          }
        }
        const m = count > 0 ? sum / count : 0;
        let varSum = 0;
        for (const run of runs) {
          const rh = run.reward_history as number[] | undefined;
          if (rh && t < rh.length) {
            varSum += (rh[t] - m) ** 2;
          }
        }
        mean.push(m);
        std.push(count > 1 ? Math.sqrt(varSum / (count - 1)) : 0);
      }

      const shortName = policyName
        .replace("sliding-window-", "SW-")
        .replace("discounted-", "D-")
        .replace("gaussian-", "G-")
        .replace("linear-", "Lin-")
        .replace("epsilon-greedy", "Eps")
        .replace("whittle-index", "Whittle")
        .replace("linucb", "LinUCB")
        .replace("ucb1", "UCB1")
        .replace("myopic-oracle", "Oracle");

      return {
        label: shortName,
        mean,
        std,
        color: POLICY_COLORS[policyName] ?? "#555",
      };
    });
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
  const siteOutcomes = Array.isArray(sampleRun?.site_outcomes)
    ? (sampleRun.site_outcomes as Array<Record<string, number | boolean>>)
    : [];

  const keyPolicies = ["sliding-window-ucb", "whittle-index", "gaussian-thompson", "ucb1"];
  const aggregateSeries = computeAggregateSeries(rawResult, keyPolicies);

  const policyItems = Object.entries(summary)
    .map(([name, data]) => ({
      label: name
        .replace("sliding-window-", "SW-")
        .replace("discounted-", "D-")
        .replace("gaussian-", "G-")
        .replace("linear-", "Lin-")
        .replace("epsilon-greedy", "Eps")
        .replace("whittle-index", "Whittle")
        .replace("linucb", "LinUCB")
        .replace("ucb1", "UCB1"),
      value: data.mean_cumulative_reward ?? 0,
      color: POLICY_COLORS[name],
    }))
    .sort((a, b) => b.value - a.value);

  return [
    <PolicyRankingBars
      key="ranking"
      figure={figureAt(
        page.archive,
        0,
        "Policy ranking by mean cumulative reward across 12 runs.",
        "comparison",
      )}
      items={policyItems}
      oracle={page.result?.oracleSummary.mean_cumulative_reward}
    />,
    aggregateSeries.length > 0 ? (
      <RewardTrajectory
        key="trajectory"
        figure={figureAt(
          page.archive,
          1,
          "Cumulative reward over time: mean across 12 runs with ±1σ confidence band.",
          "trend",
        )}
        series={aggregateSeries}
      />
    ) : (
      <TrendFigure
        key="trend-fallback"
        values={[]}
        figure={figureAt(page.archive, 1, "Reward trajectory", "trend")}
      />
    ),
    <OutcomeScatter
      key="scatter"
      figure={figureAt(
        page.archive,
        2,
        "Resource rent vs final population across candidate sites — boomtowns marked in black.",
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
        "The reward function decomposes into geography, resource payoff, institutional quality, network effects, and congestion penalties.",
        "equation",
      )}
      latex={String.raw`r_t = g_i + \rho_i(0.2 + \beta e_t) + \gamma_t - \kappa_t`}
    />,
    <StatsTable
      key="metrics"
      title="Scenario diagnostics"
      rows={page.stats}
    />,
  ];
}
