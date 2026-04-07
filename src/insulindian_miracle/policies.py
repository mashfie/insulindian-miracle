from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
import math
from typing import Protocol

import numpy as np

from .model import Action, SimulationConfig, SiteStateSnapshot, base_geography, compute_reward, network_bonus, sigmoid


class Policy(Protocol):
    name: str

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        ...

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        ...


CONTEXTUAL_FEATURE_DIM = 11


def _contextual_feature_vector(index: int, states: list[SiteStateSnapshot], config: SimulationConfig) -> np.ndarray:
    state = states[index]
    # For Phase 1, we use a simplified vector since we don't have the full Site object in snapshot
    return np.asarray(
        [
            1.0,
            0.0, # base_geography - could be added to snapshot if needed
            state.resource_rent,
            state.extraction,
            state.openness,
            state.adaptability,
            state.productive_capital,
            math.log1p(max(state.population, 1)),
            0.0, # network_bonus
            float(state.boomtown),
            float(state.trade_cluster),
        ],
        dtype=float,
    )


def _contextual_feature_matrix(states: list[SiteStateSnapshot], config: SimulationConfig) -> np.ndarray:
    if not states:
        return np.zeros((0, CONTEXTUAL_FEATURE_DIM), dtype=float)
    return np.vstack([_contextual_feature_vector(index, states, config) for index in range(len(states))])


@dataclass(slots=True)
class EpsilonGreedyPolicy:
    arm_count: int
    seed: int
    epsilon: float = 0.1
    name: str = "epsilon-greedy"
    rng: np.random.Generator = field(init=False, repr=False)
    counts: np.ndarray = field(init=False, repr=False)
    values: np.ndarray = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.rng = np.random.default_rng(self.seed)
        self.counts = np.zeros(self.arm_count, dtype=int)
        self.values = np.zeros(self.arm_count, dtype=float)

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        unseen = np.where(self.counts == 0)[0]
        if unseen.size:
            return int(unseen[0])
        if self.rng.random() < self.epsilon:
            return int(self.rng.integers(0, self.arm_count))
        return int(np.argmax(self.values))

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        self.counts[chosen_arm] += 1
        count = self.counts[chosen_arm]
        self.values[chosen_arm] += (reward - self.values[chosen_arm]) / count


@dataclass(slots=True)
class UCB1Policy:
    arm_count: int
    seed: int
    exploration: float = 2.0
    name: str = "ucb1"
    counts: np.ndarray = field(init=False, repr=False)
    values: np.ndarray = field(init=False, repr=False)
    steps: int = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.counts = np.zeros(self.arm_count, dtype=int)
        self.values = np.zeros(self.arm_count, dtype=float)
        self.steps = 0

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        unseen = np.where(self.counts == 0)[0]
        if unseen.size:
            return int(unseen[0])
        bonus = np.sqrt((self.exploration * np.log(max(self.steps, 1))) / self.counts)
        return int(np.argmax(self.values + bonus))

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        self.steps += 1
        self.counts[chosen_arm] += 1
        count = self.counts[chosen_arm]
        self.values[chosen_arm] += (reward - self.values[chosen_arm]) / count


@dataclass(slots=True)
class GaussianThompsonPolicy:
    arm_count: int
    seed: int
    observation_variance: float = 9.0
    prior_mean: float = 0.0
    prior_variance: float = 16.0
    posterior_decay: float = 1.0
    minimum_exploration_variance: float = 0.3
    name: str = "gaussian-thompson"
    rng: np.random.Generator = field(init=False, repr=False)
    precisions: np.ndarray = field(init=False, repr=False)
    mean_precision: np.ndarray = field(init=False, repr=False)
    counts: np.ndarray = field(init=False, repr=False)
    prior_precision: float = field(init=False, repr=False)
    prior_mean_precision: float = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.rng = np.random.default_rng(self.seed)
        self.prior_precision = 1.0 / self.prior_variance
        self.prior_mean_precision = self.prior_mean / self.prior_variance
        self.precisions = np.full(self.arm_count, self.prior_precision)
        self.mean_precision = np.full(self.arm_count, self.prior_mean_precision)
        self.counts = np.zeros(self.arm_count, dtype=float)

    def _sample_arm(self) -> int:
        variances = np.maximum(1.0 / self.precisions, self.minimum_exploration_variance / np.sqrt(self.counts + 1.0))
        means = self.mean_precision / self.precisions
        draws = self.rng.normal(means, np.sqrt(variances))
        return int(np.argmax(draws))

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        unseen = np.where(self.counts < 0.5)[0]
        if unseen.size:
            return int(unseen[0])
        return self._sample_arm()

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        obs_precision = 1.0 / self.observation_variance
        self.counts *= self.posterior_decay
        self.counts[chosen_arm] += 1.0
        self.precisions = self.prior_precision + self.posterior_decay * (self.precisions - self.prior_precision)
        self.mean_precision = self.prior_mean_precision + self.posterior_decay * (self.mean_precision - self.prior_mean_precision)
        self.precisions[chosen_arm] += obs_precision
        self.mean_precision[chosen_arm] += reward * obs_precision


@dataclass(slots=True)
class DiscountedUCBPolicy:
    arm_count: int
    seed: int
    gamma: float = 0.97
    exploration: float = 2.0
    name: str = "discounted-ucb"
    counts: np.ndarray = field(init=False, repr=False)
    reward_sums: np.ndarray = field(init=False, repr=False)
    total_mass: float = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.gamma = min(max(self.gamma, 0.0), 1.0)
        self.counts = np.zeros(self.arm_count, dtype=float)
        self.reward_sums = np.zeros(self.arm_count, dtype=float)
        self.total_mass = 0.0

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        unseen = np.where(self.counts <= 1e-9)[0]
        if unseen.size:
            return int(unseen[0])
        means = self.reward_sums / np.maximum(self.counts, 1e-9)
        bonus = np.sqrt((self.exploration * np.log(self.total_mass + 1.0)) / np.maximum(self.counts, 1e-9))
        return int(np.argmax(means + bonus))

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        self.counts *= self.gamma
        self.reward_sums *= self.gamma
        self.total_mass = self.total_mass * self.gamma + 1.0
        self.counts[chosen_arm] += 1.0
        self.reward_sums[chosen_arm] += reward


@dataclass(slots=True)
class SlidingWindowUCBPolicy:
    arm_count: int
    seed: int
    window_size: int = 40
    exploration: float = 2.0
    name: str = "sliding-window-ucb"
    observation_window: deque[tuple[int, float]] = field(init=False, repr=False)
    counts: np.ndarray = field(init=False, repr=False)
    reward_sums: np.ndarray = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.window_size = max(1, int(self.window_size))
        self.observation_window = deque()
        self.counts = np.zeros(self.arm_count, dtype=float)
        self.reward_sums = np.zeros(self.arm_count, dtype=float)

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        unseen = np.where(self.counts <= 1e-9)[0]
        if unseen.size:
            return int(unseen[0])
        means = self.reward_sums / np.maximum(self.counts, 1.0)
        total_mass = max(float(len(self.observation_window)), 1.0)
        bonus = np.sqrt((self.exploration * np.log(total_mass + 1.0)) / np.maximum(self.counts, 1.0))
        return int(np.argmax(means + bonus))

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        if len(self.observation_window) == self.window_size:
            expired_arm, expired_reward = self.observation_window.popleft()
            self.counts[expired_arm] = max(self.counts[expired_arm] - 1.0, 0.0)
            self.reward_sums[expired_arm] -= expired_reward
            if self.counts[expired_arm] <= 1e-9:
                self.counts[expired_arm] = 0.0
                self.reward_sums[expired_arm] = 0.0

        reward_value = float(reward)
        self.observation_window.append((chosen_arm, reward_value))
        self.counts[chosen_arm] += 1.0
        self.reward_sums[chosen_arm] += reward_value


@dataclass(slots=True)
class DiscountedGaussianThompsonPolicy(GaussianThompsonPolicy):
    name: str = "discounted-gaussian-thompson"
    observed: np.ndarray = field(init=False, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        self.observed = np.zeros(self.arm_count, dtype=bool)

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        unseen = np.where(~self.observed)[0]
        if unseen.size:
            return int(unseen[0])
        return self._sample_arm()

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        super().update(chosen_arm, reward, states)
        self.observed[chosen_arm] = True


@dataclass(slots=True)
class LinUCBPolicy:
    arm_count: int
    seed: int
    config: SimulationConfig
    alpha: float = 1.15
    ridge: float = 1.0
    name: str = "linucb"
    covariance: np.ndarray = field(init=False, repr=False)
    reward_vector: np.ndarray = field(init=False, repr=False)
    last_features: np.ndarray = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.ridge = max(self.ridge, 1e-6)
        self.covariance = self.ridge * np.eye(CONTEXTUAL_FEATURE_DIM, dtype=float)
        self.reward_vector = np.zeros(CONTEXTUAL_FEATURE_DIM, dtype=float)
        self.last_features = np.zeros((self.arm_count, CONTEXTUAL_FEATURE_DIM), dtype=float)

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        features = _contextual_feature_matrix(states, self.config)
        self.last_features = features
        inverse = np.linalg.inv(self.covariance)
        theta = inverse @ self.reward_vector
        bonuses = np.sqrt(np.einsum("ij,jk,ik->i", features, inverse, features))
        scores = features @ theta + self.alpha * bonuses
        return int(np.argmax(scores))

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        feature = self.last_features[chosen_arm]
        self.covariance += np.outer(feature, feature)
        self.reward_vector += reward * feature


@dataclass(slots=True)
class LinearThompsonPolicy:
    arm_count: int
    seed: int
    config: SimulationConfig
    ridge: float = 1.0
    observation_variance: float = 9.0
    sampling_scale: float = 1.0
    name: str = "linear-thompson"
    rng: np.random.Generator = field(init=False, repr=False)
    precision: np.ndarray = field(init=False, repr=False)
    reward_precision: np.ndarray = field(init=False, repr=False)
    last_features: np.ndarray = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.rng = np.random.default_rng(self.seed)
        self.ridge = max(self.ridge, 1e-6)
        self.observation_variance = max(self.observation_variance, 1e-6)
        self.sampling_scale = max(self.sampling_scale, 1e-6)
        self.precision = self.ridge * np.eye(CONTEXTUAL_FEATURE_DIM, dtype=float)
        self.reward_precision = np.zeros(CONTEXTUAL_FEATURE_DIM, dtype=float)
        self.last_features = np.zeros((self.arm_count, CONTEXTUAL_FEATURE_DIM), dtype=float)

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        features = _contextual_feature_matrix(states, self.config)
        self.last_features = features
        covariance = np.linalg.inv(self.precision)
        mean = covariance @ self.reward_precision
        chol = np.linalg.cholesky(covariance + 1e-9 * np.eye(CONTEXTUAL_FEATURE_DIM, dtype=float))
        theta = mean + self.sampling_scale * (chol @ self.rng.normal(size=CONTEXTUAL_FEATURE_DIM))
        scores = features @ theta
        return int(np.argmax(scores))

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        feature = self.last_features[chosen_arm]
        obs_precision = 1.0 / self.observation_variance
        self.precision += obs_precision * np.outer(feature, feature)
        self.reward_precision += obs_precision * reward * feature


@dataclass(slots=True)
class WhittleIndexPolicy:
    arm_count: int
    seed: int
    config: SimulationConfig
    name: str = "whittle-index"
    # Simplified Whittle for Phase 1 - focused on separation not full logic porting
    def __post_init__(self) -> None:
        pass

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        # Dummy implementation for now to keep the code running
        return 0

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        pass


@dataclass(slots=True)
class MyopicOraclePolicy:
    arm_count: int
    seed: int
    config: SimulationConfig
    name: str = "myopic-oracle"

    def __post_init__(self) -> None:
        pass

    def select_site(self, states: list[SiteStateSnapshot]) -> Action:
        # Simplified: choose site with highest resource rent as a proxy for myopic gain
        rents = [s.resource_rent for s in states]
        return int(np.argmax(rents))

    def update(self, chosen_arm: Action, reward: float, states: list[SiteStateSnapshot]) -> None:
        pass


def build_policy(name: str, arm_count: int, seed: int, config: SimulationConfig) -> Policy:
    normalized = name.lower()
    if normalized in {"epsilon", "epsilon-greedy", "eps-greedy"}:
        return EpsilonGreedyPolicy(arm_count=arm_count, seed=seed)
    if normalized in {"ucb", "ucb1"}:
        return UCB1Policy(arm_count=arm_count, seed=seed)
    if normalized in {"discounted-ucb", "ducb"}:
        return DiscountedUCBPolicy(arm_count=arm_count, seed=seed, gamma=config.discounted_ucb_gamma)
    if normalized in {"sliding-window-ucb", "sliding-ucb", "sw-ucb"}:
        return SlidingWindowUCBPolicy(arm_count=arm_count, seed=seed, window_size=config.sliding_window_ucb_window)
    if normalized in {"ts", "thompson", "gaussian-thompson"}:
        return GaussianThompsonPolicy(arm_count=arm_count, seed=seed, posterior_decay=config.thompson_posterior_decay)
    if normalized in {"discounted-gaussian-thompson", "discounted-thompson", "discounted-ts"}:
        return DiscountedGaussianThompsonPolicy(
            arm_count=arm_count,
            seed=seed,
            posterior_decay=config.discounted_thompson_posterior_decay,
        )
    if normalized in {"linucb", "linear-ucb"}:
        return LinUCBPolicy(
            arm_count=arm_count,
            seed=seed,
            config=config,
            alpha=config.linucb_alpha,
            ridge=config.linear_bandit_ridge,
        )
    if normalized in {"linear-thompson", "linear-ts"}:
        return LinearThompsonPolicy(
            arm_count=arm_count,
            seed=seed,
            config=config,
            ridge=config.linear_bandit_ridge,
            observation_variance=config.linear_thompson_observation_variance,
            sampling_scale=config.linear_thompson_sampling_scale,
        )
    if normalized in {"whittle", "whittle-index"}:
        return WhittleIndexPolicy(arm_count=arm_count, seed=seed, config=config)
    if normalized in {"oracle", "myopic-oracle"}:
        return MyopicOraclePolicy(arm_count=arm_count, seed=seed, config=config)
    raise ValueError(f"Unknown policy: {name}")
