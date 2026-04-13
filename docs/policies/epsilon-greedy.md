---
tags: [policy, baseline]
type: policy
related:
  - "[[ucb1]]"
  - "[[multi-armed-bandits]]"
---

# Epsilon Greedy

## Rule

After an initial one-pass exploration, choose

$$
A_t =
\begin{cases}
\text{Uniform}(\{1,\dots,n\}) & \text{with probability } \varepsilon, \\
\arg\max_i \hat\mu_i & \text{otherwise.}
\end{cases}
$$

The code uses `epsilon = 0.1`.

## Implementation

- file: `rust/src/policies.rs`
- state: pull counts and running sample means
- update: incremental sample mean

## Use in this repo

This is a transparent baseline for path dependence and lock-in. It has no explicit drift handling and no state awareness.

## Literature

- [Lattimore and Szepesvari (2020)](https://banditalgs.com)
