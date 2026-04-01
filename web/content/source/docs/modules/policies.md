---
tags: [module, python, algorithms]
type: module
related:
  - "[[multi-armed-bandits]]"
  - "[[restless-bandits]]"
  - "[[model]]"
  - "[[sim]]"
---

# policies.py

`src/insulindian_miracle/policies.py` — 795 lines. Ten MAB algorithm implementations behind a shared protocol.

## Policy Protocol

```python
class Policy(Protocol):
    name: str
    def select_arm(self, states: list[SiteState]) -> int: ...
    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None: ...
```

Any object satisfying this interface works as a policy.

## Implementations

| Class | Policy Name | Lines | Family |
|-------|------------|-------|--------|
| `EpsilonGreedyPolicy` | epsilon-greedy | 53–81 | Baseline |
| `UCB1Policy` | ucb1 | 83–113 | Optimistic |
| `DiscountedUCBPolicy` | discounted-ucb | 161–194 | Optimistic |
| `SlidingWindowUCBPolicy` | sliding-window-ucb | 197–224 | Optimistic |
| `GaussianThompsonPolicy` | gaussian-thompson | 116–158 | Bayesian |
| `DiscountedGaussianThompsonPolicy` | discounted-gaussian-thompson | 228–229 | Bayesian |
| `LinUCBPolicy` | linucb | 233–264 | Contextual |
| `LinearThompsonPolicy` | linear-thompson | 267–305 | Contextual |
| `WhittleIndexPolicy` | whittle-index | 308–727 | Restless |
| `MyopicOraclePolicy` | myopic-oracle | 729–752 | Oracle |

## Factory

`build_policy(name, arm_count, seed, config)` at line 755 maps string names (with aliases) to constructed instances.

## Contextual Feature Vector

LinUCB and Linear Thompson use an 11-dimensional context:

```python
[1.0,                          # bias
 base_geography(site, config), # geographic score
 resource_rent,                # current resource level
 extraction,                   # institutional extraction
 openness,                     # institutional openness
 adaptability,                 # institutional adaptability
 productive_capital,           # accumulated capital
 log1p(population),            # log-population
 network_bonus(clamped),       # trade spillover
 float(boomtown),              # boomtown flag
 float(trade_cluster)]         # trade cluster flag
```

## Dependencies

- `model.SimulationConfig`, `model.SiteState`, `model.compute_reward`, `model.network_bonus`, `model.base_geography`, `model.sigmoid`
- `numpy` — linear algebra, random sampling
- `collections.deque` — sliding window storage

See individual policy notes: [[epsilon-greedy]], [[ucb1]], [[discounted-ucb]], [[sliding-window-ucb]], [[thompson-sampling]], [[discounted-thompson]], [[linucb]], [[linear-thompson]], [[whittle-index]], [[myopic-oracle]].
