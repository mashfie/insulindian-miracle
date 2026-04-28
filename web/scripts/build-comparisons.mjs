import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const RESULTS_DIR = path.join(ROOT, "content", "source", "results");
const OUT_DIR = path.join(ROOT, "content", "generated");
const OUT_FILE = path.join(OUT_DIR, "comparisons.json");

const SCENARIO_ALIASES = {
  "resource-curse-scenario": "resource-curse",
  "balanced-urban": "balanced-urban-system",
};

function canonicalize(name) {
  return SCENARIO_ALIASES[name] ?? name;
}

function totalCohortRuns(cohorts) {
  if (!cohorts || typeof cohorts !== "object") return 0;
  return Object.values(cohorts).reduce(
    (total, cohort) => total + Number(cohort?.runs ?? 0),
    0,
  );
}

function projectFile(payload) {
  const scenario = payload?.scenario;
  const summary = payload?.summary;
  if (!scenario?.name || !summary) return null;
  const cohortRuns = totalCohortRuns(payload.cohorts) || Number(payload.runs ?? 0);
  const policies = {};
  for (const [policy, metrics] of Object.entries(summary)) {
    if (!metrics || typeof metrics !== "object") continue;
    const cumulative = Number(metrics.mean_cumulative_reward ?? 0);
    const gap = Number(
      metrics.mean_myopic_oracle_gap ?? metrics.mean_oracle_regret ?? 0,
    );
    policies[policy] = {
      policy,
      cumulative_reward: cumulative,
      myopic_oracle_gap: gap,
      oracle_regret: gap,
      cohort_runs: cohortRuns,
    };
  }
  return {
    scenario: {
      name: scenario.name,
      description: scenario.description ?? "",
      overrides: scenario.overrides ?? [],
    },
    cohort_runs: cohortRuns,
    policies,
  };
}

function build() {
  if (!existsSync(RESULTS_DIR)) {
    console.warn(`[build-comparisons] no results directory at ${RESULTS_DIR}; writing empty index.`);
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT_FILE, JSON.stringify({ scenarios: {}, generatedAt: new Date().toISOString() }, null, 2));
    return;
  }

  const files = readdirSync(RESULTS_DIR).filter((file) => file.endsWith(".json"));
  const scenarios = {};

  for (const file of files) {
    let payload;
    try {
      payload = JSON.parse(readFileSync(path.join(RESULTS_DIR, file), "utf8"));
    } catch (err) {
      console.warn(`[build-comparisons] skipping ${file}: ${err.message}`);
      continue;
    }
    const projected = projectFile(payload);
    if (!projected) continue;
    const key = canonicalize(projected.scenario.name);
    const existing = scenarios[key];
    if (!existing || projected.cohort_runs > existing.cohort_runs) {
      scenarios[key] = projected;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    OUT_FILE,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), scenarios },
      null,
      2,
    ),
  );
  const count = Object.keys(scenarios).length;
  console.log(`[build-comparisons] wrote ${count} scenario(s) to ${path.relative(ROOT, OUT_FILE)}`);
}

build();
