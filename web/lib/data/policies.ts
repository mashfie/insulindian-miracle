export interface PolicyInfo {
  name: string;
  label: string;
  icon: string;
  type: "baseline" | "optimistic" | "bayesian" | "contextual" | "restless" | "oracle";
  description: string;
}

export const POLICIES: PolicyInfo[] = [
  {
    name: "epsilon-greedy",
    label: "Epsilon-Greedy",
    icon: "\u2684",
    type: "baseline",
    description: "Explore uniformly with probability epsilon, exploit best arm otherwise.",
  },
  {
    name: "ucb1",
    label: "UCB1",
    icon: "\u219F",
    type: "optimistic",
    description: "Upper confidence bound \u2014 optimism in the face of uncertainty.",
  },
  {
    name: "discounted-ucb",
    label: "Discounted UCB",
    icon: "\u23F3",
    type: "optimistic",
    description: "Exponential discount on past observations for non-stationary rewards.",
  },
  {
    name: "sliding-window-ucb",
    label: "Sliding Window UCB",
    icon: "\u229E",
    type: "optimistic",
    description: "Retains only recent observations per arm within a fixed window.",
  },
  {
    name: "gaussian-thompson",
    label: "Gaussian Thompson",
    icon: "\u223F",
    type: "bayesian",
    description: "Posterior sampling with Normal-Normal conjugate priors.",
  },
  {
    name: "discounted-gaussian-thompson",
    label: "Discounted Thompson",
    icon: "\u2298",
    type: "bayesian",
    description: "Thompson sampling with posterior decay for non-stationarity.",
  },
  {
    name: "linucb",
    label: "LinUCB",
    icon: "\u27CB",
    type: "contextual",
    description: "Contextual bandit with regularized linear regression on site features.",
  },
  {
    name: "linear-thompson",
    label: "Linear Thompson",
    icon: "\u25B3",
    type: "contextual",
    description: "Contextual Thompson sampling with linear feature model.",
  },
  {
    name: "whittle-index",
    label: "Whittle Index",
    icon: "\u229B",
    type: "restless",
    description: "Restless bandit policy computing per-arm subsidy indices via rollout.",
  },
  {
    name: "myopic-oracle",
    label: "Myopic Oracle",
    icon: "\u25CE",
    type: "oracle",
    description: "Selects the arm with highest immediate expected reward (upper bound).",
  },
];
