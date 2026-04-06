"use client";

import {
  HistogramFigure,
  BubbleChartFigure,
  DumbbellChartFigure,
  HeerichBarChart3D,
  HeerichSurface3D,
  HeerichScatter3D,
  AreaChartFigure,
  RadialBarChartFigure,
  RadarChartFigure,
  HeatmapFigure,
  TimelineGanttFigure,
  FlowDiagramFigure,
  BeliefEvolutionFigure,
  ArmSelectionRibbon,
  UCBBoundsFigure,
  RegretBoundsFigure,
  WhittleIndexRanking,
  DriftingMeanPlot,
  ContextualVoronoiMap,
  MarkovArmDiagram
} from "@/components/interactive-assets";

import * as Icons from "@/components/thematic-icons";
import type { FigureRef } from "@/lib/content/types";

export default function ChartsDemoPage() {
  const dummyFigure = (title: string, kind: string): FigureRef => ({
    id: title.toLowerCase().replace(/ /g, "-"),
    title,
    caption: "A demonstration of the interactive asset component.",
    kind: kind as FigureRef["kind"],
  });

  const iconNames = [
    "Cube", "Circle", "Triangle", "Grid", "Plus", "Minus", 
    "Lever", "Dice", "Crosshair", "Scale", "Wave", "Peak", "Arrow", "Info"
  ];

  const styles = [
    { id: "Soviet", prefix: "Soviet" },
    { id: "Bauhaus", prefix: "Bauhaus" },
    { id: "Aboreto", prefix: "Aboreto" },
    { id: "Kilim", prefix: "Kilim" }
  ];

  return (
    <main className="site-shell" style={{ paddingBottom: "4rem" }}>
      <header style={{ marginBottom: "3rem" }}>
        <h1 className="headline">Interactive Assets Demo</h1>
        <p className="lede">A collection of custom 2D SVG and 3D Isometric components. Hover over elements to explore data.</p>
      </header>

      <div className="figure-grid">
        <HistogramFigure
          figure={dummyFigure("Distribution of Rents", "Histogram")}
          bins={[
            { label: "A", count: 12 },
            { label: "B", count: 34 },
            { label: "C", count: 56 },
            { label: "D", count: 28 },
            { label: "E", count: 14 },
            { label: "F", count: 5 },
          ]}
          accent="var(--danger)"
        />

        <BubbleChartFigure
          figure={dummyFigure("Market Clusters", "Bubble Chart")}
          points={[
            { x: 10, y: 20, r: 15, label: "M1", color: "var(--danger)" },
            { x: 25, y: 50, r: 30, label: "M2", color: "#4a6a7a" },
            { x: 60, y: 15, r: 20, label: "M3" },
            { x: 80, y: 70, r: 10, label: "M4" },
            { x: 45, y: 85, r: 25, label: "M5", color: "#3f5c52" },
          ]}
        />

        <DumbbellChartFigure
          figure={dummyFigure("Policy Impact", "Dumbbell Chart")}
          items={[
            { label: "Alpha", start: 20, end: 45 },
            { label: "Beta", start: 60, end: 30 },
            { label: "Gamma", start: 10, end: 85 },
            { label: "Delta", start: 50, end: 55 },
          ]}
        />

        <RadialBarChartFigure
          figure={dummyFigure("Resource Allocation", "Radial Bar Chart")}
          items={[
            { label: "Timber", value: 80, color: "var(--danger)" },
            { label: "Gold", value: 45, color: "#4a6a7a" },
            { label: "Grain", value: 60, color: "#3f5c52" },
            { label: "Spice", value: 90, color: "var(--ink)" },
          ]}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <AreaChartFigure
          figure={dummyFigure("Trajectory Analysis", "Area Chart")}
          series={[
            { label: "Baseline", values: [10, 15, 25, 20, 35, 40, 50, 45, 60, 75], color: "var(--ink)" },
            { label: "Reform", values: [10, 12, 14, 18, 28, 45, 65, 80, 95, 110], color: "var(--danger)" },
            { label: "Decay", values: [10, 9, 8, 12, 15, 10, 8, 5, 2, 0], color: "#3f5c52" },
          ]}
        />
      </div>

      <div className="figure-grid" style={{ marginTop: "2rem" }}>
        <RadarChartFigure
          figure={dummyFigure("Capability Matrix", "Radar Chart")}
          items={[
            { label: "System A", stats: [80, 50, 60, 90, 40], color: "#4a6a7a" },
            { label: "System B", stats: [40, 80, 90, 30, 70], color: "var(--danger)" },
          ]}
        />

        <HeatmapFigure
          figure={dummyFigure("Density Heatmap", "Heatmap")}
          labelsX={["Jan", "Feb", "Mar", "Apr", "May"]}
          labelsY={["Reg 1", "Reg 2", "Reg 3", "Reg 4"]}
          data={[
            [12, 45, 60, 20, 5],
            [30, 80, 95, 40, 15],
            [10, 25, 45, 60, 90],
            [50, 60, 40, 20, 10],
          ]}
          colorRamp={["#fde2d5", "var(--ink)"]}
        />

        <TimelineGanttFigure
          figure={dummyFigure("Project Phases", "Gantt Chart")}
          items={[
            { label: "Research", start: 0, end: 30, category: "Phase 1", color: "#4a6a7a" },
            { label: "Design", start: 20, end: 50, category: "Phase 1", color: "#4a6a7a" },
            { label: "Execution", start: 50, end: 90, category: "Phase 2", color: "var(--danger)" },
            { label: "Review", start: 80, end: 100, category: "Phase 3", color: "#3f5c52" },
          ]}
        />

        <FlowDiagramFigure
          figure={dummyFigure("Resource Flow", "Sankey Flow")}
          nodes={[
            { id: "raw", label: "Raw", x: 40, y: 120, color: "#4a6a7a" },
            { id: "proc1", label: "Proc 1", x: 180, y: 80, color: "#3f5c52" },
            { id: "proc2", label: "Proc 2", x: 180, y: 160, color: "#3f5c52" },
            { id: "final", label: "Final", x: 380, y: 120, color: "var(--danger)" },
          ]}
          edges={[
            { source: "raw", target: "proc1", weight: 60 },
            { source: "raw", target: "proc2", weight: 40 },
            { source: "proc1", target: "final", weight: 50 },
            { source: "proc2", target: "final", weight: 40 },
          ]}
        />
      </div>

      <header style={{ marginTop: "4rem", marginBottom: "2rem" }}>
        <h2 className="headline" style={{ fontSize: "2rem" }}>MAB Specific Assets</h2>
        <p className="lede">Visualizations specifically designed for multi-armed bandit theory and analysis.</p>
      </header>

      <div className="figure-grid">
        <BeliefEvolutionFigure
          figure={dummyFigure("Reward Belief Distributions", "Ridge Plot")}
          beliefs={[
            { label: "Arm 1", mean: 0.3, variance: 0.05, color: "var(--ink)" },
            { label: "Arm 2", mean: 0.6, variance: 0.02, color: "var(--danger)" },
            { label: "Arm 3", mean: 0.45, variance: 0.01, color: "#3f5c52" },
            { label: "Arm 4", mean: 0.5, variance: 0.08, color: "#4a6a7a" },
          ]}
        />

        <UCBBoundsFigure
          figure={dummyFigure("Upper Confidence Bounds", "UCB Error Bars")}
          arms={[
            { label: "A", mean: 0.35, ucb: 0.20, color: "var(--ink)" },
            { label: "B", mean: 0.65, ucb: 0.05, color: "var(--danger)" },
            { label: "C", mean: 0.40, ucb: 0.45, color: "#4a6a7a" },
            { label: "D", mean: 0.55, ucb: 0.15, color: "#3f5c52" },
          ]}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <ArmSelectionRibbon
          figure={dummyFigure("Explore-Exploit Phase Transition", "100% Stacked Area")}
          series={[
            { label: "Arm 1", color: "var(--ink)", values: [25, 20, 15, 10, 5, 2, 1, 0, 0, 0] },
            { label: "Arm 2 (Optimal)", color: "var(--danger)", values: [25, 30, 45, 60, 75, 88, 94, 98, 100, 100] },
            { label: "Arm 3", color: "#3f5c52", values: [25, 25, 20, 15, 10, 5, 3, 1, 0, 0] },
            { label: "Arm 4", color: "#4a6a7a", values: [25, 25, 20, 15, 10, 5, 2, 1, 0, 0] },
          ]}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <RegretBoundsFigure
          figure={dummyFigure("Cumulative Regret vs Theoretical Bound", "Trajectory Bounds")}
          actual={{ label: "Empirical Regret", color: "var(--danger)", values: [0, 5, 12, 18, 23, 26, 28, 29, 29.5, 30] }}
          bound={{ label: "O(log T) Bound", color: "var(--ink)", kind: "log", values: [0, 10, 16, 21, 24.5, 27, 29, 30.5, 32, 33] }}
        />
      </div>

      <header style={{ marginTop: "4rem", marginBottom: "2rem" }}>
        <h2 className="headline" style={{ fontSize: "2rem" }}>Advanced Theory Assets</h2>
        <p className="lede">Visualizations for Restless, Contextual, and Non-Stationary Bandit scenarios.</p>
      </header>

      <div className="figure-grid">
        <WhittleIndexRanking
          figure={dummyFigure("Whittle Index Priority", "Index Ranking")}
          arms={[
            { label: "Timber", index: 0.85, state: "Active", color: "var(--danger)" },
            { label: "Gold", index: 0.62, state: "Active", color: "var(--ink)" },
            { label: "Grain", index: 0.45, state: "Passive", color: "#3f5c52" },
            { label: "Spice", index: 0.12, state: "Passive", color: "#4a6a7a" },
          ]}
          k={2}
        />

        <MarkovArmDiagram
          figure={dummyFigure("Restless Arm Dynamics", "State Transition")}
          states={["Low", "Med", "High"]}
          transitions={[
            { from: 0, to: 1, prob: 0.7, action: "active" },
            { from: 1, to: 2, prob: 0.4, action: "active" },
            { from: 2, to: 0, prob: 0.1, action: "active" },
            { from: 1, to: 0, prob: 0.6, action: "passive" },
            { from: 2, to: 1, prob: 0.8, action: "passive" },
          ]}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <DriftingMeanPlot
          figure={dummyFigure("Non-Stationary Tracking", "Drifting Mean")}
          armLabel="Boomtown Alpha"
          truth={[0.2, 0.25, 0.35, 0.6, 0.8, 0.75, 0.65, 0.4, 0.3, 0.25]}
          estimate={[0.2, 0.22, 0.28, 0.45, 0.65, 0.78, 0.72, 0.55, 0.4, 0.3]}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <ContextualVoronoiMap
          figure={dummyFigure("Contextual Decision Map", "Voronoi Boundaries")}
        />
      </div>

      <header style={{ marginTop: "4rem", marginBottom: "2rem" }}>
        <h2 className="headline" style={{ fontSize: "2rem" }}>3D Assets</h2>
      </header>

      <div className="figure-grid" style={{ marginTop: "2rem" }}>
        <HeerichBarChart3D
          figure={dummyFigure("Regional Yields", "3D Bar Chart")}
          data={[
            [0, 2, 0, 4],
            [1, 5, 2, 0],
            [0, 3, 6, 1],
            [2, 0, 1, 3],
          ]}
          color={[138, 56, 36]}
        />

        <HeerichSurface3D
          figure={dummyFigure("Terrain Suitability", "3D Surface")}
          data={[
            [0.1, 0.2, 0.3, 0.4, 0.2],
            [0.2, 0.4, 0.6, 0.5, 0.3],
            [0.3, 0.6, 0.9, 0.7, 0.4],
            [0.2, 0.5, 0.8, 0.6, 0.3],
            [0.1, 0.3, 0.4, 0.3, 0.1],
          ]}
          color={[63, 92, 82]}
        />

        <HeerichScatter3D
          figure={dummyFigure("Agent Positioning", "3D Scatter")}
          points={[
            { x: 2, y: 5, z: 2, color: "var(--danger)", size: 0.6 },
            { x: 5, y: 2, z: 7, color: "#3f5c52", size: 0.8 },
            { x: 8, y: 8, z: 4, color: "var(--ink)", size: 0.5 },
            { x: 3, y: 6, z: 8, color: "#4a6a7a", size: 0.7 },
          ]}
        />
      </div>

      <header style={{ marginTop: "4rem", marginBottom: "2rem" }}>
        <h2 className="headline" style={{ fontSize: "2rem" }}>Thematic Iconography</h2>
        <p className="lede">Four distinct visual languages for mathematical and economic notation.</p>
      </header>

      <div style={{ overflowX: "auto", border: "2px solid var(--ink)", background: "var(--paper)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
          <thead>
            <tr style={{ background: "var(--ink)", color: "var(--paper)" }}>
              <th style={{ padding: "1rem", textAlign: "left" }}>ICON</th>
              {styles.map(s => (
                <th key={s.id} style={{ padding: "1rem", textAlign: "center" }}>{s.id.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {iconNames.map(name => (
              <tr key={name} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "1rem", fontWeight: "bold" }}>{name.toUpperCase()}</td>
                {styles.map(s => {
                  const Component = (Icons as Record<string, React.ElementType>)[`${s.prefix}${name}Icon`];
                  return (
                    <td key={s.id} style={{ padding: "1rem", textAlign: "center" }}>
                      {Component ? <Component size={32} /> : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
