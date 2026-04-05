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
  return { x, y };
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
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
  
  const pointCoords = currentValues.map((v, i) => toSvgPoint(i, v, values.length, min, max));
  const points = pointCoords.map(p => `${p.x},${p.y}`).join(" ");

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
        
        {hoveredIndex !== null && step > 0 && hoveredIndex < step && (
          <text x={392} y={24} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            T={hoveredIndex} : {values[hoveredIndex].toFixed(2)}
          </text>
        )}

        {points && (
          <polyline
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Hover overlay targets */}
        {pointCoords.map((p, i) => (
          <g 
            key={i} 
            onMouseEnter={() => setHoveredIndex(i)} 
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "crosshair" }}
          >
            {/* Invisible larger hit target */}
            <circle cx={p.x} cy={p.y} r="10" fill="none" pointerEvents="all" />
            {hoveredIndex === i && (
              <circle cx={p.x} cy={p.y} r="4" fill="var(--paper)" stroke={accent} strokeWidth="2" />
            )}
            {hoveredIndex === i && (
              <line x1={p.x} y1={36} x2={p.x} y2={212} stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="2 2" pointerEvents="none" />
            )}
          </g>
        ))}
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
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
        
        {hoveredIndex !== null && progress > 0.9 && (
          <text x={392} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {items[hoveredIndex].label.toUpperCase()} : {items[hoveredIndex].value.toFixed(2)}
          </text>
        )}

        {items.map((item, index) => {
          const y = 42 + index * 40;
          const width = (item.value / max) * 280 * progress;
          const isHovered = hoveredIndex === index;
          const opacity = hoveredIndex === null ? 0.85 : isHovered ? 1 : 0.3;

          return (
            <g 
              key={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={opacity}
            >
              <text
                x="76"
                y={y + 14}
                textAnchor="end"
                fill={isHovered ? "var(--ink)" : "rgba(19,19,19,0.72)"}
                fontFamily="var(--font-ui)"
                fontSize="11"
                letterSpacing="1.4"
                fontWeight={isHovered ? "bold" : "normal"}
              >
                {item.label.toUpperCase()}
              </text>
              <rect x="94" y={y} width={width} height="22" fill={item.color ?? "var(--paper)"} stroke="var(--ink)" strokeWidth={isHovered ? "2" : "1.5"} />
              {progress > 0.9 && (
                <text
                  x={100 + width}
                  y={y + 15}
                  fill={isHovered ? "var(--ink)" : "rgba(19,19,19,0.78)"}
                  fontFamily="var(--font-ui)"
                  fontSize="12"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  {(item.value * progress).toFixed(1)}
                </text>
              )}
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
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
        
        {hoveredIndex !== null && visibleCount > hoveredIndex && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {points[hoveredIndex].label.toUpperCase()} : X({points[hoveredIndex].x.toFixed(1)}) Y({points[hoveredIndex].y.toFixed(1)}) {points[hoveredIndex].boomtown ? "[BOOMTOWN]" : ""}
          </text>
        )}

        {points.slice(0, visibleCount).map((point, i) => {
          const cx = 42 + ((point.x - xExtent.min) / (xExtent.max - xExtent.min)) * 346;
          const cy = 212 - ((point.y - yExtent.min) / (yExtent.max - yExtent.min)) * 188;

          const isHovered = hoveredIndex === i;
          const baseOpacity = Math.min(1, (visibleCount - i) / 2);
          const opacity = hoveredIndex === null ? baseOpacity : isHovered ? 1 : 0.2;

          return (
            <g 
              key={point.label} 
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out, transform 0.2s", cursor: "crosshair", transformOrigin: `${cx}px ${cy}px` }} 
              opacity={opacity}
              transform={isHovered ? "scale(1.2)" : "scale(1)"}
            >
              {/* Invisible larger hit target */}
              <circle cx={cx} cy={cy} r="12" fill="none" pointerEvents="all" />
              <circle
                cx={cx}
                cy={cy}
                r={point.boomtown ? 6.2 : 4.6}
                fill={point.boomtown ? "#8a3824" : "#4a6a7a"}
                stroke={point.boomtown ? "#4a1810" : "#2a3a48"}
                strokeWidth={isHovered ? "2.5" : "1.5"}
                opacity={isHovered ? "1" : "0.88"}
              />
              <text
                x={cx + (isHovered ? 10 : 8)}
                y={cy - (isHovered ? 10 : 8)}
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
  const [hoveredSeries, setHoveredSeries] = useState<number | null>(null);

  const maxLen = Math.max(...series.map((s) => s.mean.length), 1);

  useEffect(() => {
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
        <path d="M42 24V210H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {[0, 1, 2, 3].map((s) => {
          const y = 40 + s * 42;
          return (
            <path key={s} d={`M42 ${y}H388`} stroke="rgba(19,19,19,0.08)" strokeDasharray="6 8" strokeWidth="1" />
          );
        })}
        {series.map((s, i) => {
          const cumMean: number[] = [];
          const cumUpper: number[] = [];
          const cumLower: number[] = [];
          let accMean = 0;
          let accVar = 0;
          for (let j = 0; j < Math.min(step, s.mean.length); j++) {
            accMean += s.mean[j];
            accVar += s.std[j] * s.std[j];
            cumMean.push(accMean);
            const band = Math.sqrt(accVar);
            cumUpper.push(accMean + band);
            cumLower.push(accMean - band);
          }

          if (cumMean.length === 0) return null;

          const bandPath =
            cumUpper.map((v, idx) => `${idx === 0 ? "M" : "L"}${toX(idx)},${toY(v)}`).join(" ") +
            " " +
            [...cumLower].reverse().map((v, idx) => `L${toX(cumLower.length - 1 - idx)},${toY(v)}`).join(" ") +
            " Z";

          const linePath = cumMean
            .map((v, idx) => `${idx === 0 ? "M" : "L"}${toX(idx)},${toY(v)}`)
            .join(" ");

          const isHovered = hoveredSeries === i;
          const isFaded = hoveredSeries !== null && !isHovered;

          return (
            <g 
              key={s.label}
              onMouseEnter={() => setHoveredSeries(i)}
              onMouseLeave={() => setHoveredSeries(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={isFaded ? 0.15 : 1}
            >
              <path d={bandPath} fill={s.color} opacity={isHovered ? "0.2" : "0.12"} />
              <path d={linePath} fill="none" stroke={s.color} strokeWidth={isHovered ? "3" : "2"} vectorEffect="non-scaling-stroke" />
              {/* Invisible larger hit target for hover */}
              <path d={linePath} fill="none" stroke="transparent" strokeWidth="16" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <div className="figure-meta">
        <span>{figure.title}</span>
        <span>T={step}</span>
      </div>
      <p className="figure-caption">{figure.caption}</p>
      <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
        {series.map((s, i) => (
          <span 
            key={s.label} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.3rem",
              cursor: "pointer",
              opacity: hoveredSeries === null || hoveredSeries === i ? 1 : 0.4,
              transition: "opacity 0.2s"
            }}
            onMouseEnter={() => setHoveredSeries(i)}
            onMouseLeave={() => setHoveredSeries(null)}
          >
            <span style={{ width: 12, height: 3, background: s.color, display: "inline-block" }} />
            {s.label.toUpperCase()}
          </span>
        ))}
      </div>
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
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
        <path d="M100 16V224H392" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        
        {hoveredIndex !== null && progress > 0.9 && (
          <text x={392} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {sorted[hoveredIndex].label.toUpperCase()} : {sorted[hoveredIndex].value.toFixed(1)}
          </text>
        )}

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
          
          const isHovered = hoveredIndex === index;
          const opacity = hoveredIndex === null ? 1 : isHovered ? 1 : 0.3;

          return (
            <g 
              key={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={opacity}
            >
              <text
                x="94"
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fill={isHovered ? "var(--ink)" : "rgba(19,19,19,0.72)"}
                fontFamily="var(--font-ui)"
                fontSize="10"
                letterSpacing="1"
                fontWeight={isHovered ? "bold" : "normal"}
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
                strokeWidth={isHovered ? "2" : "1.2"}
              />
              {progress > 0.9 && (
                <text
                  x={106 + width}
                  y={y + barHeight / 2 + 4}
                  fill={isHovered ? "var(--ink)" : "rgba(19,19,19,0.78)"}
                  fontFamily="var(--font-ui)"
                  fontSize="11"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  {(item.value * progress).toFixed(0)}
                </text>
              )}
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
              <td style={{ fontWeight: "bold" }}>{formatMetric(row.value, row.format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
