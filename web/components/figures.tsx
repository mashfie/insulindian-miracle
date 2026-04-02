import katex from "katex";

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

export function FigureMeta({ figure }: { figure: FigureRef }) {
  return (
    <>
      <div className="figure-meta">
        <span>{figure.title}</span>
        <span>{figure.kind}</span>
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
  const { min, max } = extent(values);
  const points = values
    .map((value, index) => toSvgPoint(index, value, values.length, min, max))
    .join(" ");
  const area = `M28,212 L${points} L392,212 Z`;

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M28 36V212H392" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {[0, 1, 2, 3].map((step) => {
          const y = 52 + step * 40;
          return (
            <path
              key={step}
              d={`M28 ${y}H392`}
              stroke="rgba(19,19,19,0.08)"
              strokeDasharray="6 8"
              strokeWidth="1"
            />
          );
        })}
        <path d={area} fill="rgba(46,77,93,0.08)" />
        <polyline
          fill="none"
          stroke={accent}
          strokeWidth="2.2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <FigureMeta figure={figure} />
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
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M84 24V210H392" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {items.map((item, index) => {
          const y = 42 + index * 40;
          const width = (item.value / max) * 280;
          return (
            <g key={item.label}>
              <text
                x="76"
                y={y + 14}
                textAnchor="end"
                fill="rgba(19,19,19,0.72)"
                fontFamily="var(--font-suisse)"
                fontSize="11"
                letterSpacing="1.4"
              >
                {item.label.toUpperCase()}
              </text>
              <rect x="94" y={y} width={width} height="22" fill="var(--accent-soft)" />
              <rect x="94" y={y} width={width} height="22" fill="none" stroke="var(--accent)" />
              <text
                x={100 + width}
                y={y + 15}
                fill="rgba(19,19,19,0.78)"
                fontFamily="var(--font-suisse)"
                fontSize="12"
              >
                {item.value.toFixed(1)}
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
  const xExtent = extent(points.map((point) => point.x));
  const yExtent = extent(points.map((point) => point.y));

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V212H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {points.map((point) => {
          const cx = 42 + ((point.x - xExtent.min) / (xExtent.max - xExtent.min)) * 346;
          const cy = 212 - ((point.y - yExtent.min) / (yExtent.max - yExtent.min)) * 188;

          return (
            <g key={point.label}>
              <circle
                cx={cx}
                cy={cy}
                r={point.boomtown ? 6.2 : 4.6}
                fill={point.boomtown ? "rgba(131,71,50,0.28)" : "rgba(46,77,93,0.18)"}
                stroke={point.boomtown ? "var(--danger)" : "var(--accent)"}
              />
              <text
                x={cx + 8}
                y={cy - 8}
                fill="rgba(19,19,19,0.76)"
                fontFamily="var(--font-suisse)"
                fontSize="10.5"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
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
              <th>{row.label}</th>
              <td>{formatMetric(row.value, row.format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
