import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

const RESULTS_ROOT = path.join(process.cwd(), "content", "source", "results");
const SCENARIO_ALIASES: Record<string, string> = {
  "resource-curse-scenario": "resource-curse",
  "balanced-urban": "balanced-urban-system",
};

type ScenarioSummaryFile = {
  scenario?: {
    name: string;
    description: string;
    overrides: Record<string, number>;
  };
  summary?: Record<string, Record<string, number>>;
  oracle_summary?: Record<string, number>;
  cohorts?: Record<string, { runs: number }>;
};

function scenarioCandidates(name: string) {
  const canonical = SCENARIO_ALIASES[name] ?? name;
  return [canonical, name];
}

function loadScenarioSummary(scenarioName: string): ScenarioSummaryFile | null {
  if (!existsSync(RESULTS_ROOT)) {
    return null;
  }

  const files = readdirSync(RESULTS_ROOT).filter((file) => file.endsWith(".json"));
  const candidates = scenarioCandidates(scenarioName);
  const matches = files
    .map((file) => {
      const payload = JSON.parse(
        readFileSync(path.join(RESULTS_ROOT, file), "utf8"),
      ) as ScenarioSummaryFile;
      return { file, payload };
    })
    .filter(({ payload }) => candidates.includes(payload.scenario?.name ?? ""))
    .sort((left, right) => {
      const leftRuns = Number(Object.values(left.payload.cohorts ?? {}).reduce((total, cohort) => total + Number(cohort.runs ?? 0), 0));
      const rightRuns = Number(Object.values(right.payload.cohorts ?? {}).reduce((total, cohort) => total + Number(cohort.runs ?? 0), 0));
      return rightRuns - leftRuns;
    });

  return matches[0]?.payload ?? null;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const scenarioName = String(payload.scenario ?? "baseline");
    const policies = Array.isArray(payload.policies)
      ? payload.policies.map((value: unknown) => String(value))
      : ["gaussian-thompson"];

    const summaryFile = loadScenarioSummary(scenarioName);
    if (!summaryFile?.scenario || !summaryFile.summary) {
      return NextResponse.json(
        { error: `No checked-in summary available for scenario ${scenarioName}.` },
        { status: 404 },
      );
    }

    const results = policies
      .map((policy: string) => {
        const metrics = summaryFile.summary?.[policy];
        if (!metrics) return null;
        return {
          policy,
          cumulative_reward: Number(metrics.mean_cumulative_reward ?? 0),
          oracle_regret: Number(metrics.mean_oracle_regret ?? 0),
          cohort_runs: Number(
            Object.values(summaryFile.cohorts ?? {}).reduce(
              (total, cohort) => total + Number(cohort.runs ?? 0),
              0,
            ),
          ),
          reward_history: [],
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      scenario: summaryFile.scenario,
      config: {
        source: "checked-in cohort synthesis",
        requested_policies: policies,
      },
      terrain_summary: {},
      sites: [],
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 },
    );
  }
}
