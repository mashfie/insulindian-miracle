"use client";

import { useMemo, useState } from "react";

import comparisonsData from "@/content/generated/comparisons.json";

type PolicyRow = {
  policy: string;
  cumulative_reward: number;
  myopic_oracle_gap: number;
  oracle_regret: number;
  cohort_runs: number;
};

type ScenarioBundle = {
  scenario: { name: string; description: string };
  cohort_runs: number;
  policies: Record<string, PolicyRow>;
};

type ComparisonsFile = {
  generatedAt: string;
  scenarios: Record<string, ScenarioBundle>;
};

const SCENARIO_ALIASES: Record<string, string> = {
  "resource-curse-scenario": "resource-curse",
  "balanced-urban": "balanced-urban-system",
};

const POLICY_LABELS: Record<string, string> = {
  "epsilon-greedy": "ε-greedy",
  "ucb1": "UCB1",
  "discounted-ucb": "Discounted UCB",
  "sliding-window-ucb": "Sliding-window UCB",
  "gaussian-thompson": "Gaussian Thompson",
  "discounted-gaussian-thompson": "Discounted GTS",
  "linucb": "LinUCB",
  "linear-thompson": "Linear Thompson",
  "whittle-index": "Whittle index",
};

const COMPARISONS = comparisonsData as ComparisonsFile;

function lookup(scenario: string): ScenarioBundle | null {
  const canonical = SCENARIO_ALIASES[scenario] ?? scenario;
  return COMPARISONS.scenarios[canonical] ?? COMPARISONS.scenarios[scenario] ?? null;
}

function formatNumber(value: number, fractionDigits = 1) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

type ComparisonModuleProps = {
  scenario: string;
  policies: string[];
  note: string;
};

export function ComparisonModule({ scenario, policies, note }: ComparisonModuleProps) {
  const bundle = useMemo(() => lookup(scenario), [scenario]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(policies));

  const rows = useMemo(() => {
    if (!bundle) return [];
    return policies
      .filter((policy) => selected.has(policy))
      .map((policy) => bundle.policies[policy])
      .filter((row): row is PolicyRow => Boolean(row))
      .sort((left, right) => right.cumulative_reward - left.cumulative_reward);
  }, [bundle, policies, selected]);

  const peak = rows.reduce(
    (max, row) => Math.max(max, Math.abs(row.cumulative_reward)),
    1,
  );

  const togglePolicy = (policy: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(policy)) {
        if (next.size > 1) next.delete(policy);
      } else {
        next.add(policy);
      }
      return next;
    });
  };

  if (!bundle) {
    return (
      <figure className="exhibit">
        <figcaption className="exhibit__caption">
          Exhibit · Policy comparison · {scenario}
        </figcaption>
        <p className="exhibit__empty">
          No checked-in cohort summary is bundled for this scenario.
        </p>
      </figure>
    );
  }

  return (
    <figure className="exhibit">
      <figcaption className="exhibit__caption">
        Exhibit · Policy comparison · {bundle.scenario.name} · n={" "}
        {bundle.cohort_runs.toLocaleString("en-US")}
      </figcaption>
      <p className="exhibit__note">{note}</p>
      <div className="exhibit__chips" role="group" aria-label="Toggle policies">
        {policies.map((policy) => {
          const isOn = selected.has(policy);
          return (
            <button
              key={policy}
              type="button"
              className={`chip${isOn ? " chip--on" : ""}`}
              aria-pressed={isOn}
              onClick={() => togglePolicy(policy)}
            >
              {POLICY_LABELS[policy] ?? policy}
            </button>
          );
        })}
      </div>
      <table className="exhibit__table">
        <thead>
          <tr>
            <th scope="col" className="exhibit__col-policy">Policy</th>
            <th scope="col" className="exhibit__col-num">Cumulative reward</th>
            <th scope="col" className="exhibit__col-num">Myopic oracle gap</th>
            <th scope="col" className="exhibit__col-num">Cohort runs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = Math.max(0, Math.min(100, (row.cumulative_reward / peak) * 100));
            return (
              <tr key={row.policy}>
                <th scope="row" className="exhibit__row-label">
                  {POLICY_LABELS[row.policy] ?? row.policy}
                </th>
                <td className="exhibit__cell-num exhibit__cell-bar">
                  <span
                    className="exhibit__bar"
                    aria-hidden="true"
                    style={{ ["--w" as string]: `${pct}%` }}
                  />
                  <span className="exhibit__bar-value">
                    {formatNumber(row.cumulative_reward)}
                  </span>
                </td>
                <td className="exhibit__cell-num">
                  {formatNumber(row.myopic_oracle_gap)}
                </td>
                <td className="exhibit__cell-num">
                  {row.cohort_runs.toLocaleString("en-US")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}
