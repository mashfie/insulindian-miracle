"use client";

import katex from "katex";
import { useEffect, useState } from "react";

import type { FigureRef, ScenarioSummaryStat } from "@/lib/content/types";

function extent(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

function toSvgPoint(
  index: number,
  value: number,
  count: number,
  min: number,
  max: number,
) {
  const x = 28 + (index / Math.max(count - 1, 1)) * 364;
  const y = 212 - ((value - min) / Math.max(max - min, 0.0001)) * 176;
  return `${x},${y}`;
}

export function formatMetric(
  value: number,
  format: ScenarioSummaryStat["format"],
) {
  if (format === "percent") {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (format === "signed") {
    return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  }

  return value.toFixed(1);
}

export function FigureMeta({ figure, iteration }: { figure: FigureRef, iteration?: number }) {
  return (
    <>
      <div className="figure-meta">
        <span>{figure.title}</span>
        <span>{iteration !== undefined ? `T=${iteration}` : figure.kind}</span>
      </div>
      <p className="figure-caption">{figure.caption}</p>
    </>
  );
}

export function TrendFigure({
  values,
  figure,
  accent = "var(--accent)",
}: {
  values: number[];
  figure: FigureRef;
  accent?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= values.length) {
          clearInterval(timer);
          return values.length;
        }
        return s + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [values]);

  const currentValues = values.slice(0, step);
  const { min, max } = extent(values.length > 0 ? values : [0, 1]); 
  const points = currentValues
    .map((v, i) => toSvgPoint(i, v, values.length, min, max))
    .join(" ");
  const area = points.length > 0 ? `M28,212 L${points} L${28 + ((step - 1) / Math.max(values.length - 1, 1)) * 364},212 Z` : "";

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M28 36V212H392" stroke="var(--line)" strokeWidth="1" />
        {area && <path d={area} fill={accent} opacity="0.10" />}
        {points && (
          <polyline
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <text x="24" y="216" textAnchor="end" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9">{min.toFixed(1)}</text>
        <text x="24" y="40" textAnchor="end" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9">{max.toFixed(1)}</text>
        <text x="392" y="228" textAnchor="end" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9">T={values.length}</text>
      </svg>
      <FigureMeta figure={figure} iteration={step} />
    </figure>
  );
}

export function ComparisonBars({
  figure,
  items,
}: {
  figure: FigureRef;
  items: Array<{ label: string; value: number; color?: string }>;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(timer);
          return 1;
        }
        return p + 0.05;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [items]);

  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M84 24V210H392" stroke="var(--line)" strokeWidth="1" />
        {items.map((item, index) => {
          const y = 42 + index * 40;
          const width = (item.value / max) * 280 * progress;
          return (
            <g key={item.label}>
              <text
                x="76"
                y={y + 14}
                textAnchor="end"
                fill="rgba(19,19,19,0.72)"
                fontFamily="var(--font-ui)"
                fontSize="11"
                letterSpacing="1.4"
              >
                {item.label.toUpperCase()}
              </text>
              <rect x="94" y={y} width={width} height="22" fill={item.color ?? "var(--paper)"} stroke="var(--ink)" strokeWidth="1.5" opacity="0.85" />
              <text
                x={100 + width}
                y={y + 15}
                fill="rgba(19,19,19,0.78)"
                fontFamily="var(--font-data)"
                fontSize="12"
              >
                {(item.value * progress).toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

export function OutcomeScatter({
  figure,
  points,
}: {
  figure: FigureRef;
  points: Array<{
    x: number;
    y: number;
    label: string;
    boomtown?: boolean;
  }>;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const timer = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= points.length) {
          clearInterval(timer);
          return points.length;
        }
        return c + 1;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [points]);

  const xExtent = extent(points.map((point) => point.x));
  const yExtent = extent(points.map((point) => point.y));

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V212H388" stroke="var(--line)" strokeWidth="1" />
        <text x="215" y="232" textAnchor="middle" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9">Resource Rent</text>
        <text x="12" y="118" textAnchor="middle" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9" transform="rotate(-90 12 118)">Population</text>
        {points.slice(0, visibleCount).map((point, i) => {
          const cx = 42 + ((point.x - xExtent.min) / (xExtent.max - xExtent.min)) * 346;
          const cy = 212 - ((point.y - yExtent.min) / (yExtent.max - yExtent.min)) * 188;

          return (
            <g key={point.label} style={{ opacity: Math.min(1, (visibleCount - i) / 2) }}>
              <circle
                cx={cx}
                cy={cy}
                r={point.boomtown ? 6.2 : 4.6}
                fill={point.boomtown ? "#9e3a22" : "#4a5f78"}
                stroke={point.boomtown ? "#5a2010" : "#2a3a48"}
                strokeWidth="1.5"
                opacity="0.88"
              />
              <text
                x={cx + 8}
                y={cy - 8}
                fill="var(--ink)"
                fontFamily="var(--font-data)"
                fontSize="10"
                fontWeight="bold"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} iteration={visibleCount} />
    </figure>
  );
}

export function EquationFigure({
  figure,
  latex,
}: {
  figure: FigureRef;
  latex: string;
}) {
  return (
    <figure className="figure-card">
      <div
        className="katex-display"
        style={{ color: "var(--ink)" }}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(latex, {
            displayMode: true,
            throwOnError: false,
          }),
        }}
      />
      <FigureMeta figure={figure} />
    </figure>
  );
}

export function RewardTrajectory({
  figure,
  series,
}: {
  figure: FigureRef;
  series: Array<{
    label: string;
    mean: number[];
    std: number[];
    color: string;
  }>;
}) {
  const [step, setStep] = useState(0);

  const maxLen = Math.max(...series.map((s) => s.mean.length), 1);

  useEffect(() => {
    setStep(0);
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxLen) {
          clearInterval(timer);
          return maxLen;
        }
        return s + Math.max(1, Math.floor(maxLen / 120));
      });
    }, 30);
    return () => clearInterval(timer);
  }, [maxLen]);

  const allValues = series.flatMap((s) => {
    const cumMean: number[] = [];
    let acc = 0;
    for (const v of s.mean) {
      acc += v;
      cumMean.push(acc);
    }
    return cumMean;
  });
  const { min, max } = extent(allValues.length > 0 ? allValues : [0, 1]);

  function toX(i: number) {
    return 42 + (i / Math.max(maxLen - 1, 1)) * 340;
  }
  function toY(v: number) {
    return 210 - ((v - min) / Math.max(max - min, 0.0001)) * 186;
  }

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V210H388" stroke="var(--line)" strokeWidth="1" />
        {series.map((s) => {
          const cumMean: number[] = [];
          const cumUpper: number[] = [];
          const cumLower: number[] = [];
          let accMean = 0;
          let accVar = 0;
          for (let i = 0; i < Math.min(step, s.mean.length); i++) {
            accMean += s.mean[i];
            accVar += s.std[i] * s.std[i];
            cumMean.push(accMean);
            const band = Math.sqrt(accVar);
            cumUpper.push(accMean + band);
            cumLower.push(accMean - band);
          }

          if (cumMean.length === 0) return null;

          const bandPath =
            cumUpper.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ") +
            " " +
            [...cumLower].reverse().map((v, i) => `L${toX(cumLower.length - 1 - i)},${toY(v)}`).join(" ") +
            " Z";

          const linePath = cumMean
            .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`)
            .join(" ");

          const lastY = cumMean.length > 0 ? toY(cumMean[cumMean.length - 1]) : 0;
          const lastX = cumMean.length > 0 ? toX(cumMean.length - 1) : 0;

          return (
            <g key={s.label}>
              <path d={bandPath} fill={s.color} opacity="0.12" />
              <path d={linePath} fill="none" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              {cumMean.length > 0 && step >= maxLen && (
                <text x={lastX + 4} y={lastY} fill={s.color} fontFamily="var(--font-ui)" fontSize="9" dominantBaseline="middle">{s.label}</text>
              )}
            </g>
          );
        })}
        <text x="38" y="214" textAnchor="end" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9">{min.toFixed(0)}</text>
        <text x="38" y="28" textAnchor="end" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9">{max.toFixed(0)}</text>
        <text x="388" y="224" textAnchor="end" fill="var(--ink-faint)" fontFamily="var(--font-data)" fontSize="9">T={maxLen}</text>
      </svg>
      <div className="figure-meta">
        <span>{figure.title}</span>
        <span>T={step}</span>
      </div>
      <p className="figure-caption">{figure.caption}</p>
    </figure>
  );
}

export function PolicyRankingBars({
  figure,
  items,
  oracle,
}: {
  figure: FigureRef;
  items: Array<{ label: string; value: number; color?: string }>;
  oracle?: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(timer);
          return 1;
        }
        return p + 0.04;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [items]);

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((i) => i.value), oracle ?? 0, 1);
  const barHeight = Math.min(22, Math.max(14, 180 / sorted.length));
  const gap = Math.min(6, Math.max(2, (200 - barHeight * sorted.length) / sorted.length));

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M100 16V224H392" stroke="var(--line)" strokeWidth="1" />
        {oracle !== undefined ? (
          <>
            <line
              x1={100 + (oracle / max) * 280}
              y1={16}
              x2={100 + (oracle / max) * 280}
              y2={224}
              stroke="rgba(19,19,19,0.3)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x={100 + (oracle / max) * 280}
              y={12}
              textAnchor="middle"
              fill="rgba(19,19,19,0.5)"
              fontFamily="var(--font-ui)"
              fontSize="9"
              letterSpacing="1.2"
            >
              ORACLE
            </text>
          </>
        ) : null}
        {sorted.map((item, index) => {
          const y = 22 + index * (barHeight + gap);
          const width = (item.value / max) * 280 * progress;
          return (
            <g key={item.label}>
              <text
                x="94"
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fill="rgba(19,19,19,0.72)"
                fontFamily="var(--font-ui)"
                fontSize="10"
                letterSpacing="1"
              >
                {item.label.toUpperCase()}
              </text>
              <rect
                x="100"
                y={y}
                width={width}
                height={barHeight}
                fill={item.color ?? "var(--paper)"}
                stroke="var(--ink)"
                strokeWidth="1.2"
              />
              <text
                x={106 + width}
                y={y + barHeight / 2 + 4}
                fill="rgba(19,19,19,0.78)"
                fontFamily="var(--font-data)"
                fontSize="11"
              >
                {(item.value * progress).toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

export function StatsTable({
  title,
  rows,
}: {
  title: string;
  rows: ScenarioSummaryStat[];
}) {
  return (
    <div className="figure-card">
      <div className="figure-meta">
        <span>{title}</span>
        <span>table</span>
      </div>
      <table className="data-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>{row.label.toUpperCase()}</th>
              <td style={{ fontFamily: "var(--font-data)", fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}>{formatMetric(row.value, row.format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

