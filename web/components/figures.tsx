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
        <path d="M28 36V212H392" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {[0, 1, 2, 3].map((s) => {
          const y = 52 + s * 40;
          return (
            <path key={s} d={`M28 ${y}H392`} stroke="rgba(19,19,19,0.08)" strokeDasharray="6 8" strokeWidth="1" />
          );
        })}
        {area && <path d={area} fill="rgba(0,0,0,0.04)" />}
        {points && (
          <polyline
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        )}
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
  items: Array<{ label: string; value: number }>;
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
        <path d="M84 24V210H392" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
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
              <rect x="94" y={y} width={width} height="22" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
              <text
                x={100 + width}
                y={y + 15}
                fill="rgba(19,19,19,0.78)"
                fontFamily="var(--font-ui)"
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
        <path d="M42 24V212H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {points.slice(0, visibleCount).map((point, i) => {
          const cx = 42 + ((point.x - xExtent.min) / (xExtent.max - xExtent.min)) * 346;
          const cy = 212 - ((point.y - yExtent.min) / (yExtent.max - yExtent.min)) * 188;

          return (
            <g key={point.label} style={{ opacity: Math.min(1, (visibleCount - i) / 2) }}>
              <circle
                cx={cx}
                cy={cy}
                r={point.boomtown ? 6.2 : 4.6}
                fill={point.boomtown ? "var(--ink)" : "var(--paper)"}
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
              <text
                x={cx + 8}
                y={cy - 8}
                fill="var(--ink)"
                fontFamily="var(--font-ui)"
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
              <td style={{ fontWeight: "bold" }}>{formatMetric(row.value, row.format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

