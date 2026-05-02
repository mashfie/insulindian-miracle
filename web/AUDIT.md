# Insulindian Miracle — Numerical Audit

Pass-1 audit of every numerical and structural claim in the existing user-facing prose against the source JSONs in `content/source/results/`, `content/source/research/`, and `content/generated/atlas-source.json`. Performed before the prose rewrite, so the rewrite has a clean factual basis.

**Conventions.**
- ✅ verified — claim matches data
- ⚠️ stale / mislabeled — claim is technically defensible but loaded or imprecise
- ❌ wrong — claim contradicts the data
- 🆕 new claim — finding the data supports that the current prose does not say
- 🌫 hedged — claim that should appear in voice but is one inferential step beyond strict empirical reading

---

## A. Headline / cohort accounting

| # | Surface | Existing claim | Data | Status |
|---|---|---|---|---|
| A1 | landing dek | "1,590,008 policy executions" | `cohort-synthesis.json → headline_totals.total = 1590008` | ✅ |
| A2 | landing §cohort-accounting | "1,000,008 + 90,000 + 500,000" | `headline_totals.legacy_1m = 1000008`, `historical_90k = 90000`, `stress_500k = 500000` | ✅ |
| A3 | landing §cohort-accounting | "broad baseline ranking" / "canonical scenario evidence" / "adversarial perturbation" labels for the three cohorts | `cohort_breakdown[*]` has matching labels: legacy 1m, historical 90k, stress 500k | ✅ |
| A4 | landing §cohort-accounting | implicit: same policy set across cohorts | `legacy_1m.policy_count = 9`; `historical_90k.policy_count = 10`; `stress_500k.policy_count = 10` (the 10th is `myopic-oracle`) | ⚠️ — prose currently silent on this asymmetry. The legacy 1m sweep does not include the oracle. Worth surfacing in voice. |
| A5 | references dek | "16-point anchor" | `research/index.json → entries.length = 16` | ✅ |
| A6 | references — annotations rendered | exemplars.json bibliography_annotations has **11 keys** | 16 references exist; annotations missing for `agrawal2012thompson`, `seznec2019rotting`, `arthur1994pathdependence`, `sachs2001curse`, `corden1982dutchdisease` | ❌ — five references render with no annotation. Rewrite must supply annotations for all 16. |

---

## B. Policy population & scope

| # | Surface | Existing claim | Data | Status |
|---|---|---|---|---|
| B1 | `app/policies/page.tsx` description | "Ten multi-armed bandit policies" | `policy-dossiers.json` has **9 policies**: epsilon-greedy, ucb1, discounted-ucb, sliding-window-ucb, gaussian-thompson, discounted-gaussian-thompson, linucb, linear-thompson, whittle-index | ❌ — there are 9 bandit policies. The 10th evaluated agent is `myopic-oracle`, which is the comparison ceiling, not a bandit. Rewrite to "Nine multi-armed bandit policies, evaluated against a one-step myopic oracle." |
| B2 | landing voice posture | implicitly homogeneous policy set | per-cohort policy lists in scenario JSONs all carry the same 9 bandits + `myopic-oracle` | ✅ — within scenarios, consistent. |
| B3 | `lib/data/archive-figures.tsx` POLICY_COLORS | 10 keys (9 bandits + myopic-oracle) | matches `policy-dossiers.json` keys + oracle | ✅ |
| B4 | `lib/data/archive-figures.tsx` shortPolicyName | substitutions for all 10 policy slugs | covers everything; "Whittle", "SW-UCB", "D-UCB", "G-TS", "D-G-TS" (long), "LinUCB", "Lin-TS", "Eps", "UCB1", "Oracle" | ⚠️ — `discounted-gaussian-thompson` collapses to `D-G-TS` which is awkward. Cosmetic, not factual. |
| B5 | scenarios index description | "Nine institutional experiments" | exemplars.json `scenario_pages` has 9 keys; results dir has 9 cohort JSONs | ✅ |

---

## C. Scenario-level: per-scenario sanity check

For each scenario, verifying current prose against the cohort JSON. Format: scenario, key prose claims, status.

### C1. baseline
| Claim | Data | Status |
|---|---|---|
| "default reward machine intact" | runs=3000, oracle reward=2955.10, empirical best=3080.28 | ✅ structural |
| (implicit) "Whittle is best" | Whittle reward=3056.73, oracle_regret=−101.64, win_rate vs oracle=85.9% | ✅ — and the rewrite should *say* this, not leave it implicit. Whittle beats the oracle here. |
| baseline reward distribution shape | bimodal: peaks 1500–2000 (n=7604) and 2500–3000 (n=8017); 27 runs in [-1000,−500] | 🆕 **load-bearing finding**: the population reward distribution is bimodal — two policy clusters, exploit-first and explore-first, separating the histogram. Prose should name this. |
| Whittle Zipf-slope | −0.018 (essentially flat — uniform city sizes) | 🆕 — Whittle wins reward by collapsing the rank-size distribution toward uniformity. This is structural, not incidental. Prose must name it. |
| Whittle population HHI | 0.0667 (concentration floor) | 🆕 |
| UCB1 "expected to underperform" | oracle_regret = +1445.93, win_rate vs oracle = 0/3000 = **0.0%** | ✅ but understated. UCB1 *never* beats the oracle in baseline, not "underperforms" — it loses every single match. |

### C2. resource-curse (renders at slug `resource-curse-scenario`)
| Claim | Data | Status |
|---|---|---|
| "resource rents generate short-run cashflow while weakening institutional buffers" | runs=9000, scenario.description matches | ✅ |
| (implicit) the curse hurts everyone | **6 of 9 policies *beat* the myopic oracle** here. SW-UCB +840, D-UCB +806, D-TS +646, LinTS +336, LinUCB +150 (vs oracle 1575.28). | 🆕 **biggest single rewrite hook**: the resource curse curses the *oracle*. A myopic rent-following baseline is itself a victim of the rent dynamics. Bandits that distrust current-period rent (sliding window, discount factor) outperform. Current prose elides this entirely. |
| Whittle reward / regret | reward 1418.75, oracle_regret +156.53 (Whittle *underperforms* oracle here, win rate 45%) | 🆕 — the only scenario type (along with shock-reform and botswana) where Whittle is *not* the leader. Whittle's rank-size collapse penalises it when the resource peninsula needs differentiated extraction. |
| Empirical-best reward | 2564.13 vs oracle 1575.28 — empirical best is **+63%** above myopic ceiling | 🆕 the gap between the myopic oracle and the realised best is enormous in this scenario, larger than any other. Diagnostic of how badly myopia fails in resource-curse regimes. |
| reward histogram shape | strong right skew: mass at 1000–3000 with long thin tails to ±5000 | 🆕 |

### C3. botswana
| Claim | Data | Status |
|---|---|---|
| "rents do not mechanically destroy development" | reward levels 5x baseline; all top policies clear 5000 | ✅ |
| (implicit) Whittle wins here too | **SW-UCB wins here, Whittle does not.** SW-UCB 5557.55, Whittle 5038.71. Whittle is 4th. | ❌ — the page should be re-worked around this reversal. Current prose treats Botswana as confirmation of the exception logic; it is also the place where Whittle's signature collapse stops paying. |
| oracle regret signs | only SW-UCB has negative oracle_regret (−95.5). Every other policy underperforms oracle | 🆕 — under strong institutions, the myopic oracle is harder to beat. Decisive. |
| oracle Zipf-slope | −0.066 (near uniform) → buffered rents flatten the urban hierarchy that the oracle would build | 🆕 |
| reward histogram | unimodal-ish, 4000-5000 dominant (n=11097), reasonable spread | 🆕 |

### C4. open-cluster
| Claim | Data | Status |
|---|---|---|
| "Hanseatic scenario where network position dominates extractive endowment" | reward levels 5000+, low resource salience confirmed | ✅ |
| (implicit) spatial policies should win | LinUCB regret +376, LinTS +300 — both *underperform* oracle. Whittle reward 5460.87 is best, regret −440. | ❌ — current prose says "Policies that can read spatial structure should distribute investment across the cluster." LinUCB and LinTS are the spatial policies here and they lose. The spatial/non-spatial dichotomy doesn't carry the data; the forgetting/non-forgetting dichotomy does (D-UCB, SW-UCB win). |
| Whittle reward = 5460.87 | matches `cohort-synthesis.json scenario_winners[open-cluster].value = 5460.87` | ✅ cross-file consistency |
| oracle Zipf-slope | −0.5621 (genuine polycentric distribution) → trade externalities create real rank-size structure | 🆕 |
| reward histogram | clearly multimodal — visible peaks at 2500-3000, 4000-4500, 4500-5000, 5000-5500 | 🆕 — four-policy-regime separation visible. |

### C5. merchant-republic
| Claim | Data | Status |
|---|---|---|
| "Dutch and Venetian thought-experiment" | oracle reward 5702.89, empirical best 6145.86 — high reward, port-led | ✅ |
| Whittle wins | reward 6145.16 (= empirical best to 4 sig fig), oracle_regret −442, win rate 97.8% | ✅ — and is the **highest absolute reward across all 9 scenarios**. Worth saying. |
| oracle Zipf-slope | −0.7393 (strongly hierarchical: Venice/Antwerp/Amsterdam-shaped) | 🆕 |
| Whittle Zipf-slope here | −0.241 (compressed but not collapsed) — closer to oracle's hierarchy than in any other scenario | 🆕 — only scenario where Whittle's Zipf approaches the empirical structure. Prose should note: when the geography pre-allocates port advantage, Whittle's uniformising bias is partially neutralised. |
| ucb1 mean reward | 3274.72, oracle_regret +2428.18 (worst, 0/6000 wins) | 🆕 — UCB1 collapses worst here, suggesting that high-variance commercial geographies punish naïve optimism most severely. |

### C6. megacity-trap
| Claim | Data | Status |
|---|---|---|
| "agglomeration is productive until congestion turns scale into drag" | runs=8000, overstretch penalty in scenario | ✅ |
| (implicit) HHI matters | oracle HHI=0.086, Whittle HHI=0.068 (most distributed), UCB1 HHI=0.128 (most concentrated). | ✅ structural, but unstated in prose. |
| Whittle wins | reward 2971.50, oracle_regret −180.63, win rate 82.7% | ✅ |
| Empirical best 2989.99 vs Whittle 2971.50 | Whittle is at **99.4%** of the empirical ceiling | 🆕 — near-perfect. Prose currently does not have this number. |
| oracle Zipf | −0.0093 (basically zero — overstretch penalty drives oracle to uniform allocation too) | 🆕 — striking: in megacity-trap the *oracle itself* avoids primacy. Whittle is no longer the only flat-Zipf actor. |
| reward histogram shape | tight unimodal at 2000-3000 (n=35232) — narrowest reward distribution of any scenario | 🆕 |

### C7. balanced-urban-system (renders at slug `balanced-urban`)
| Claim | Data | Status |
|---|---|---|
| "secondary-city bonuses produce polycentric landscape" | oracle Zipf=−1.24 (steepest, most differentiated) | ✅ |
| Whittle reward 5271.68 | barely behind SW-UCB 5275.72 — **statistical tie** for first | 🆕 — the only scenario where Whittle and SW-UCB are within ~4 reward units. Prose currently silent. |
| Whittle Zipf-slope here | −0.1125 (still flat) vs oracle Zipf −1.24 | 🆕 — even when the *reward surface* explicitly rewards polycentricity, Whittle's behaviour produces a flatter Zipf than the optimal. It wins reward by a different morphology than the optimal. This is the cleanest demonstration of the Whittle uniformity bias. |
| reward histogram | unimodal at 4000-5000 (n=15138), polite tails | 🆕 |

### C8. shock-reform
| Claim | Data | Status |
|---|---|---|
| "crisis as state-change operator" | runs=8000, shock dynamics confirmed | ✅ |
| (implicit) Whittle wins | **SW-UCB wins, not Whittle.** SW-UCB 3535.07, Whittle 2788.23. Whittle's regret is +530 (it *underperforms* oracle, only 35% win rate). | ❌ — current prose implies forgetting policies should reset and Whittle should remain reasonable. Data: forgetting policies (SW-UCB, D-UCB, D-TS) sweep; Whittle is 7th of 9. The crisis defeats Whittle's restless-bandit assumption that arms can be tracked. |
| "forgetting can be intelligence" | SW-UCB regret −216, D-UCB regret −177, D-TS regret +43 — forgetting policies dominate | ✅ — and now numerically supported. |
| reward histogram | bimodal at 2000-2500 and 3000-3500 | 🆕 |

### C9. ucb-bait
| Claim | Data | Status |
|---|---|---|
| "boomtown briefly true; optimistic average learns wrong lesson with statistical confidence" | UCB1 regret +562, oracle_regret +727 for epsilon-greedy — both are caught by the bait | ✅ |
| (implicit) some policies escape the bait | **D-UCB wins.** Reward 1909.29, regret −191.92. SW-UCB very close (1903.72, −186.34). Whittle 4th (1859.71, −142.34). | ✅ — corresponds to the prose claim about forgetting policies. |
| Boomtown population share | this is the **only scenario** with non-zero `mean_boomtown_population_share`. Oracle baseline 0.115; UCB1 0.092; Whittle **0.028** (lowest); LinTS 0.144 (highest). | 🆕 **major finding**: across 9 scenarios, the boomtown share variable is identically zero in 8 and only nonzero here. Whittle is the only policy that materially escapes boomtown population dependence (less than a third of oracle's share). The "[BOOMTOWN]" tags in current prose are now numerically anchored. |
| reward histogram | tight bimodal: 1000-1500 (n=33776) and 1500-2000 (n=35086) — boom/bust cluster separation visible | 🆕 |

---

## D. Synthesis-level claims

| # | Surface / Existing claim | Data | Status |
|---|---|---|---|
| D1 | landing §estimands "95 percent paired bootstrap interval" | `cohort-synthesis.json paired_vs_*` entries have `ci_low`/`ci_high` fields with 59000 matches each | ✅ |
| D2 | (implicit) oracle is performance ceiling | **The oracle is exceeded in 8 of 9 scenarios** by at least one policy. The only scenario where the myopic oracle is the empirical ceiling is botswana (and only barely — SW-UCB still beats it by 95.5). | 🆕 **the largest unsaid claim**: the prose treats the oracle as a benchmark to chase. The data shows the oracle is *not* a ceiling. A myopic optimal is dominated by a non-myopic bandit in nearly every scenario. This is a Fisher-grade structural inversion. |
| D3 | landing §cohort-accounting "ranking is shown as cohort-scoped evidence" | `cohort-synthesis.json` provides `legacy_ranking` and `combined_ranking`, both 6-policy. The legacy ranking and the combined ranking *disagree on first place*: legacy → Whittle (3049); combined → SW-UCB (3603). | 🆕 — the cohort-accounting argument has a missing pay-off. The legacy 1m sweep crowns Whittle; the combined evidence crowns SW-UCB. The provenance of the claim genuinely matters and the data shows this. |
| D4 | (none) | `paired_vs_oracle` shows three policies with positive mean gap and CIs that exclude zero: D-UCB +187 [184, 190], SW-UCB +254 [251, 257], Whittle +27 [22, 32]. **All three reliably beat the oracle.** | 🆕 — three policies, not one, are robust dominators of the myopic oracle. |
| D5 | (none) | win-rate vs oracle: SW-UCB 90.9%, Whittle 70.0%, D-UCB 76.9%. SW-UCB dominates on consistency. | 🆕 |
| D6 | atlas dek "20 site objects" (per earlier exploration report) | `atlas-source.json sites.length = 15` | ❌ — atlas is 15 sites on a 64×64 grid, not "around 20". (Prose itself doesn't currently state a number, but if the rewrite quotes one, use 15.) |
| D7 | landing §morphology "rank-size slope" definition | `oracle_summary.mean_zipf_slope` provided per cohort | ✅ |
| D8 | landing §peninsula-model reward decomposition | structural — not directly testable from JSON, but the field set (extraction, openness, capital, reform, HHI, gini, Zipf, boomtown_share, land/river/coast share) corroborates each term | ✅ |

---

## E. whittle-run.json (single-trace reference)

| # | Surface / Existing claim | Data | Status |
|---|---|---|---|
| E1 | (implicit, used in landing visuals) "Whittle trace" | seed=7, cumulative_reward=1041.83 over 300 timesteps, visits all 15 sites with frequencies 17–24 (uniform-ish) | ⚠️ — the **1041.83 reward is far below the cohort mean of 3056.73** for baseline Whittle. This is a single low-seed trace. If the prose ever quotes the trace's reward, that number is unrepresentative. The visual is fine as a "shape of a trajectory" device. |
| E2 | landing §morphology — Whittle visits all sites uniformly | site visit frequencies in this seed: 6, 3, 14, 5, 0 each = 24; 7=23; 8, 1=20; 2=19; 10=17 | 🆕 — the Whittle uniform-visit signature is visible at the single-trace level too. Reinforces the cohort-level Zipf-collapse finding. |

---

## F. Atlas

| # | Existing claim | Data | Status |
|---|---|---|---|
| F1 | "Perlin-noise terrain" | structure (continuous 2D fields) is consistent with Perlin/value noise, not directly testable | ✅ |
| F2 | "coastal access, river adjacency, defensive depth, pockets of extractive promise" | `atlas-source.json` has `coastMask`, `riverMask`, `defensibility`, `resourceRent` 64×64 layers | ✅ |
| F3 | (sites count) | 15 site objects (id 0–14) | ✅ but should be made explicit in the rewrite |
| F4 | site features list (in earlier exploration) "7 numeric properties" | actual: 20 keys per site including `boomtown`, `boomtown_reward_bonus`, `boomtown_bonus_duration`, `boomtown_collapse_penalty`, `trade_cluster`, `trade_cluster_openness_bonus`, `trade_cluster_capital_bonus`, plus the geographic 7 | ❌ (in earlier scoping, not in current prose) — atlas prose should make use of the boomtown/trade-cluster site flags, which are concrete enough to anchor diagnostic claims. |

---

## G. Scenario→cohort routing

| # | Item | Status |
|---|---|---|
| G1 | exemplars.json key `resource-curse-scenario` ↔ result file `resource-curse-cohort.json` via INVERSE alias | mapping is consistent in the alias dict; full E2E rendering integrity must be confirmed at build/dev time, not statically | ⚠️ unverified-but-likely-fine |
| G2 | exemplars.json key `balanced-urban` ↔ result file `balanced-urban-system-cohort.json` | same; INVERSE alias `balanced-urban` → `balanced-urban-system` is in the dict | ⚠️ unverified-but-likely-fine |
| G3 | All other scenario keys match directly | verified | ✅ |

Recommend: smoke test with `pnpm build` after rewrite to confirm.

---

## H. New diagnostic names the data earns (skeleton for the rewrite)

A k-punk register lives or dies on whether the diagnostic name is doing argumentative work. These are the names the data underwrites:

| Name | Scenario / Surface | Underwriting fact |
|---|---|---|
| **The cursed oracle** | resource-curse + landing-level synthesis | Myopic oracle achieves 1575 reward; six bandits exceed it; SW-UCB by +840. The ceiling is the trap. |
| **The Whittle uniformity bias** | every scenario | Whittle's mean_zipf_slope is closer to zero than every other policy in every scenario (range −0.02 to −0.66 vs other policies routinely below −1). Whittle wins reward by destroying urban hierarchy. |
| **Forgetting as a refusal of the rentier present** | resource-curse, ucb-bait, shock-reform | Sliding-window and discounted policies dominate exactly the scenarios where the rent surface decays under exploitation. |
| **The oracle is not the ceiling** | landing synthesis | 8 of 9 scenarios have at least one policy exceeding the myopic oracle. |
| **Polycentricity as an algorithmic morphology** | balanced-urban, open-cluster, merchant-republic | Different policies reach polycentric outcomes by different mechanisms — Whittle by uniformity, SW-UCB by forgetting, D-UCB by discounting. The morphology is convergent across algorithms; the path is not. |
| **The boomtown is real** | ucb-bait | Only scenario with non-zero boomtown share. Whittle alone keeps share below half of oracle. The trap is named *and* measured. |
| **Crisis defeats restlessness** | shock-reform | Whittle's restless-bandit assumption (arms have stable indices that drift) breaks under regime change. SW-UCB and D-UCB sweep. |
| **The myopic ceiling is conditional** | botswana | Under buffered rents, the oracle becomes hard to beat — only SW-UCB exceeds it. The ceiling-ness of the ceiling is itself a function of the institutional regime. |
| **The bimodal reward distribution** | baseline, open-cluster, shock-reform, ucb-bait | Reward histograms show explicit policy-cluster separation. The "single-number" approach hides this multimodality by construction. |
| **Provenance disagrees with itself** | landing synthesis | Legacy ranking puts Whittle first; combined ranking puts SW-UCB first. The cohort-accounting argument is *paid for* by this disagreement, not just illustrated by it. |

These names are the spine of the rewrite. Each is anchored to a chart that the rewrite will introduce.

---

## I. Hedged claims (extension beyond strict empirical reading)

Where the rewrite lets diagnostic register run one inferential step past the data. Recorded here so the user can audit the extension separately from the pure findings.

| # | Hedge | What it is reading | What it is reading into |
|---|---|---|---|
| I1 | "rent as institutional weather" | bandits with temporal forgetting outperform in resource-curse | a claim that resource rent acts on institutions like weather acts on infrastructure: a flow you cannot accumulate against if your buffers are too small. The cohort comparison supports the structural claim; the meteorological metaphor is voice. |
| I2 | "the slow cancellation of urban hierarchy" | Whittle Zipf collapse | Fisher-Berardi reading of equilibrium-as-flatness. The data shows the collapse; the cancellation register reads it as a temporal-political condition. |
| I3 | "the oracle's hauntology" | the myopic oracle is exceeded in 8/9 scenarios | reading the oracle as a spectral optimum: present in every comparison, defeated in nearly every comparison, and yet structurally constitutive of the comparison. The empirical claim is exact; the spectrality is voice. |
| I4 | "boomtown as briefly-true" | ucb-bait reward histogram boomtown share | the claim that the bait works because it is real for a window. The data shows the temporal structure; the philosophical inflection is voice. |
| I5 | "a city system can optimise the present by damaging its future option set" | megacity-trap concentration vs reward | the option-set framing extends the static reward/HHI tradeoff into a temporal claim. Defensible but read into the data. |

---

## J. Items to fix in the rewrite

Catalogue of concrete corrections required, ordered by surface.

1. **Landing**: surface the cursed-oracle finding (D2/D4); the legacy-vs-combined ranking disagreement (D3); the policy-count clarification (B1 — 9 bandits + 1 oracle); the bimodal reward histogram (C1, C4, C8, C9).
2. **resource-curse-scenario**: pivot the page from "policy collapse under rent" to "the rent-following oracle is itself dominated"; add ranking-vs-oracle chart with `mean_gap` and CI.
3. **botswana**: add the SW-UCB-wins-not-Whittle reversal; rewrite the buffered-rent argument around it.
4. **open-cluster**: drop the "spatial-policies-win" framing (LinUCB and LinTS lose); replace with "forgetting-policies-win"; note the four-mode reward histogram.
5. **merchant-republic**: add the highest-absolute-reward observation; surface the Whittle Zipf approach to oracle hierarchy as the unique reconciliation case.
6. **megacity-trap**: surface that the *oracle itself* avoids primacy here (oracle Zipf ≈ 0). Whittle's win is no longer a structural exception in this regime.
7. **balanced-urban**: add the SW-UCB / Whittle statistical tie; sharpen the morphology-vs-reward separation using the Zipf gap.
8. **shock-reform**: pivot from the implicit-Whittle frame to the SW-UCB/D-UCB sweep; treat Whittle's failure here as the load-bearing finding.
9. **ucb-bait**: surface the unique non-zero boomtown share; numericise the [BOOMTOWN] tag; show Whittle as the only policy with boomtown share below half oracle.
10. **policies dossier**: correct "Ten" to "Nine bandit policies, evaluated against a one-step myopic oracle." Add per-policy structural summary lines (mean reward / oracle gap / morphology signature).
11. **bibliography**: write annotations for the 5 currently-unannotated entries: `agrawal2012thompson`, `seznec2019rotting`, `arthur1994pathdependence`, `sachs2001curse`, `corden1982dutchdisease`.
12. **atlas**: state the 15 sites / 64×64 grid explicitly; use the boomtown/trade-cluster site flags as anchors for the geography-as-prior argument.

---

## K. Cross-file numerical sanity (already verified)

- `cohort-synthesis.json scenario_winners[merchant-republic].value = 6145.16` ↔ `merchant-republic-cohort.json summary.whittle-index.mean_cumulative_reward = 6145.16` ✅
- `cohort-synthesis.json scenario_winners[open-cluster].value = 5460.87` ↔ `open-cluster-cohort.json summary.whittle-index.mean_cumulative_reward = 5460.87` ✅
- `cohort-synthesis.json paired_vs_oracle[whittle-index].mean_gap = 26.55` ↔ `policy-dossiers.json whittle-index.summary.mean_oracle_regret = -26.55` (sign flipped, correct convention) ✅
- `cohort-synthesis.json paired_vs_ucb1[*].matches = 59000` ↔ Σ scenario runs (3000+9000+4000+5000+6000+8000+5000+8000+11000) = 59000 ✅
- All scenario `runs` ↔ `summary[*].runs` ↔ `oracle_summary.runs` ✅ within each cohort file.

---

## L. Open questions for the user

1. The `historical_90k` and `stress_500k` cohorts include `myopic-oracle` as a 10th policy in their per-cohort lists; the `legacy_1m` cohort does not. Should the rewrite say "1.59M policy executions" or "1.59M agent-cohort executions, of which the legacy million is bandit-only"?
2. Should the boomtown-share value (0.115 oracle baseline in ucb-bait) become a featured chart on its own, or fold into the ucb-bait cohort summary?
3. The whittle-run.json single-trace reward (1042) is well below the cohort mean (3057). Is it acceptable for the rewrite to ignore this number entirely, since the trace is being used for shape and not magnitude?

Pending: answers will be incorporated into the vertical slice (landing) rewrite.
