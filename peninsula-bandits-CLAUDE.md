# Peninsula of Bandits: City Formation, Institutional Dynamics, and the Resource Curse

## A Multi-Armed Bandit Simulation of Spatial Political Economy

---

## 1. Project Overview

Simulate city formation and decline on a procedurally generated peninsula, where **Multi-Armed Bandit (MAB) algorithms** allocate population across candidate settlement sites. The core hypothesis: **natural resource abundance corrupts institutions**, and the explore/exploit tradeoff determines whether a civilization discovers this in time.

Geography is the stage; institutions are the story. MAB is what you're learning.

### What This Project Is

- A computational testbed for the resource curse hypothesis (Sachs & Warner, 1995)
- A benchmark comparing MAB algorithms (ε-greedy, UCB1, Thompson Sampling, Whittle index) on a non-stationary problem where the naive greedy choice is systematically wrong
- A generative model that should reproduce stylized facts from urban economics: Zipf's law rank-size distribution, path dependence, institutional divergence from similar initial conditions

### What This Project Is Not

- Not an optimal transport model (no trade network routing)
- Not an agent-based model (no individual decision-making agents)
- Not a general equilibrium model (no prices, no markets)

---

## 2. Theoretical Foundations

### 2.1 Urban Economics: Why Cities Exist

**Core tension:** centripetal forces (agglomeration economies) vs. centrifugal forces (congestion, land rents).

| Concept | Source | Key Claim |
|---------|--------|-----------|
| Central place theory | Christaller (1933), Lösch (1940) | Cities space themselves to minimize transport costs for serving a hinterland |
| Agglomeration economies | Henderson (1974) | City size is determined by the tradeoff between scale economies in production and diseconomies from commuting/congestion |
| New economic geography | Krugman (1991) | Increasing returns + transport costs + factor mobility → core-periphery patterns emerge endogenously |
| Path dependence | Arthur (1994) | Small early advantages get locked in; multiple equilibria exist and which one is selected depends on historical accidents |

**References:**

- Christaller, W. (1933). *Die zentralen Orte in Süddeutschland*. Gustav Fischer.
- Lösch, A. (1940). *Die räumliche Ordnung der Wirtschaft*. Gustav Fischer.
- Henderson, J.V. (1974). "The Sizes and Types of Cities." *American Economic Review*, 64(4), 640–656.
- Krugman, P. (1991). "Increasing Returns and Economic Geography." *Journal of Political Economy*, 99(3), 483–499. [https://doi.org/10.1086/261763](https://doi.org/10.1086/261763)
- Arthur, W.B. (1994). *Increasing Returns and Path Dependence in the Economy*. University of Michigan Press.

### 2.2 Institutions: Why Nations Fail

**Core claim (Acemoglu & Robinson, 2012):** Prosperity depends on inclusive vs. extractive institutions, not geography or culture.

- **Inclusive institutions**: secure property rights, level playing field, incentives for investment and innovation → compounding returns
- **Extractive institutions**: elite captures surplus, no creative destruction, short-run rents → long-run stagnation

The model needs three institutional dimensions (continuous axes, not discrete types):

| Axis | Range | What It Captures | Real-World Analogy |
|------|-------|------------------|--------------------|
| **Extraction rate** $e_k \in [0,1]$ | How much surplus the elite captures vs. reinvests | Nigeria ($e \approx 0.8$) vs. Norway ($e \approx 0.1$) |
| **Openness** $o_k \in [0,1]$ | Trade/migration/idea diffusion | Gulf states (low $o$) vs. Hanseatic League (high $o$) |
| **Adaptability** $a_k \in [0,1]$ | Speed of institutional reform under pressure | USSR (low $a$) vs. Meiji Japan (high $a$) |

**References:**

- Acemoglu, D. & Robinson, J.A. (2012). *Why Nations Fail: The Origins of Power, Prosperity, and Poverty*. Crown Publishers.
- Acemoglu, D., Johnson, S. & Robinson, J.A. (2001). "The Colonial Origins of Comparative Development." *American Economic Review*, 91(5), 1369–1401. [https://doi.org/10.1257/aer.91.5.1369](https://doi.org/10.1257/aer.91.5.1369)
- North, D.C. (1990). *Institutions, Institutional Change and Economic Performance*. Cambridge University Press.
- Olson, M. (1982). *The Rise and Decline of Nations*. Yale University Press. (Institutional sclerosis argument)

### 2.3 The Resource Curse

**Core empirical finding (Sachs & Warner, 1995):** Countries with high natural resource exports/GDP in 1971 had significantly lower growth 1971–89, even controlling for initial income, trade policy, government efficiency, investment rates.

**Mechanisms (channels through which resources corrupt institutions):**

1. **Dutch Disease** (Corden & Neary, 1982): Resource booms appreciate the real exchange rate, crowd out manufacturing and tradable sectors
2. **Rentier state** (Ross, 1999; Auty, 1993): Resource rents remove the fiscal bargain between state and citizens — no taxation, no representation
3. **Weakened reform pressure**: High baseline reward from resources means the city/country never hits the crisis threshold that forces institutional improvement
4. **Elite capture** (Acemoglu & Robinson): Resource abundance makes extractive institutions more attractive and sustainable for longer

**The Botswana exception:** Same resource endowment (diamonds) as many failed states, but pre-existing inclusive institutions (tribal councils, property rights) meant resource wealth was channeled through inclusive structures. This is testable in the model: high $g_k$ + low initial $e_k$ → positive outcome.

**References:**

- Sachs, J.D. & Warner, A.M. (1995). "Natural Resource Abundance and Economic Growth." *NBER Working Paper* No. 5398. [https://www.nber.org/papers/w5398](https://www.nber.org/papers/w5398)
- Sachs, J.D. & Warner, A.M. (2001). "The Curse of Natural Resources." *European Economic Review*, 45(4–6), 827–838. [https://doi.org/10.1016/S0014-2921(01)00125-8](https://doi.org/10.1016/S0014-2921(01)00125-8)
- Ross, M.L. (1999). "The Political Economy of the Resource Curse." *World Politics*, 51(2), 297–322.
- Auty, R.M. (1993). *Sustaining Development in Mineral Economies: The Resource Curse Thesis*. Routledge.
- Corden, W.M. & Neary, J.P. (1982). "Booming Sector and De-Industrialisation in a Small Open Economy." *Economic Journal*, 92(368), 825–848.
- Frankel, J.A. (2012). "The Natural Resource Curse: A Survey of Diagnoses and Some Prescriptions." *HKS Faculty Research Working Paper* RWP12-014. [https://growthlab.hks.harvard.edu/wp-content/uploads/2015/02/cid_working_paper_233.pdf](https://growthlab.hks.harvard.edu/wp-content/uploads/2015/02/cid_working_paper_233.pdf)

---

## 3. Multi-Armed Bandit Theory

### 3.1 Core Textbook

**Lattimore, T. & Szepesvári, C. (2020). *Bandit Algorithms*. Cambridge University Press.**

- Free PDF: [https://tor-lattimore.com/downloads/book/book.pdf](https://tor-lattimore.com/downloads/book/book.pdf)
- Companion site: [https://banditalgs.com](https://banditalgs.com)
- Covers: stochastic, adversarial, Bayesian frameworks; UCB, Exp3, Thompson Sampling; linear bandits; combinatorial bandits; non-stationary problems

This is your primary reference. Mathematically rigorous with measure-theoretic probability, but written with intuition. Chapters 1–10 (stochastic bandits, UCB, Exp3) are the foundation. Chapter 36 covers Thompson Sampling.

### 3.2 Algorithms to Implement (In Order of Complexity)

#### 3.2.1 ε-Greedy

**Baseline.** With probability $\varepsilon$, explore uniformly; with probability $1-\varepsilon$, exploit the current best arm.

- Simple, well-understood, linear regret
- Will over-spread population (too much exploration) or over-concentrate (too little)
- Useful as a sanity check / lower bound on performance

No dedicated paper needed — covered in Lattimore & Szepesvári Ch. 6.

#### 3.2.2 UCB1 (Upper Confidence Bound)

**The workhorse.** Select arm $k$ maximizing $\hat{\mu}_k + \sqrt{\frac{2 \ln t}{N_k(t)}}$, where $\hat{\mu}_k$ is the empirical mean and $N_k(t)$ is the number of pulls.

- Optimism in the face of uncertainty
- $O(\sqrt{KT \ln T})$ regret for stationary problems
- Will fail on this problem: it exploits the early winner (resource-rich extractive city) and never learns the decay

**Reference:**

- Auer, P., Cesa-Bianchi, N. & Fischer, P. (2002). "Finite-time Analysis of the Multiarmed Bandit Problem." *Machine Learning*, 47(2), 235–256. [https://doi.org/10.1023/A:1013689704352](https://doi.org/10.1023/A:1013689704352)

#### 3.2.3 Thompson Sampling

**The Bayesian approach.** Maintain a posterior distribution over each arm's reward parameter. At each step, sample from each posterior, pull the arm with highest sample.

- For Bernoulli rewards: Beta-Bernoulli conjugacy → $\text{Beta}(\alpha_k, \beta_k)$ posterior, trivial to update
- For Gaussian rewards: Normal-Normal conjugacy
- Empirically near-optimal, elegant, easy to implement
- **The algorithm to understand deeply** — Bayesian mechanics of exploration are beautiful

**Key references:**

- Thompson, W.R. (1933). "On the Likelihood that One Unknown Probability Exceeds Another in View of the Evidence of Two Samples." *Biometrika*, 25(3–4), 285–294. (The original paper)
- Russo, D., Van Roy, B., Kazerouni, A., Osband, I. & Wen, Z. (2018). "A Tutorial on Thompson Sampling." *Foundations and Trends in Machine Learning*, 11(1), 1–96. [https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf](https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf) ← **Read this. It's the best tutorial.**
- Agrawal, S. & Goyal, N. (2012). "Analysis of Thompson Sampling for the Multi-armed Bandit Problem." *COLT 2012*. [http://proceedings.mlr.press/v23/agrawal12/agrawal12.pdf](http://proceedings.mlr.press/v23/agrawal12/agrawal12.pdf)

#### 3.2.4 Whittle Index (Restless Bandits)

**The hard one.** In restless bandits, arms that are *not* pulled also change state. This is your model: cities you don't invest in still evolve (institutions decay or improve, population drifts). The Whittle index policy assigns each arm a priority index based on a "subsidy for passivity" — how much you'd need to be paid to leave an arm idle.

- PSPACE-hard in general (Papadimitriou & Tsitsiklis, 1999)
- Whittle index is a heuristic relaxation, but empirically near-optimal
- Requires verifying **indexability** — the set of passive states must increase monotonically with the subsidy
- $O(K^3)$ algorithm to compute the index (Akbarzadeh & Mahajan, 2020)

**Key references:**

- Whittle, P. (1988). "Restless Bandits: Activity Allocation in a Changing World." *Journal of Applied Probability*, 25(A), 287–298. [https://doi.org/10.2307/3214163](https://doi.org/10.2307/3214163) ← **The foundational paper.**
- Gittins, J.C. (1979). "Bandit Processes and Dynamic Allocation Indices." *Journal of the Royal Statistical Society: Series B*, 41(2), 148–164. (Classical rested bandits — the precursor)
- Akbarzadeh, N. & Mahajan, A. (2020). "Conditions for Indexability of Restless Bandits and an $O(K^3)$ Algorithm to Compute Whittle Index." arXiv:2008.06111. [https://arxiv.org/abs/2008.06111](https://arxiv.org/abs/2008.06111)
- Weber, R.R. & Weiss, G. (1990). "On an Index Policy for Restless Bandits." *Journal of Applied Probability*, 27(3), 637–648.
- Avrachenkov, K. & Borkar, V.S. (2022). "Whittle Index Based Q-learning for Restless Bandits with Average Reward." *Automatica*, 139, 110186. [https://doi.org/10.1016/j.automatica.2022.110186](https://doi.org/10.1016/j.automatica.2022.110186)

### 3.3 Relevant Non-Stationary Variants

#### Rotting Bandits

Arms whose expected reward **decays** as a function of pulls. This is the extractive institution: the more you invest in it, the worse it gets (diminishing returns from extraction).

- Levine, N., Crammer, K. & Mannor, S. (2017). "Rotting Bandits." *NeurIPS 2017*. [https://arxiv.org/abs/1702.07274](https://arxiv.org/abs/1702.07274)
- Seznec, J., Locatelli, A., Carpentier, A., Lazaric, A. & Valko, M. (2019). "Rotting Bandits Are Not Harder Than Stochastic Ones." *AISTATS 2019*. [http://proceedings.mlr.press/v89/seznec19a/seznec19a.pdf](http://proceedings.mlr.press/v89/seznec19a/seznec19a.pdf) ← Improved regret bound.
- Seznec, J., Menard, P., Lazaric, A. & Valko, M. (2020). "A Single Algorithm for Both Restless and Rested Rotting Bandits." *AISTATS 2020*. [https://proceedings.mlr.press/v108/seznec20a.html](https://proceedings.mlr.press/v108/seznec20a.html)

#### Rising Bandits

The converse: arms whose reward **increases** with pulls. This is the inclusive institution — investment compounds.

- Heidari, H., Kearns, M. & Roth, A. (2016). "Tight Policy Regret Bounds for Improving and Decaying Bandits." *AISTATS 2016*.

#### Adversarial Bandits

For modeling exogenous shocks (plague, new sea route, resource discovery). The adversary can set rewards arbitrarily at each step.

- Auer, P., Cesa-Bianchi, N., Freund, Y. & Schapire, R.E. (2002). "The Nonstochastic Multiarmed Bandit Problem." *SIAM Journal on Computing*, 32(1), 48–77. (EXP3 algorithm)

---

## 4. Model Specification

### 4.1 Peninsula Generation

Keep it minimal. Geography is deliberately suppressed so institutional effects dominate.

```
Terrain:
- 2D grid or continuous surface
- Perlin noise for elevation (low amplitude — small variation)
- One river draining to coast (simple hydrology)
- Coastline on 2-3 sides

Sites:
- N = 15-20 candidate settlement locations
- Geographic endowment g_k ∈ [0, 1] per site
  - Function of: coastal proximity, river access, elevation, arable land
  - Deliberately small variance: std(g) ≈ 0.1-0.2
  - A few sites get high g_k (resource-rich): these are the trap
```

### 4.2 Institutional Initialization

Each site gets random institutional parameters at birth:

```
For each site k:
  e_k(0) ~ Beta(2, 5)        # extraction rate: skewed low (most start mildly extractive)
  o_k(0) ~ Beta(2, 2)        # openness: uniform-ish
  a_k(0) ~ Beta(3, 3)        # adaptability: centered
```

**Resource curse initialization:** Sites with high $g_k$ get a *positive bias* on initial $e_k$:

$$e_k(0) \sim \text{Beta}(2 + \lambda \cdot g_k, \; 5 - \lambda \cdot g_k)$$

where $\lambda > 0$ controls the strength of the resource-corruption channel. At $\lambda = 0$, no resource curse. At $\lambda = 4$, resource-rich sites start highly extractive.

### 4.3 Reward Function

The reward from allocating one unit of population to site $k$ at time $t$:

$$r_k(t) = \underbrace{g_k}_{\text{geography}} + \underbrace{(1 - e_k(t)) \cdot n_k(t)^{\alpha}}_{\text{inclusive agglomeration}} - \underbrace{e_k(t) \cdot \beta \cdot n_k(t)}_{\text{extractive drag}} - \underbrace{\gamma \cdot n_k(t)^2}_{\text{congestion}} + \underbrace{\text{network}(k, t)}_{\text{openness bonus}}$$

where:

- $n_k(t)$ = population at site $k$
- $\alpha \in (0, 1)$ = agglomeration elasticity (concavity of scale returns)
- $\beta > 0$ = extraction cost coefficient
- $\gamma > 0$ = congestion cost coefficient
- $\text{network}(k, t) = o_k \cdot \frac{1}{|\mathcal{O}|} \sum_{j \in \mathcal{O}} o_j \cdot f(d_{kj})$ = network externality from other open cities, decaying with distance

### 4.4 Institutional Dynamics

Each timestep, institutions evolve:

**Extraction drift (resource corruption):**

$$e_k(t+1) = e_k(t) + \delta_e \cdot g_k \cdot (1 - e_k(t)) \cdot \mathbb{1}[\text{no reform}]$$

Resource-rich sites drift toward higher extraction unless reform occurs.

**Reform trigger:**

$$P(\text{reform}_k \text{ at } t) = a_k \cdot \sigma\left(-\frac{\Delta r_k(t)}{\tau}\right)$$

where $\Delta r_k(t) = r_k(t) - r_k(t - w)$ is the reward change over window $w$, $\sigma$ is the sigmoid, and $\tau$ is the pain sensitivity. Reform is more likely when reward is dropping ($\Delta r < 0$) and adaptability $a_k$ is high. Resource-rich cities have high baseline $r_k$, so $\Delta r_k$ stays near zero → reform never triggers. **This is the resource curse mechanism.**

**Reform effect (if triggered):**

$$e_k \leftarrow e_k - \delta_{\text{reform}} \quad \text{(with noise)}$$

Short-term cost: reward drops by a fixed penalty for $T_{\text{reform}}$ steps (institutional transition disruption).

### 4.5 Simulation Loop

```
For each Monte Carlo run m = 1, ..., M:
  1. Generate peninsula (fixed across policies, varies across runs)
  2. Initialize N sites with random institutions
  3. For t = 1, ..., T:
     a. MAB policy selects site k_t to receive one population unit
     b. Population n_{k_t} += 1
     c. Reward r_{k_t}(t) is observed
     d. Institutions evolve for ALL sites (restless dynamics)
     e. With probability p_shock, apply exogenous shock
  4. Record: final populations, institutional parameters, cumulative reward, city rank-size distribution
```

### 4.6 Exogenous Shocks (Optional for v1)

With probability $p_{\text{shock}}$ per timestep:

- **Resource depletion:** $g_k \leftarrow g_k \cdot (1 - \delta_{\text{deplete}})$ for a random resource-rich site
- **New trade route:** Random pair of sites get openness bonus
- **Plague:** Densest city loses fraction of population
- **Resource discovery:** Random inland site gets $g_k$ boost

---

## 5. Experimental Design

### 5.1 Hypotheses to Test

| # | Hypothesis | Measurement | Expected Result |
|---|-----------|-------------|-----------------|
| H1 | **Resource curse:** High $g_k$ → worse long-run outcome | Correlation of $g_k$ with final $n_k$ and final $e_k$ | Negative correlation ($g$ vs. $n$), positive ($g$ vs. $e$) |
| H2 | **Conditional curse:** Curse only holds when initial $e_k > \bar{e}$ | Interaction of $g_k \times e_k(0)$ on final $n_k$ | High-$g$, low-$e$ sites (Botswana) should do well |
| H3 | **Network effects of openness** | Compare clustered-open vs. isolated-open cities | Clusters of open cities outperform isolated ones |
| H4 | **Crisis as reform trigger** | Cities hit by early shocks vs. those that coast | Early-shocked cities develop better institutions |
| H5 | **Algorithm comparison** | Cumulative regret across policies | Thompson Sampling and Whittle outperform UCB1 and ε-greedy |
| H6 | **Zipf's law emergence** | Rank-size distribution of final populations | Power law with exponent ≈ -1 |
| H7 | **UCB1 gets baited** | Track UCB1's allocation to extractive high-$g$ sites | UCB1 over-invests in the decaying arm |

### 5.2 Parameters to Sweep

```
λ ∈ {0, 1, 2, 4}          # resource-corruption strength
α ∈ {0.3, 0.5, 0.7}       # agglomeration elasticity
p_shock ∈ {0, 0.01, 0.05}  # shock probability
N ∈ {10, 15, 20}           # number of sites
T ∈ {500, 1000, 5000}      # time horizon
M = 500                     # Monte Carlo runs per configuration
```

---

## 6. Implementation Plan

### Phase 1: Foundation (Week 1)

1. Peninsula generation (Perlin noise, river, coast detection)
2. Site placement and endowment assignment
3. Basic reward function (no institutions yet — just geography + agglomeration + congestion)
4. Implement ε-greedy and UCB1
5. Verify: with no institutions, do cities form at geographic cost-minimizers?

### Phase 2: Institutions (Week 2)

1. Add institutional axes ($e_k, o_k, a_k$)
2. Implement institutional dynamics (extraction drift, reform trigger)
3. Add resource-corruption channel ($\lambda > 0$)
4. Implement Thompson Sampling
5. Run H1 and H2 experiments

### Phase 3: Non-Stationarity & Whittle (Week 3)

1. Implement restless bandit dynamics (all arms evolve every step)
2. Implement Whittle index computation (start with the $O(K^3)$ algorithm from Akbarzadeh & Mahajan)
3. Add exogenous shocks
4. Full algorithm comparison (H5, H7)

### Phase 4: Analysis & Visualization (Week 4)

1. Monte Carlo analysis across parameter sweeps
2. Rank-size distribution analysis (H6)
3. Visualization: peninsula timelapse showing city growth/decline + institutional heatmaps
4. Regret curves and algorithm comparison plots

---

## 7. Tech Stack

```
Language:    Python
MAB:         Custom implementations (the point is to learn, not use a library)
Terrain:     noise (Perlin noise), numpy
Simulation:  numpy, scipy
Statistics:  scipy.stats (Beta distributions for Thompson Sampling)
Viz:         matplotlib, plotly (for interactive peninsula maps)
Parallelism: joblib or multiprocessing (Monte Carlo runs are embarrassingly parallel)
```

---

## 8. Complete Reference List

### Multi-Armed Bandits — Theory

1. **Lattimore, T. & Szepesvári, C. (2020).** *Bandit Algorithms.* Cambridge University Press. Free PDF: [https://tor-lattimore.com/downloads/book/book.pdf](https://tor-lattimore.com/downloads/book/book.pdf)
2. **Thompson, W.R. (1933).** "On the Likelihood that One Unknown Probability Exceeds Another." *Biometrika*, 25(3–4), 285–294.
3. **Gittins, J.C. (1979).** "Bandit Processes and Dynamic Allocation Indices." *JRSS-B*, 41(2), 148–164.
4. **Auer, P., Cesa-Bianchi, N. & Fischer, P. (2002).** "Finite-time Analysis of the Multiarmed Bandit Problem." *Machine Learning*, 47(2), 235–256.
5. **Auer, P., Cesa-Bianchi, N., Freund, Y. & Schapire, R.E. (2002).** "The Nonstochastic Multiarmed Bandit Problem." *SIAM J. Computing*, 32(1), 48–77.

### Multi-Armed Bandits — Thompson Sampling

6. **Russo, D. et al. (2018).** "A Tutorial on Thompson Sampling." *Foundations and Trends in ML*, 11(1), 1–96. [https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf](https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf)
7. **Agrawal, S. & Goyal, N. (2012).** "Analysis of Thompson Sampling for the Multi-armed Bandit Problem." *COLT 2012.* [http://proceedings.mlr.press/v23/agrawal12/agrawal12.pdf](http://proceedings.mlr.press/v23/agrawal12/agrawal12.pdf)

### Multi-Armed Bandits — Restless & Non-Stationary

8. **Whittle, P. (1988).** "Restless Bandits: Activity Allocation in a Changing World." *J. Applied Probability*, 25(A), 287–298.
9. **Weber, R.R. & Weiss, G. (1990).** "On an Index Policy for Restless Bandits." *J. Applied Probability*, 27(3), 637–648.
10. **Akbarzadeh, N. & Mahajan, A. (2020).** "Conditions for Indexability of Restless Bandits and an $O(K^3)$ Algorithm." arXiv:2008.06111. [https://arxiv.org/abs/2008.06111](https://arxiv.org/abs/2008.06111)
11. **Avrachenkov, K. & Borkar, V.S. (2022).** "Whittle Index Based Q-learning for Restless Bandits." *Automatica*, 139, 110186.
12. **Levine, N., Crammer, K. & Mannor, S. (2017).** "Rotting Bandits." *NeurIPS 2017.* [https://arxiv.org/abs/1702.07274](https://arxiv.org/abs/1702.07274)
13. **Seznec, J. et al. (2019).** "Rotting Bandits Are Not Harder Than Stochastic Ones." *AISTATS 2019.*
14. **Seznec, J. et al. (2020).** "A Single Algorithm for Both Restless and Rested Rotting Bandits." *AISTATS 2020.*
15. **Heidari, H., Kearns, M. & Roth, A. (2016).** "Tight Policy Regret Bounds for Improving and Decaying Bandits." *AISTATS 2016.*

### Urban Economics & Economic Geography

16. **Christaller, W. (1933).** *Die zentralen Orte in Süddeutschland.* Gustav Fischer.
17. **Lösch, A. (1940).** *Die räumliche Ordnung der Wirtschaft.* Gustav Fischer.
18. **Henderson, J.V. (1974).** "The Sizes and Types of Cities." *AER*, 64(4), 640–656.
19. **Krugman, P. (1991).** "Increasing Returns and Economic Geography." *JPE*, 99(3), 483–499.
20. **Arthur, W.B. (1994).** *Increasing Returns and Path Dependence in the Economy.* Michigan.

### Political Economy & Resource Curse

21. **Acemoglu, D. & Robinson, J.A. (2012).** *Why Nations Fail.* Crown.
22. **Acemoglu, D., Johnson, S. & Robinson, J.A. (2001).** "Colonial Origins of Comparative Development." *AER*, 91(5), 1369–1401.
23. **Sachs, J.D. & Warner, A.M. (1995).** "Natural Resource Abundance and Economic Growth." *NBER WP* 5398. [https://www.nber.org/papers/w5398](https://www.nber.org/papers/w5398)
24. **Sachs, J.D. & Warner, A.M. (2001).** "The Curse of Natural Resources." *European Economic Review*, 45(4–6), 827–838.
25. **Ross, M.L. (1999).** "The Political Economy of the Resource Curse." *World Politics*, 51(2), 297–322.
26. **Auty, R.M. (1993).** *Sustaining Development in Mineral Economies.* Routledge.
27. **Corden, W.M. & Neary, J.P. (1982).** "Booming Sector and De-Industrialisation." *Economic Journal*, 92(368), 825–848.
28. **North, D.C. (1990).** *Institutions, Institutional Change and Economic Performance.* Cambridge.
29. **Olson, M. (1982).** *The Rise and Decline of Nations.* Yale.

---

## 9. Reading Order

**If you're short on time, read in this order:**

1. Lattimore & Szepesvári (2020), Chapters 1–7 (stochastic bandits, UCB) — **the math foundation**
2. Russo et al. (2018), "A Tutorial on Thompson Sampling" — **the most important algorithm tutorial**
3. Whittle (1988) — **short, foundational, sets up restless bandits**
4. Levine et al. (2017), "Rotting Bandits" — **the decay mechanism you need**
5. Sachs & Warner (1995/2001) — **the empirical claim you're testing**
6. Acemoglu & Robinson (2012), Chapters 1–3 — **the institutional typology** (skip the historical examples, you know them)

Everything else is reference material to consult as needed during implementation.
