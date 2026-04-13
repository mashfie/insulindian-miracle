# Whittle Parity Audit

Comparing the canonical Python implementation of `WhittleIndexPolicy` (from `rust/src/policies.rs` prior to its removal) with the Rust port in `rust/src/whittle.rs`, the logic is almost entirely semantically equivalent. Both equations for `surrogate_reward` and `transition` match the Python surrogate equations. Bin boundaries and encoding mechanisms are also mathematically identical.

## Discovered Discrepancies ("Extra Structure")

The primary discrepancy is found within the recursive `surrogate_value` evaluation function.

**Python's `_value`:**
```python
    def _value(self, state_key, depth, subsidy, cache):
        if depth <= 0: return 0.0
        ...
        active_value, passive_value = self._action_values(state_key, subsidy, depth, cache)
        ...
```

**Rust's `surrogate_value`:**
```rust
fn surrogate_value(state_key, depth, subsidy, config, cache, visited_stack) -> f64 {
    ...
    if visited_stack.contains(&sk) {
        return 0.0;
    }
    visited_stack.push(sk.clone());
    let (av, pv) = action_values(state_key, subsidy, depth, config, cache, visited_stack);
    visited_stack.pop();
    ...
}
```

The Rust port added explicit **cycle detection** via `visited_stack`. This is "extra structure" that was not present in the Python implementation. Furthermore, because `depth` decreases monotonically in each recursive step, a literal cycle on the exact same `(state_key, depth, subsidy)` is impossible in the rollout tree. The `visited_stack` is overhead and an unintentional divergence.

**Action Plan:**
1. Remove `visited_stack` from `surrogate_value`, `action_values`, and `root_action_values`.
2. This will restore exact semantic parity with the Python Whittle implementation.
