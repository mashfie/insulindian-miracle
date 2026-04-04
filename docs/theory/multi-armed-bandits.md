---
tags: [theory, algorithms, bandits]
type: theory
related:
  - "[[explore-exploit-tradeoff]]"
  - "[[restless-bandits]]"
  - "[[policies]]"
  - "[[epsilon-greedy]]"
  - "[[ucb1]]"
  - "[[thompson-sampling]]"
---

# Multi-Armed Bandits

The multi-armed bandit (MAB) problem formalises sequential decision-making under uncertainty. A learner faces $K$ arms (actions), each yielding stochastic rewards from an unknown distribution. At each time step, the learner selects one arm, observes a reward, and updates its beliefs.

## Formal Definition

Given $K$ arms with reward distributions $\{\nu_1, \ldots, \nu_K\}$ and means $\{\mu_1, \ldots, \mu_K\}$:

- At each step $t = 1, \ldots, T$, the learner selects arm $A_t \in \{1, \ldots, K\}$
- The learner observes reward $r_t \sim \nu_{A_t}$
- The goal is to maximise cumulative reward $\sum_{t=1}^{T} r_t$

The optimal strategy in hindsight always pulls the best arm $\mu^* = \max_k \mu_k$. **Regret** measures the gap:

$$
R(T) = T \cdot \mu^* - \sum_{t=1}^{T} r_t
$$

The [Lai & Robbins (1985)](https://doi.org/10.1016/0196-8858(85)90002-8) lower bound proves that for any consistent policy, regret must grow at least logarithmically:

$$
\liminf_{T \to \infty} \frac{R(T)}{\ln T} \geq \sum_{k:\mu_k < \mu^*} \frac{\mu^* - \mu_k}{\text{KL}(\nu_k \| \nu^*)}
$$

where $\text{KL}(\nu_k \| \nu^*)$ is the Kullback-Leibler divergence between the suboptimal and optimal arm distributions. For Gaussian arms with known variance $\sigma^2$, this simplifies to $R(T) \geq \Omega(K \ln T)$.

## Algorithm Families

The simulation implements 10 policies across five families. See [Lattimore & Szepesvári (2020)](https://tor-lattimore.com/downloads/book/book.pdf) for a comprehensive treatment.

### Baseline
- [[epsilon-greedy]] — explore uniformly with probability $\varepsilon$, exploit best estimate otherwise. Simple but wastes exploration budget on clearly suboptimal arms.

### Optimistic (Upper Confidence Bound)
- [[ucb1]] — [Auer, Cesa-Bianchi & Fischer (2002)](https://doi.org/10.1023/A:1013689704352) add an exploration bonus to the estimated mean:

$$
A_t = \arg\max_k \left[\hat{\mu}_k + \sqrt{\frac{2 \ln t}{n_k}}\right]
$$

where $\hat{\mu}_k$ is the sample mean for arm $k$ and $n_k$ is the number of pulls. Arms with fewer pulls get a larger bonus. Achieves $\mathcal{O}(K \ln T)$ regret, matching the Lai-Robbins bound up to constant factors.

- [[discounted-ucb]] — exponentially discounts past observations ($\gamma < 1$), adapting to non-stationary rewards. The effective sample size becomes $\tilde{n}_k = \sum_{s \leq t} \gamma^{t-s} \mathbb{1}[A_s = k]$, and the bonus is computed using $\tilde{n}_k$ instead of $n_k$. See [Garivier & Moulines (2011)](https://arxiv.org/abs/0805.3629).

- [[sliding-window-ucb]] — retains only the last $W$ observations per arm, directly forgetting stale data. The window size $W$ controls the bias-variance tradeoff: small $W$ reacts quickly but has high variance; large $W$ is stable but slow to detect changes.

### Bayesian (Thompson Sampling)
- [[thompson-sampling]] — maintains a posterior distribution over each arm's mean; samples from it and plays the arm with the highest sample. For Gaussian rewards with known variance, the posterior is:

$$
\mu_k \mid \text{data} \sim \mathcal{N}\!\left(\hat{\mu}_k, \frac{\sigma^2}{n_k}\right)
$$

Achieves near-optimal Bayesian regret. See [Russo et al. (2018)](https://arxiv.org/abs/1707.02038) for a tutorial treatment.

- [[discounted-thompson]] — applies posterior decay to handle non-stationarity. The posterior precision is discounted by $\gamma^{t-s}$, so older observations contribute less to the current belief.

### Contextual
- [[linucb]] — observes an 11-dimensional feature vector $\mathbf{x}_k \in \mathbb{R}^{11}$ per arm and fits a linear regression $\hat{r}_k = \mathbf{x}_k^\top \hat{\boldsymbol{\theta}}$. Adds a confidence bonus proportional to the feature-space uncertainty:

$$
A_t = \arg\max_k \left[\mathbf{x}_k^\top \hat{\boldsymbol{\theta}} + \alpha \sqrt{\mathbf{x}_k^\top \mathbf{V}^{-1} \mathbf{x}_k}\right]
$$

where $\mathbf{V} = \sum_s \mathbf{x}_{A_s} \mathbf{x}_{A_s}^\top + \lambda \mathbf{I}$ is the regularised design matrix.

- [[linear-thompson]] — posterior sampling over the linear model's weight vector $\boldsymbol{\theta} \sim \mathcal{N}(\hat{\boldsymbol{\theta}}, \sigma^2 \mathbf{V}^{-1})$.

### Restless
- [[whittle-index]] — models each arm as a Markov chain that evolves whether or not it is pulled. Computes a subsidy-based index via dynamic programming. See [[restless-bandits]] and [Whittle (1988)](https://doi.org/10.2307/3214163).

### Oracle
- [[myopic-oracle]] — selects the arm with the highest *immediate* reward by simulating one step ahead with full state knowledge. Provides an upper bound for regret computation.

## Mapping to the Simulation

| MAB Concept | Simulation Analogue |
|-------------|---------------------|
| Arm | Candidate settlement site |
| Pull | Allocate one population unit |
| Reward | `compute_reward()` — geography + institutions + network − costs |
| $K$ (arm count) | `num_sites` (default 15) |
| $T$ (horizon) | `horizon` (default 300) |
| Non-stationarity | Institutions evolve every step; resource depletion; shocks |
| Context vector | 11-dim feature: geography, extraction, openness, adaptability, capital, population, network, boomtown, trade_cluster |

> [!warning] Non-stationarity is the key challenge
> Classic MAB theory assumes stationary rewards. In this simulation, arm rewards change even for unpulled arms (institutions drift, network effects shift, shocks fire). This violates stationarity and motivates [[restless-bandits]] and discounted/windowed variants. The [Levine, Luo & Rusmevichientong (2017)](https://arxiv.org/abs/1702.07274) framework for "rotting bandits" — where rewards decrease with the number of pulls — partially applies, but the simulation's dynamics are richer: rewards can also *increase* for unpulled arms that undergo reform.
