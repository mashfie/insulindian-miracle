"use client";

import { useDeferredValue, useState, useTransition } from "react";

import { fetchComparison, type CompareResponse } from "@/lib/api/compare";

type ComparisonModuleProps = {
  scenario: string;
  policies: string[];
  note: string;
};

function summarize(response: CompareResponse) {
  return response.results
    .map((result) => {
      const policy = String(result.policy ?? "unknown");
      const cumulative = Number(result.cumulative_reward ?? 0);
      const regret = Number(result.oracle_regret ?? 0);
      return { policy, cumulative, regret };
    })
    .sort((left, right) => right.cumulative - left.cumulative);
}

export function ComparisonModule({
  scenario,
  policies,
  note,
}: ComparisonModuleProps) {
  const [response, setResponse] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredResponse = useDeferredValue(response);

  const rows = deferredResponse ? summarize(deferredResponse) : [];

  return (
    <section className="comparison-card">
      <div className="comparison-card__header">
        <div>
          <div className="section-kicker">Live Comparison Module</div>
          <h2 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Runtime Compare</h2>
          <p className="comparison-note">{note}</p>
        </div>
        <button
          type="button"
          aria-live="polite"
          onClick={() => {
            startTransition(async () => {
              try {
                setError(null);
                const next = await fetchComparison({
                  seed: 7,
                  scenario,
                  policies,
                });
                setResponse(next);
              } catch (caught) {
                setError(
                  caught instanceof Error ? caught.message : "Comparison request failed.",
                );
              }
            });
          }}
        >
          {isPending ? "Loading..." : "Load Fresh Run"}
        </button>
      </div>
      {error ? <div className="compare-error">{error}</div> : null}
      {rows.length ? (
        <div className="comparison-card__metrics">
          {rows.map((row) => (
            <div key={row.policy} className="metric-card">
              <div className="metric-card__label">{row.policy}</div>
              <div className="metric-card__value">{row.cumulative.toFixed(1)}</div>
              <div className="metric-card__meta">regret {row.regret.toFixed(1)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="comparison-note">
          No live payload loaded yet. Configure <code>NEXT_PUBLIC_COMPARE_API_URL</code> to activate this module.
        </div>
      )}
    </section>
  );
}
