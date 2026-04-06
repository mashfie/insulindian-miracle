"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Heerich } from "heerich";
import { FigureMeta } from "@/components/figures";
import type { FigureRef } from "@/lib/content/types";

function extent(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

// 1. HistogramFigure
export function HistogramFigure({
  figure,
  bins,
  accent = "var(--ink)",
}: {
  figure: FigureRef;
  bins: Array<{ label: string; count: number }>;
  accent?: string;
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
    }, 40);
    return () => clearInterval(timer);
  }, [bins]);

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const totalWidth = 340;
  const gap = 8;
  const barTotalWidth = totalWidth / Math.max(bins.length, 1);
  const barWidth = Math.max(barTotalWidth - gap, 2);

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V212H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {[0, 1, 2, 3].map((s) => {
          const y = 24 + s * 47;
          return (
            <path key={s} d={`M42 ${y}H388`} stroke="rgba(19,19,19,0.08)" strokeDasharray="6 8" strokeWidth="1" />
          );
        })}
        
        {hoveredIndex !== null && progress > 0.9 && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {bins[hoveredIndex].label.toUpperCase()}: {bins[hoveredIndex].count}
          </text>
        )}

        {bins.map((bin, i) => {
          const h = (bin.count / maxCount) * 188 * progress;
          const x = 42 + gap / 2 + i * barTotalWidth;
          const y = 212 - h;
          const isHovered = hoveredIndex === i;
          const opacity = hoveredIndex === null ? 0.9 : isHovered ? 1 : 0.3;

          return (
            <g 
              key={bin.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={opacity}
            >
              <rect x={x} y={y} width={barWidth} height={Math.max(h, 0)} fill={isHovered ? accent : "var(--paper)"} stroke="var(--ink)" strokeWidth="1.5" />
              {progress > 0.9 && (
                <text x={x + barWidth / 2} y={226} fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9" letterSpacing="0.05em" textAnchor="middle">
                  {bin.label.toUpperCase()}
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

// 2. BubbleChartFigure
export function BubbleChartFigure({
  figure,
  points,
}: {
  figure: FigureRef;
  points: Array<{ x: number; y: number; r: number; label: string; color?: string }>;
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
    }, 40);
    return () => clearInterval(timer);
  }, [points]);

  const xExt = extent(points.map((p) => p.x));
  const yExt = extent(points.map((p) => p.y));
  const maxR = Math.max(...points.map((p) => p.r), 1);

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V212H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        
        {hoveredIndex !== null && progress > 0.9 && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {points[hoveredIndex].label.toUpperCase()} (X: {points[hoveredIndex].x.toFixed(1)}, Y: {points[hoveredIndex].y.toFixed(1)})
          </text>
        )}

        {points.map((p, i) => {
          const cx = 42 + ((p.x - xExt.min) / Math.max(xExt.max - xExt.min, 0.001)) * 346;
          const cy = 212 - ((p.y - yExt.min) / Math.max(yExt.max - yExt.min, 0.001)) * 188;
          const r = Math.max(2, (p.r / maxR) * 24) * progress;
          const isHovered = hoveredIndex === i;
          const opacity = hoveredIndex === null ? 0.7 : isHovered ? 1 : 0.2;

          return (
            <g 
              key={p.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out, transform 0.2s ease-out", cursor: "crosshair", transformOrigin: `${cx}px ${cy}px` }}
              opacity={opacity}
              transform={isHovered ? "scale(1.1)" : "scale(1)"}
            >
              <circle cx={cx} cy={cy} r={r} fill={p.color || "var(--ink)"} stroke="var(--ink)" strokeWidth={isHovered ? "2" : "1"} />
              {progress > 0.8 && r > 10 && (
                <text x={cx} y={cy + 3} fill="var(--paper)" fontFamily="var(--font-ui)" fontSize="9" textAnchor="middle" fontWeight="bold">
                  {p.label}
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

// 3. DumbbellChartFigure
export function DumbbellChartFigure({
  figure,
  items,
}: {
  figure: FigureRef;
  items: Array<{ label: string; start: number; end: number }>;
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
    }, 40);
    return () => clearInterval(timer);
  }, [items]);

  const allVals = items.flatMap((i) => [i.start, i.end]);
  const valExt = extent(allVals.length > 0 ? allVals : [0, 1]);
  
  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M100 24V212H392" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        
        {hoveredIndex !== null && progress > 0.9 && (
          <text x={392} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {items[hoveredIndex].label.toUpperCase()} : {items[hoveredIndex].start} → {items[hoveredIndex].end}
          </text>
        )}

        {items.map((item, i) => {
          const y = 40 + i * Math.max(20, 180 / items.length);
          const xStart = 100 + ((item.start - valExt.min) / Math.max(valExt.max - valExt.min, 0.001)) * 280;
          const xEndTarget = 100 + ((item.end - valExt.min) / Math.max(valExt.max - valExt.min, 0.001)) * 280;
          const xEnd = xStart + (xEndTarget - xStart) * progress;
          
          const isHovered = hoveredIndex === i;
          const opacity = hoveredIndex === null ? 0.9 : isHovered ? 1 : 0.3;

          return (
            <g 
              key={item.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={opacity}
            >
              <text x="92" y={y + 3} textAnchor="end" fill={isHovered ? "var(--ink)" : "var(--ink-soft)"} fontFamily="var(--font-ui)" fontSize="10" fontWeight={isHovered ? "bold" : "normal"}>
                {item.label}
              </text>
              <line x1={xStart} y1={y} x2={xEnd} y2={y} stroke="var(--ink-faint)" strokeWidth={isHovered ? "3" : "2"} strokeDasharray={isHovered ? "none" : "2 2"} />
              <circle cx={xStart} cy={y} r={isHovered ? "5" : "4"} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
              <circle cx={xEnd} cy={y} r={isHovered ? "5.5" : "4.5"} fill={isHovered ? "var(--ink)" : "var(--accent)"} />
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// 4. AreaChartFigure
export function AreaChartFigure({
  figure,
  series,
}: {
  figure: FigureRef;
  series: Array<{ label: string; values: number[]; color: string }>;
}) {
  const [step, setStep] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxLen = Math.max(...series.map((s) => s.values.length), 1);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxLen) {
          clearInterval(timer);
          return maxLen;
        }
        return s + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [maxLen]);

  const allVals = series.flatMap(s => s.values);
  const valExt = extent(allVals.length > 0 ? allVals : [0, 1]);
  
  function toX(i: number) {
    return 42 + (i / Math.max(maxLen - 1, 1)) * 340;
  }
  function toY(v: number) {
    return 210 - ((v - valExt.min) / Math.max(valExt.max - valExt.min, 0.0001)) * 186;
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
          const currentValues = s.values.slice(0, step);
          if (currentValues.length === 0) return null;
          
          const points = currentValues.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
          const area = `M${toX(0)},210 L${points} L${toX(currentValues.length - 1)},210 Z`;
          const line = `M${points.replace(/ /g, ' L')}`;

          const isHovered = hoveredIndex === i;
          const isFaded = hoveredIndex !== null && !isHovered;

          return (
            <g 
              key={s.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={isFaded ? 0.2 : 1}
            >
              <path d={area} fill={s.color} opacity={isHovered ? "0.25" : "0.15"} style={{ transition: "opacity 0.2s" }} />
              <path d={line} fill="none" stroke={s.color} strokeWidth={isHovered ? "3" : "2"} vectorEffect="non-scaling-stroke" style={{ transition: "stroke-width 0.2s" }} />
              {isHovered && step > 0 && (
                <circle cx={toX(currentValues.length - 1)} cy={toY(currentValues[currentValues.length - 1])} r="4" fill="var(--paper)" stroke={s.color} strokeWidth="2" />
              )}
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} iteration={step} />
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
        {series.map((s, i) => (
          <span 
            key={s.label} 
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4, cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            {s.label.toUpperCase()}
          </span>
        ))}
      </div>
    </figure>
  );
}

// 5. RadialBarChart
export function RadialBarChartFigure({
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
    }, 40);
    return () => clearInterval(timer);
  }, [items]);

  const maxVal = Math.max(...items.map(i => i.value), 1);
  const cx = 210;
  const cy = 120;
  const innerRadius = 30;
  const outerRadius = 100;
  
  const arcPath = (startAngle: number, endAngle: number, r: number) => {
    const start = {
      x: cx + Math.cos(startAngle) * r,
      y: cy + Math.sin(startAngle) * r
    };
    const end = {
      x: cx + Math.cos(endAngle) * r,
      y: cy + Math.sin(endAngle) * r
    };
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  const angleStep = (Math.PI * 2) / items.length;

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx={cx} cy={cy} r={innerRadius} fill="var(--paper)" stroke="var(--line-strong)" strokeWidth="1.5" />
        
        {hoveredIndex !== null && progress > 0.9 && (
          <text x={cx} y={cy} textAnchor="middle" alignmentBaseline="middle" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="14" fontWeight="bold">
            {items[hoveredIndex].value.toFixed(0)}
          </text>
        )}

        {items.map((item, i) => {
          const startAngle = i * angleStep - Math.PI / 2;
          const r = innerRadius + ((item.value / maxVal) * (outerRadius - innerRadius)) * progress;
          
          const isHovered = hoveredIndex === i;
          const opacity = hoveredIndex === null ? 0.9 : isHovered ? 1 : 0.3;

          return (
            <g 
              key={item.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out, transform 0.2s", cursor: "crosshair", transformOrigin: `${cx}px ${cy}px` }}
              opacity={opacity}
              transform={isHovered ? "scale(1.05)" : "scale(1)"}
            >
              <path d={arcPath(startAngle, startAngle + angleStep * 0.8, r)} fill={item.color || "var(--accent)"} stroke="var(--paper)" strokeWidth={isHovered ? "2" : "1"} />
              {progress > 0.9 && (
                <text 
                  x={cx + Math.cos(startAngle + angleStep * 0.4) * (r + 18)} 
                  y={cy + Math.sin(startAngle + angleStep * 0.4) * (r + 18)} 
                  fill={isHovered ? "var(--ink)" : "var(--ink-soft)"} 
                  fontFamily="var(--font-ui)" 
                  fontSize="9" 
                  letterSpacing="0.05em"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  {item.label.toUpperCase()}
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

// 6. HeerichBarChart3D
export function HeerichBarChart3D({
  figure,
  data,
  color = [36, 61, 92], // Default to Indigo
}: {
  figure: FigureRef;
  data: number[][];
  color?: [number, number, number];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const camera = { type: "oblique" as const, angle: 30, distance: 20 };
  const tile = 16;
  
  const svgString = useMemo(() => {
    const maxVal = Math.max(...data.flat());
    
    const hr = new Heerich({
      tile,
      camera,
    });
    
    data.forEach((row, z) => {
      row.forEach((val, x) => {
        if (val > 0) {
          const height = Math.max(1, Math.round((val / maxVal) * 8));
          hr.applyGeometry({
            type: "box",
            position: [x * 1.5, 12 - height, z * 1.5],
            size: [1, height, 1],
            style: {
              default: (x, y) => {
                return { 
                  fill: `color-mix(in lab, rgb(${color.join(",")}), #000 ${20 - y * 3}%)`,
                  stroke: `#2B2821`,
                  strokeWidth: 0.3 
                };
              },
              top: (x, y) => {
                return { 
                  fill: `color-mix(in lab, rgb(${color.join(",")}), #fff ${10 + y * 4}%)`,
                  stroke: `#2B2821`,
                  strokeWidth: 0.4 
                };
              }
            }
          });
        }
      });
    });
    
    return hr.toSVG({ padding: 20 });
  }, [data, color]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = svgString;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "100%";
    }
  }, [svgString]);

  return (
    <figure className="figure-card" style={{ padding: 0 }}>
      <div style={{ width: "100%", aspectRatio: "5/4", position: "relative", cursor: "crosshair", padding: "1.15rem" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// 7. HeerichSurface3D
export function HeerichSurface3D({
  figure,
  data,
  color = [167, 56, 54], // Default to Iron Red
}: {
  figure: FigureRef;
  data: number[][];
  color?: [number, number, number];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const camera = { type: "oblique" as const, angle: 45, distance: 22 };
  const tile = 14;
  
  const svgString = useMemo(() => {
    const w = data[0]?.length || 1;
    const h = data.length || 1;
    const maxStack = 8;
    
    const hr = new Heerich({
      tile,
      camera,
    });
    
    hr.applyGeometry({
      type: "fill",
      bounds: [[0, 0, 0], [w - 1, 12, h - 1]],
      test: (x: number, y: number, z: number) => {
        if (x < 0 || x >= w || z < 0 || z >= h) return false;
        const val = data[z]?.[x] || 0;
        const stackH = Math.floor(val * maxStack);
        return y >= (12 - stackH);
      },
      style: {
        default: (x, y, z) => {
          const val = data[z]?.[x] || 0;
          const stackH = Math.floor(val * maxStack);
          const isTop = y === (12 - stackH);
          if (isTop) {
            return { fill: `rgb(${color.join(",")})`, stroke: '#2B2821', strokeWidth: 0.3 };
          }
          return { 
            fill: `color-mix(in lab, rgb(${color.join(",")}), #000 25%)`, 
            stroke: '#2B2821', 
            strokeWidth: 0.2,
            opacity: 0.8
          };
        },
        top: () => {
          return { 
            fill: `color-mix(in lab, rgb(${color.join(",")}), #fff 20%)`, 
            stroke: '#2B2821', 
            strokeWidth: 0.4 
          };
        }
      }
    });
    
    return hr.toSVG({ padding: 20 });
  }, [data, color]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = svgString;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "100%";
    }
  }, [svgString]);

  return (
    <figure className="figure-card" style={{ padding: 0 }}>
      <div style={{ width: "100%", aspectRatio: "5/4", position: "relative", cursor: "crosshair", padding: "1.15rem" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// 8. HeerichScatter3D
export function HeerichScatter3D({
  figure,
  points,
}: {
  figure: FigureRef;
  points: Array<{ x: number; y: number; z: number; color?: string; size?: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const camera = { type: "perspective" as const, angle: 30, distance: 40 };
  const tile = 20;
  
  const svgString = useMemo(() => {
    const hr = new Heerich({
      tile,
      camera,
    });
    
    // Axes sitting at visual ground (Y=12)
    hr.applyGeometry({ type: "line", from: [0,12,0], to: [10,12,0], style: { default: { stroke: '#2B2821', opacity: 0.4, strokeWidth: 1 } } });
    hr.applyGeometry({ type: "line", from: [0,12,0], to: [0,2,0], style: { default: { stroke: '#2B2821', opacity: 0.4, strokeWidth: 1 } } });
    hr.applyGeometry({ type: "line", from: [0,12,0], to: [0,12,10], style: { default: { stroke: '#2B2821', opacity: 0.4, strokeWidth: 1 } } });
    
    points.forEach(p => {
      hr.applyGeometry({
        type: "box",
        position: [p.x, 12 - p.y, p.z],
        size: p.size || 0.5,
        style: {
          default: { fill: p.color || '#2B2821', stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5 },
          top: { fill: p.color || '#2B2821' }
        }
      });
      hr.applyGeometry({
        type: "line",
        from: [p.x, 12, p.z],
        to: [p.x, 12 - p.y, p.z],
        style: { default: { stroke: '#2B2821', opacity: 0.1, strokeWidth: 0.5 } }
      });
    });
    
    return hr.toSVG({ padding: 30 });
  }, [points]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = svgString;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "100%";
    }
  }, [svgString]);

  return (
    <figure className="figure-card" style={{ padding: 0 }}>
      <div style={{ width: "100%", aspectRatio: "5/4", position: "relative", cursor: "crosshair", padding: "1.15rem" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// ------------------- NEW INTERACTIVE ASSETS -------------------

// 9. RadarChartFigure
export function RadarChartFigure({
  figure,
  items,
}: {
  figure: FigureRef;
  items: Array<{ label: string; stats: number[]; color: string }>;
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
    }, 40);
    return () => clearInterval(timer);
  }, [items]);

  const numStats = items[0]?.stats.length || 3;
  const maxStat = Math.max(...items.flatMap((i) => i.stats), 1);
  const cx = 210;
  const cy = 120;
  const maxR = 90;

  const angleStep = (Math.PI * 2) / numStats;

  function getPoint(val: number, statIndex: number) {
    const r = (val / maxStat) * maxR * progress;
    const angle = statIndex * angleStep - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  }

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        {/* Background Grid */}
        {[0.25, 0.5, 0.75, 1].map((scale) => {
          const pts = Array.from({ length: numStats }).map((_, i) => {
            const p = getPoint((maxStat * scale) / progress, i);
            return `${p.x},${p.y}`;
          }).join(" ");
          return <polygon key={scale} points={pts} fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray={scale === 1 ? "none" : "2 4"} />;
        })}
        
        {/* Spokes */}
        {Array.from({ length: numStats }).map((_, i) => {
          const p = getPoint(maxStat / progress, i);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--line)" strokeWidth="1" />;
        })}

        {/* Labels */}
        {Array.from({ length: numStats }).map((_, i) => {
          const p = getPoint((maxStat * 1.2) / progress, i);
          return (
            <text key={i} x={p.x} y={p.y} fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9" letterSpacing="0.05em" textAnchor="middle" alignmentBaseline="middle">
              {`AXIS ${i + 1}`}
            </text>
          );
        })}

        {/* Data Polygons */}
        {items.map((item, i) => {
          const pts = item.stats.map((val, statIndex) => {
            const p = getPoint(val, statIndex);
            return `${p.x},${p.y}`;
          }).join(" ");
          
          const isHovered = hoveredIndex === i;
          const isFaded = hoveredIndex !== null && !isHovered;

          return (
            <g 
              key={item.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={isFaded ? 0.2 : 1}
            >
              <polygon points={pts} fill={item.color} opacity={isHovered ? "0.3" : "0.15"} stroke={item.color} strokeWidth={isHovered ? "3" : "2"} />
              {item.stats.map((val, statIndex) => {
                const p = getPoint(val, statIndex);
                return (
                  <circle key={statIndex} cx={p.x} cy={p.y} r={isHovered ? "4" : "3"} fill="var(--paper)" stroke={item.color} strokeWidth="1.5" />
                );
              })}
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
        {items.map((item, i) => (
          <span 
            key={item.label} 
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4, cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: item.color, display: "inline-block" }} />
            {item.label.toUpperCase()}
          </span>
        ))}
      </div>
    </figure>
  );
}

// 10. HeatmapFigure
export function HeatmapFigure({
  figure,
  data,
  labelsX,
  labelsY,
  colorRamp = ["#fde2d5", "var(--accent)"],
}: {
  figure: FigureRef;
  data: number[][]; // 2D array [y][x]
  labelsX: string[];
  labelsY: string[];
  colorRamp?: [string, string];
}) {
  const [progress, setProgress] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(timer);
          return 1;
        }
        return p + 0.05;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [data]);

  const maxVal = Math.max(...data.flat(), 1);
  
  const startX = 60;
  const startY = 24;
  const areaW = 340;
  const areaH = 188;
  
  const cellW = areaW / labelsX.length;
  const cellH = areaH / labelsY.length;

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        
        {/* Y Axis Labels */}
        {labelsY.map((l, y) => (
          <text key={y} x={startX - 10} y={startY + y * cellH + cellH / 2 + 3} textAnchor="end" fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9" letterSpacing="0.05em">
            {l.toUpperCase()}
          </text>
        ))}

        {/* X Axis Labels */}
        {labelsX.map((l, x) => (
          <text key={x} x={startX + x * cellW + cellW / 2} y={startY + areaH + 16} textAnchor="middle" fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9" letterSpacing="0.05em">
            {l.toUpperCase()}
          </text>
        ))}

        {/* Top readout */}
        {hoveredCell !== null && progress > 0.9 && (
           <text x={startX + areaW} y={14} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
             {labelsX[hoveredCell.x]} × {labelsY[hoveredCell.y]}: {data[hoveredCell.y][hoveredCell.x].toFixed(1)}
           </text>
        )}

        {/* Grid Cells */}
        {data.map((row, y) => {
          return row.map((val, x) => {
            const intensity = (val / maxVal) * progress;
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
            const px = startX + x * cellW;
            const py = startY + y * cellH;
            
            return (
              <g 
                key={`${x}-${y}`}
                onMouseEnter={() => setHoveredCell({x, y})}
                onMouseLeave={() => setHoveredCell(null)}
                style={{ cursor: "crosshair" }}
              >
                <rect 
                  x={px + 1} 
                  y={py + 1} 
                  width={cellW - 2} 
                  height={cellH - 2} 
                  fill={colorRamp[1]} 
                  opacity={intensity * 0.8 + 0.1} 
                  stroke={isHovered ? "var(--ink)" : "none"} 
                  strokeWidth={isHovered ? "2" : "0"} 
                />
              </g>
            );
          });
        })}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// 11. TimelineGanttFigure
export function TimelineGanttFigure({
  figure,
  items,
}: {
  figure: FigureRef;
  items: Array<{ label: string; start: number; end: number; category: string; color?: string }>;
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
    }, 40);
    return () => clearInterval(timer);
  }, [items]);

  const allVals = items.flatMap((i) => [i.start, i.end]);
  const valExt = extent(allVals.length > 0 ? allVals : [0, 1]);
  
  const startX = 80;
  const startY = 30;
  const areaW = 320;
  const areaH = 180;
  
  const rowH = areaH / Math.max(items.length, 1);

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        {/* Background Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((scale) => {
          const x = startX + scale * areaW;
          const val = valExt.min + scale * (valExt.max - valExt.min);
          return (
            <g key={scale}>
              <line x1={x} y1={startY} x2={x} y2={startY + areaH} stroke="rgba(19,19,19,0.08)" strokeDasharray="4 4" />
              <text x={x} y={startY - 6} textAnchor="middle" fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9">
                {val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {hoveredIndex !== null && progress > 0.9 && (
           <text x={startX + areaW} y={startY + areaH + 16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
             {items[hoveredIndex].category.toUpperCase()} : {items[hoveredIndex].start} → {items[hoveredIndex].end}
           </text>
        )}

        {items.map((item, i) => {
          const y = startY + i * rowH + rowH * 0.2;
          const blockH = rowH * 0.6;
          
          const pxStart = startX + ((item.start - valExt.min) / (valExt.max - valExt.min)) * areaW;
          const pxEndTarget = startX + ((item.end - valExt.min) / (valExt.max - valExt.min)) * areaW;
          const pxEnd = pxStart + (pxEndTarget - pxStart) * progress;
          
          const isHovered = hoveredIndex === i;

          return (
            <g 
              key={item.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "crosshair", transition: "opacity 0.2s" }}
              opacity={hoveredIndex === null || isHovered ? 1 : 0.4}
            >
              <text x={startX - 10} y={y + blockH / 2 + 3} textAnchor="end" fill={isHovered ? "var(--ink)" : "var(--ink-soft)"} fontFamily="var(--font-ui)" fontSize="10" fontWeight={isHovered ? "bold" : "normal"}>
                {item.label}
              </text>
              <rect 
                x={pxStart} 
                y={y} 
                width={Math.max(pxEnd - pxStart, 2)} 
                height={blockH} 
                fill={item.color || "var(--ink)"} 
                opacity={isHovered ? 1 : 0.8}
                rx="2"
                stroke={isHovered ? "var(--ink)" : "none"}
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// 12. FlowDiagramFigure (Simplified Sankey)
export function FlowDiagramFigure({
  figure,
  nodes,
  edges,
}: {
  figure: FigureRef;
  nodes: Array<{ id: string; label: string; x: number; y: number; color?: string }>;
  edges: Array<{ source: string; target: string; weight: number }>;
}) {
  const [progress, setProgress] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(timer);
          return 1;
        }
        return p + 0.05;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [nodes, edges]);

  const maxWeight = Math.max(...edges.map(e => e.weight), 1);

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        
        {/* Edges */}
        {edges.map((edge, i) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;

          const activeEdge = hoveredNode === edge.source || hoveredNode === edge.target;
          const fadeEdge = hoveredNode !== null && !activeEdge;

          const dx = target.x - source.x;
          // Simple curved bezier
          const path = `M ${source.x} ${source.y} C ${source.x + dx * 0.5 * progress} ${source.y}, ${target.x - dx * 0.5 * progress} ${target.y}, ${source.x + dx * progress} ${source.y + (target.y - source.y) * progress}`;

          return (
            <path 
              key={i} 
              d={path} 
              fill="none" 
              stroke="var(--line-strong)" 
              strokeWidth={(edge.weight / maxWeight) * 12} 
              opacity={fadeEdge ? 0.05 : activeEdge ? 0.3 : 0.15}
              style={{ transition: "opacity 0.2s" }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isHovered = hoveredNode === node.id;
          const isFaded = hoveredNode !== null && !isHovered;

          return (
            <g 
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: "crosshair", transition: "opacity 0.2s, transform 0.2s", transformOrigin: `${node.x}px ${node.y}px` }}
              opacity={isFaded ? 0.4 : 1}
              transform={isHovered && progress > 0.9 ? "scale(1.1)" : "scale(1)"}
            >
              <circle cx={node.x} cy={node.y} r="8" fill={node.color || "var(--paper)"} stroke="var(--ink)" strokeWidth="2" />
              <text 
                x={node.x} 
                y={node.y + 18} 
                textAnchor="middle" 
                fill={isHovered ? "var(--ink)" : "var(--ink-soft)"} 
                fontFamily="var(--font-ui)" 
                fontSize="10" 
                fontWeight={isHovered ? "bold" : "normal"}
              >
                {node.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// ------------------- MAB SPECIFIC ASSETS -------------------

// 13. BeliefEvolutionFigure
export function BeliefEvolutionFigure({
  figure,
  beliefs,
}: {
  figure: FigureRef;
  beliefs: Array<{ label: string; mean: number; variance: number; color: string }>;
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
    }, 40);
    return () => clearInterval(timer);
  }, [beliefs]);

  // Generate PDF points
  const pointsCount = 100;
  const extentMin = 0;
  const extentMax = 1;
  const xValues = Array.from({ length: pointsCount }, (_, i) => extentMin + (i / (pointsCount - 1)) * (extentMax - extentMin));
  
  const distributions = beliefs.map(b => {
    const stdDev = Math.sqrt(b.variance);
    const pdf = xValues.map(x => {
      // Gaussian PDF
      return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - b.mean) / stdDev, 2));
    });
    return pdf;
  });

  const maxPdf = Math.max(...distributions.flat(), 1);

  const toX = (val: number) => 42 + ((val - extentMin) / (extentMax - extentMin)) * 340;
  const toY = (val: number) => 210 - (val / maxPdf) * 160 * progress;

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

        {/* X Axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text key={v} x={toX(v)} y={224} textAnchor="middle" fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9">
            {v.toFixed(2)}
          </text>
        ))}

        {hoveredIndex !== null && progress > 0.9 && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {beliefs[hoveredIndex].label.toUpperCase()} : μ={beliefs[hoveredIndex].mean.toFixed(2)} σ²={beliefs[hoveredIndex].variance.toFixed(4)}
          </text>
        )}

        {beliefs.map((b, i) => {
          const isHovered = hoveredIndex === i;
          const isFaded = hoveredIndex !== null && !isHovered;
          
          const pathPoints = xValues.map((x, j) => `${toX(x)},${toY(distributions[i][j])}`).join(" ");
          const area = `M${toX(extentMin)},210 L${pathPoints} L${toX(extentMax)},210 Z`;
          const line = `M${pathPoints.replace(/ /g, ' L')}`;

          return (
            <g 
              key={b.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={isFaded ? 0.2 : 1}
            >
              <path d={area} fill={b.color} opacity={isHovered ? "0.3" : "0.15"} />
              <path d={line} fill="none" stroke={b.color} strokeWidth={isHovered ? "3" : "2"} vectorEffect="non-scaling-stroke" />
              
              {/* Mean marker */}
              {isHovered && progress > 0.9 && (
                <>
                  <line x1={toX(b.mean)} y1={toY(distributions[i][xValues.findIndex(x => x >= b.mean)] || maxPdf)} x2={toX(b.mean)} y2={210} stroke={b.color} strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx={toX(b.mean)} cy={210} r="3" fill={b.color} />
                </>
              )}
            </g>
          );
        })}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// 14. ArmSelectionRibbon (100% Stacked Area)
export function ArmSelectionRibbon({
  figure,
  series,
}: {
  figure: FigureRef;
  series: Array<{ label: string; values: number[]; color: string }>; // values must sum to 1.0 (or 100) across series at each index
}) {
  const [step, setStep] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxLen = Math.max(...series.map((s) => s.values.length), 1);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxLen) {
          clearInterval(timer);
          return maxLen;
        }
        return s + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [maxLen]);

  const toX = (i: number) => 42 + (i / Math.max(maxLen - 1, 1)) * 340;
  const toY = (val: number) => 210 - (val / 100) * 186; // assuming sum is 100

  // Calculate cumulative stacks
  const stackedData: Array<Array<{start: number, end: number}>> = [];
  for (let i = 0; i < maxLen; i++) {
    let currentSum = 0;
    const col = series.map(s => {
      const val = s.values[i] || 0;
      const start = currentSum;
      currentSum += val;
      return { start, end: currentSum };
    });
    stackedData.push(col);
  }

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V210H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        
        {[0, 0.25, 0.5, 0.75, 1].map((scale) => {
          const y = 210 - scale * 186;
          return (
             <path key={scale} d={`M42 ${y}H388`} stroke="rgba(19,19,19,0.08)" strokeDasharray="6 8" strokeWidth="1" />
          );
        })}

        {hoveredIndex !== null && step > 0 && hoveredIndex < step && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            T={hoveredIndex}
          </text>
        )}

        {series.map((s, seriesIdx) => {
          const isHovered = hoveredIndex !== null;
          // We don't dim others as aggressively here because it's a stacked area and it breaks the visual continuity, just emphasize the borders
          
          if (step === 0) return null;

          const topPoints = [];
          const bottomPoints = [];
          
          for (let i = 0; i < step; i++) {
             const points = stackedData[i];
             if (points) {
               const data = points[seriesIdx];
               topPoints.push(`${toX(i)},${toY(data.end)}`);
               bottomPoints.push(`${toX(i)},${toY(data.start)}`);
             }
          }
          
          const area = `M${bottomPoints[0]} L${topPoints.join(" L")} L${bottomPoints.reverse().join(" L")} Z`;

          return (
             <g key={s.label}>
               <path d={area} fill={s.color} opacity={isHovered ? 0.6 : 0.8} />
             </g>
          );
        })}

        {/* Hover overlay targets for specific columns */}
        {Array.from({ length: step }).map((_, i) => (
          <g 
            key={i} 
            onMouseEnter={() => setHoveredIndex(i)} 
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "crosshair" }}
          >
            <rect x={toX(i) - 340/(maxLen*2)} y={24} width={340/maxLen} height={186} fill="none" pointerEvents="all" />
            {hoveredIndex === i && (
              <>
                <line x1={toX(i)} y1={24} x2={toX(i)} y2={210} stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 2" pointerEvents="none" />
                {series.map((s, seriesIdx) => {
                   const val = s.values[i];
                   const midY = toY(stackedData[i][seriesIdx].start + val/2);
                   if (val > 5) { // Only show label if there's enough space
                     return (
                       <text key={seriesIdx} x={toX(i) + 4} y={midY} fill="var(--paper)" fontFamily="var(--font-ui)" fontSize="9" fontWeight="bold" alignmentBaseline="middle" pointerEvents="none">
                         {val.toFixed(1)}%
                       </text>
                     );
                   }
                   return null;
                })}
              </>
            )}
          </g>
        ))}
      </svg>
      <FigureMeta figure={figure} iteration={step} />
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
        {series.map((s) => (
          <span key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            {s.label.toUpperCase()}
          </span>
        ))}
      </div>
    </figure>
  );
}

// 15. UCBBoundsFigure
export function UCBBoundsFigure({
  figure,
  arms,
}: {
  figure: FigureRef;
  arms: Array<{ label: string; mean: number; ucb: number; color?: string }>;
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
    }, 40);
    return () => clearInterval(timer);
  }, [arms]);

  const maxVal = Math.max(...arms.map((a) => a.mean + a.ucb), 1);
  const totalWidth = 340;
  const gap = 16;
  const barTotalWidth = totalWidth / Math.max(arms.length, 1);
  const barWidth = Math.max(barTotalWidth - gap, 4);

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V212H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        {[0, 1, 2, 3].map((s) => {
          const y = 24 + s * 47;
          return (
            <path key={s} d={`M42 ${y}H388`} stroke="rgba(19,19,19,0.08)" strokeDasharray="6 8" strokeWidth="1" />
          );
        })}
        
        {hoveredIndex !== null && progress > 0.9 && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            {arms[hoveredIndex].label.toUpperCase()} : μ={arms[hoveredIndex].mean.toFixed(2)} + UCB={arms[hoveredIndex].ucb.toFixed(2)}
          </text>
        )}

        {arms.map((arm, i) => {
          const meanH = (arm.mean / maxVal) * 188 * progress;
          const ucbH = (arm.ucb / maxVal) * 188 * progress;
          
          const x = 42 + gap / 2 + i * barTotalWidth;
          const yMean = 212 - meanH;
          const yUcb = yMean - ucbH;
          
          const isHovered = hoveredIndex === i;
          const opacity = hoveredIndex === null ? 0.9 : isHovered ? 1 : 0.3;
          const color = arm.color || "var(--ink)";

          return (
            <g 
              key={arm.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "opacity 0.2s ease-out", cursor: "crosshair" }}
              opacity={opacity}
            >
              {/* Mean Bar */}
              <rect x={x} y={yMean} width={barWidth} height={Math.max(meanH, 0)} fill={isHovered ? color : "var(--paper)"} stroke={color} strokeWidth="1.5" />
              
              {/* UCB Whisker */}
              <line x1={x + barWidth / 2} y1={yMean} x2={x + barWidth / 2} y2={yUcb} stroke={color} strokeWidth={isHovered ? "2" : "1.5"} strokeDasharray={isHovered ? "none" : "2 2"} />
              <line x1={x + barWidth / 4} y1={yUcb} x2={x + (barWidth * 3) / 4} y2={yUcb} stroke={color} strokeWidth={isHovered ? "2" : "1.5"} />

              {progress > 0.9 && (
                <text x={x + barWidth / 2} y={226} fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9" letterSpacing="0.05em" textAnchor="middle">
                  {arm.label.toUpperCase()}
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

// 16. RegretBoundsFigure
export function RegretBoundsFigure({
  figure,
  actual,
  bound,
}: {
  figure: FigureRef;
  actual: { values: number[]; color: string; label: string };
  bound: { values: number[]; color: string; label: string; kind: "log" | "sqrt" };
}) {
  const [step, setStep] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxLen = Math.max(actual.values.length, bound.values.length, 1);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxLen) {
          clearInterval(timer);
          return maxLen;
        }
        return s + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [maxLen]);

  const allVals = [...actual.values, ...bound.values];
  const { min, max } = extent(allVals.length > 0 ? allVals : [0, 1]);
  
  function toX(i: number) {
    return 42 + (i / Math.max(maxLen - 1, 1)) * 340;
  }
  function toY(v: number) {
    return 210 - ((v - min) / Math.max(max - min, 0.0001)) * 186;
  }

  const renderLine = (values: number[], stepCount: number, color: string, isDashed: boolean, isHoveredTarget: boolean) => {
    const currentValues = values.slice(0, stepCount);
    if (currentValues.length === 0) return null;
    
    const points = currentValues.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
    const line = `M${points.replace(/ /g, ' L')}`;

    return (
      <g style={{ transition: "opacity 0.2s ease-out" }} opacity={isHoveredTarget ? 1 : 0.4}>
        <path 
          d={line} 
          fill="none" 
          stroke={color} 
          strokeWidth={isHoveredTarget ? "3" : "2"} 
          strokeDasharray={isDashed ? "6 6" : "none"} 
          vectorEffect="non-scaling-stroke" 
        />
      </g>
    );
  };

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
        
        {hoveredIndex !== null && step > 0 && hoveredIndex < step && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            T={hoveredIndex} | Actual: {actual.values[hoveredIndex]?.toFixed(1)} | Bound: {bound.values[hoveredIndex]?.toFixed(1)}
          </text>
        )}

        {renderLine(bound.values, step, bound.color, true, hoveredIndex !== null)}
        {renderLine(actual.values, step, actual.color, false, hoveredIndex !== null)}

        {/* Hover targets */}
        {Array.from({ length: step }).map((_, i) => (
          <g 
            key={i} 
            onMouseEnter={() => setHoveredIndex(i)} 
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "crosshair" }}
          >
            <rect x={toX(i) - 340/(maxLen*2)} y={24} width={340/maxLen} height={186} fill="none" pointerEvents="all" />
            {hoveredIndex === i && (
              <>
                <line x1={toX(i)} y1={24} x2={toX(i)} y2={210} stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 2" pointerEvents="none" />
                <circle cx={toX(i)} cy={toY(actual.values[i])} r="4" fill="var(--paper)" stroke={actual.color} strokeWidth="2" pointerEvents="none" />
                <circle cx={toX(i)} cy={toY(bound.values[i])} r="4" fill="var(--paper)" stroke={bound.color} strokeWidth="2" pointerEvents="none" />
              </>
            )}
          </g>
        ))}

      </svg>
      <FigureMeta figure={figure} iteration={step} />
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ width: 16, height: 3, background: bound.color, display: "inline-block" }} />
          {bound.label.toUpperCase()}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ width: 16, height: 3, background: actual.color, display: "inline-block" }} />
          {actual.label.toUpperCase()}
        </span>
      </div>
    </figure>
  );
}

// ------------------- ADVANCED THEORY ASSETS -------------------

// 17. WhittleIndexRanking
export function WhittleIndexRanking({
  figure,
  arms,
  k = 2,
}: {
  figure: FigureRef;
  arms: Array<{ label: string; index: number; state: string; color: string }>;
  k?: number; // budget
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
    }, 40);
    return () => clearInterval(timer);
  }, [arms]);

  const sortedArms = [...arms].sort((a, b) => b.index - a.index);
  const maxIdx = Math.max(...arms.map(a => a.index), 1);
  const minIdx = Math.min(...arms.map(a => a.index), 0);
  
  const toY = (val: number) => 210 - ((val - minIdx) / (maxIdx - minIdx)) * 180 * progress;
  const thresholdY = toY(sortedArms[k-1]?.index || 0);

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V210H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        
        {/* Active/Passive Threshold */}
        <line x1={42} y1={thresholdY} x2={388} y2={thresholdY} stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x={392} y={thresholdY + 4} fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9" fontWeight="bold">
          THRESHOLD (K={k})
        </text>

        {sortedArms.map((arm, i) => {
          const x = 60 + i * (320 / sortedArms.length);
          const y = toY(arm.index);
          const isHovered = hoveredIndex === i;
          const isActive = i < k;

          return (
            <g 
              key={arm.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "crosshair", transition: "opacity 0.2s" }}
              opacity={hoveredIndex === null || isHovered ? 1 : 0.3}
            >
              <line x1={x} y1={210} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={x} cy={y} r={isHovered ? 6 : 4} fill={isActive ? arm.color : "var(--paper)"} stroke={arm.color} strokeWidth="2" />
              <text x={x} y={224} textAnchor="middle" fill="var(--ink-soft)" fontFamily="var(--font-ui)" fontSize="9" letterSpacing="0.05em">
                {arm.label.toUpperCase()}
              </text>
              {isHovered && (
                <text x={x} y={y - 10} textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" fontWeight="bold">
                  {arm.index.toFixed(2)}
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

// 18. DriftingMeanPlot
export function DriftingMeanPlot({
  figure,
  armLabel,
  truth,
  estimate,
  color = "var(--danger)",
}: {
  figure: FigureRef;
  armLabel: string;
  truth: number[];
  estimate: number[];
  color?: string;
}) {
  const [step, setStep] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxLen = Math.max(truth.length, estimate.length, 1);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxLen) {
          clearInterval(timer);
          return maxLen;
        }
        return s + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [maxLen]);

  const allVals = [...truth, ...estimate];
  const { min, max } = extent(allVals.length > 0 ? allVals : [0, 1]);
  
  const toX = (i: number) => 42 + (i / Math.max(maxLen - 1, 1)) * 340;
  const toY = (v: number) => 210 - ((v - min) / Math.max(max - min, 0.0001)) * 186;

  const getPath = (vals: number[]) => {
    const points = vals.slice(0, step).map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
    return `M${points.replace(/ /g, ' L')}`;
  };

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V210H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        
        {/* True Mean (Dashed) */}
        <path d={getPath(truth)} fill="none" stroke="var(--ink-faint)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        {/* Estimate (Solid) */}
        <path d={getPath(estimate)} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" />

        {hoveredIndex !== null && step > 0 && hoveredIndex < step && (
          <g>
            <line x1={toX(hoveredIndex)} y1={24} x2={toX(hoveredIndex)} y2={210} stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={toX(hoveredIndex)} cy={toY(truth[hoveredIndex])} r="3" fill="var(--ink-faint)" />
            <circle cx={toX(hoveredIndex)} cy={toY(estimate[hoveredIndex])} r="4" fill="var(--paper)" stroke={color} strokeWidth="2" />
            <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
              T={hoveredIndex} | ERR: {Math.abs(truth[hoveredIndex] - estimate[hoveredIndex]).toFixed(3)}
            </text>
          </g>
        )}

        {/* Invisible hit targets */}
        {Array.from({ length: step }).map((_, i) => (
          <rect 
            key={i} 
            x={toX(i) - 5} y={24} width={10} height={186} 
            fill="none" pointerEvents="all"
            onMouseEnter={() => setHoveredIndex(i)} 
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "crosshair" }}
          />
        ))}
      </svg>
      <FigureMeta figure={figure} iteration={step} />
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 12, height: 2, border: "1px dashed var(--ink-faint)" }} /> TRUE MEAN</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 12, height: 3, background: color }} /> AGENT ESTIMATE ({armLabel})</span>
      </div>
    </figure>
  );
}

// 19. ContextualVoronoiMap
export function ContextualVoronoiMap({
  figure,
  colors = ["var(--ink)", "var(--danger)", "#4a6a7a"],
}: {
  figure: FigureRef;
  colors?: string[];
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number} | null>(null);
  
  // Deterministic seed points for arms
  const armCentroids = useMemo(() => [
    { x: 0.2, y: 0.3 },
    { x: 0.7, y: 0.2 },
    { x: 0.5, y: 0.8 },
  ], []);

  const gridRes = 15;
  const grid = useMemo(() => {
    const points = [];
    for (let i = 0; i <= gridRes; i++) {
      for (let j = 0; j <= gridRes; j++) {
        const x = i / gridRes;
        const y = j / gridRes;
        // Find nearest centroid
        let bestDist = Infinity;
        let armIdx = 0;
        armCentroids.forEach((c, idx) => {
          const d = Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2);
          if (d < bestDist) {
            bestDist = d;
            armIdx = idx;
          }
        });
        points.push({ x, y, armIdx });
      }
    }
    return points;
  }, [armCentroids]);

  const toX = (val: number) => 42 + val * 340;
  const toY = (val: number) => 210 - val * 186;

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        <path d="M42 24V210H388" stroke="rgba(19,19,19,0.18)" strokeWidth="1.4" />
        
        {grid.map((p, i) => {
          const isHovered = hoveredPoint && Math.abs(p.x - hoveredPoint.x) < 0.05 && Math.abs(p.y - hoveredPoint.y) < 0.05;
          return (
            <circle 
              key={i} 
              cx={toX(p.x)} cy={toY(p.y)} 
              r={isHovered ? 3 : 1.5} 
              fill={colors[p.armIdx]} 
              opacity={isHovered ? 1 : 0.4} 
            />
          );
        })}

        {armCentroids.map((c, i) => (
          <g key={i}>
            <circle cx={toX(c.x)} cy={toY(c.y)} r="6" fill="var(--paper)" stroke={colors[i]} strokeWidth="2" />
            <text x={toX(c.x)} y={toY(c.y) + 16} textAnchor="middle" fill={colors[i]} fontFamily="var(--font-ui)" fontSize="10" fontWeight="bold">ARM {i+1}</text>
          </g>
        ))}

        <rect 
          x={42} y={24} width={340} height={186} 
          fill="none" pointerEvents="all"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1 - (e.clientY - rect.top) / rect.height;
            setHoveredPoint({ x, y });
          }}
          onMouseLeave={() => setHoveredPoint(null)}
          style={{ cursor: "crosshair" }}
        />

        {hoveredPoint && (
          <text x={388} y={16} textAnchor="end" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="10" letterSpacing="0.05em" fontWeight="bold">
            CONTEXT X:{hoveredPoint.x.toFixed(2)} Y:{hoveredPoint.y.toFixed(2)}
          </text>
        )}
      </svg>
      <FigureMeta figure={figure} />
    </figure>
  );
}

// 20. MarkovArmDiagram
export function MarkovArmDiagram({
  figure,
  states = ["S0", "S1", "S2"],
  transitions,
}: {
  figure: FigureRef;
  states?: string[];
  transitions: Array<{ from: number; to: number; prob: number; action: "active" | "passive" }>;
}) {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const stateCoords = states.map((_, i) => ({
    x: 80 + i * 130,
    y: 120,
  }));

  return (
    <figure className="figure-card">
      <svg viewBox="0 0 420 240" role="img" aria-label={figure.title}>
        {transitions.map((t, i) => {
          const s = stateCoords[t.from];
          const e = stateCoords[t.to];
          const isHovered = hoveredLink === i;
          const isActive = t.action === "active";
          
          let d = "";
          if (t.from === t.to) {
            // Self loop
            d = `M ${s.x - 10} ${s.y - 20} A 20 20 0 1 1 ${s.x + 10} ${s.y - 20}`;
          } else {
            const curve = isActive ? 30 : -30;
            const midX = (s.x + e.x) / 2;
            const midY = (s.y + e.y) / 2 + curve;
            d = `M ${s.x} ${s.y} Q ${midX} ${midY} ${e.x} ${e.y}`;
          }

          return (
            <g 
              key={i}
              onMouseEnter={() => setHoveredLink(i)}
              onMouseLeave={() => setHoveredLink(null)}
              style={{ cursor: "pointer" }}
            >
              <path 
                d={d} fill="none" 
                stroke={isActive ? "var(--danger)" : "var(--ink-soft)"} 
                strokeWidth={isHovered ? 3 : 1.5} 
                markerEnd="url(#arrowhead)" 
                opacity={hoveredLink === null || isHovered ? 0.8 : 0.15}
              />
              {isHovered && (
                <text x={210} y={40} textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="12" fontWeight="bold">
                  P({states[t.to]}|{states[t.from]}, {t.action.toUpperCase()}) = {t.prob.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

        {stateCoords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="24" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
            <text x={c.x} y={c.y + 4} textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-ui)" fontSize="12" fontWeight="bold">{states[i]}</text>
          </g>
        ))}

        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="24" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--ink)" />
          </marker>
        </defs>
      </svg>
      <FigureMeta figure={figure} />
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 12, height: 3, background: "var(--danger)" }} /> ACTIVE ACTION</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 12, height: 3, background: "var(--ink-soft)" }} /> PASSIVE ACTION</span>
      </div>
    </figure>
  );
}
