export interface ScenarioInfo {
  name: string;
  label: string;
  icon: string;
  description: string;
  horizon: number;
  overrideCount: number;
}

export const SCENARIOS: ScenarioInfo[] = [
  {
    name: "baseline",
    label: "Baseline",
    icon: "\u2296",
    description: "Default peninsula dynamics with moderate resource rents and modest institutional drift.",
    horizon: 300,
    overrideCount: 0,
  },
  {
    name: "resource-curse",
    label: "Resource Curse",
    icon: "\u25C6",
    description: "Resource-rich sites start more extractive and remain tempting long enough to become traps.",
    horizon: 420,
    overrideCount: 16,
  },
  {
    name: "botswana",
    label: "Botswana",
    icon: "\u25C7",
    description: "Resource rents remain high, but inclusive and adaptive initial institutions soften the curse.",
    horizon: 420,
    overrideCount: 12,
  },
  {
    name: "open-cluster",
    label: "Open Cluster",
    icon: "\u2B21",
    description: "Trade-oriented sites begin more open and get stronger spatial spillovers from nearby peers.",
    horizon: 360,
    overrideCount: 13,
  },
  {
    name: "merchant-republic",
    label: "Merchant Republic",
    icon: "\u2693",
    description: "Port-led city clusters coordinate through trade and capital accumulation rather than extractive rents.",
    horizon: 360,
    overrideCount: 11,
  },
  {
    name: "megacity-trap",
    label: "Megacity Trap",
    icon: "\u25CF",
    description: "One dominant metropolis absorbs activity early, then overstretch and weak secondaries drag performance.",
    horizon: 360,
    overrideCount: 8,
  },
  {
    name: "balanced-urban-system",
    label: "Balanced Urban",
    icon: "\u2237",
    description: "Several midsize cities prosper together, producing a more stable hierarchy.",
    horizon: 360,
    overrideCount: 10,
  },
  {
    name: "shock-reform",
    label: "Shock Reform",
    icon: "\u26A1",
    description: "Early depletion shocks raise crisis pressure and create reform opportunities.",
    horizon: 420,
    overrideCount: 28,
  },
  {
    name: "ucb-bait",
    label: "UCB Bait",
    icon: "\u25C8",
    description: "Short-run resource returns spike hard while institutional decay accelerates behind them.",
    horizon: 280,
    overrideCount: 18,
  },
];
