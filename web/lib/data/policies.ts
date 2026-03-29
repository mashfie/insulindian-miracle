export interface PolicyInfo {
  name: string;
  label: string;
  type: "baseline" | "optimistic" | "bayesian" | "contextual" | "restless" | "oracle";
  description: string;
}

export const POLICIES: PolicyInfo[] = [
  {
    name: "epsilon-greedy",
    label: "Epsilon-Greedy",
    type: "baseline",
    description: "Explore uniformly with probability epsilon, exploit best arm otherwise.",
  },
  {
    name: "ucb1",
    label: "UCB1",
    type: "optimistic",
    description: "Upper confidence bound — optimism in the face of uncertainty.",
  },
  {
    name: "discounted-ucb",
    label: "Discounted UCB",
    type: "optimistic",
    description: "Exponential discount on past observations for non-stationary rewards.",
  },
  {
    name: "sliding-window-ucb",
    label: "Sliding Window UCB",
    type: "optimistic",
    description: "Retains only recent observations per arm within a fixed window.",
  },
  {
    name: "gaussian-thompson",
    label: "Gaussian Thompson",
    type: "bayesian",
    description: "Posterior sampling with Normal-Normal conjugate priors.",
  },
  {
    name: "discounted-gaussian-thompson",
    label: "Discounted Thompson",
    type: "bayesian",
    description: "Thompson sampling with posterior decay for non-stationarity.",
  },
  {
    name: "linucb",
    label: "LinUCB",
    type: "contextual",
    description: "Contextual bandit with regularized linear regression on site features.",
  },
  {
    name: "linear-thompson",
    label: "Linear Thompson",
    type: "contextual",
    description: "Contextual Thompson sampling with linear feature model.",
  },
  {
    name: "whittle-index",
    label: "Whittle Index",
    type: "restless",
    description: "Restless bandit policy computing per-arm subsidy indices via rollout.",
  },
  {
    name: "myopic-oracle",
    label: "Myopic Oracle",
    type: "oracle",
    description: "Selects the arm with highest immediate expected reward (upper bound).",
  },
];
