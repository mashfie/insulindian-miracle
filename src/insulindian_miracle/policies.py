from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
import math
from typing import Protocol

import numpy as np

from .model import SimulationConfig, SiteState, base_geography, compute_reward, network_bonus, sigmoid


class Policy(Protocol):
    name: str

    def select_arm(self, states: list[SiteState]) -> int:
        ...

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        ...


CONTEXTUAL_FEATURE_DIM = 11


def _contextual_feature_vector(index: int, states: list[SiteState], config: SimulationConfig) -> np.ndarray:
    state = states[index]
    return np.asarray(
        [
            1.0,
            base_geography(state.site, config),
            state.resource_rent,
            state.institution.extraction,
            state.institution.openness,
            state.institution.adaptability,
            state.productive_capital,
            math.log1p(max(state.population, 1)),
            min(max(network_bonus(index, states, config), 0.0), 3.0),
            float(state.site.boomtown),
            float(state.site.trade_cluster),
        ],
        dtype=float,
    )


def _contextual_feature_matrix(states: list[SiteState], config: SimulationConfig) -> np.ndarray:
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

    def select_arm(self, states: list[SiteState]) -> int:
        del states
        unseen = np.where(self.counts == 0)[0]
        if unseen.size:
            return int(unseen[0])
        if self.rng.random() < self.epsilon:
            return int(self.rng.integers(0, self.arm_count))
        return int(np.argmax(self.values))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del states
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
        del self.seed
        self.counts = np.zeros(self.arm_count, dtype=int)
        self.values = np.zeros(self.arm_count, dtype=float)
        self.steps = 0

    def select_arm(self, states: list[SiteState]) -> int:
        del states
        unseen = np.where(self.counts == 0)[0]
        if unseen.size:
            return int(unseen[0])
        bonus = np.sqrt((self.exploration * np.log(max(self.steps, 1))) / self.counts)
        return int(np.argmax(self.values + bonus))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del states
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

    def select_arm(self, states: list[SiteState]) -> int:
        del states
        unseen = np.where(self.counts < 0.5)[0]
        if unseen.size:
            return int(unseen[0])
        variances = np.maximum(1.0 / self.precisions, self.minimum_exploration_variance / np.sqrt(self.counts + 1.0))
        means = self.mean_precision / self.precisions
        draws = self.rng.normal(means, np.sqrt(variances))
        return int(np.argmax(draws))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del states
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
        del self.seed
        self.gamma = min(max(self.gamma, 0.0), 1.0)
        self.counts = np.zeros(self.arm_count, dtype=float)
        self.reward_sums = np.zeros(self.arm_count, dtype=float)
        self.total_mass = 0.0

    def select_arm(self, states: list[SiteState]) -> int:
        del states
        unseen = np.where(self.counts <= 1e-9)[0]
        if unseen.size:
            return int(unseen[0])
        means = self.reward_sums / np.maximum(self.counts, 1e-9)
        bonus = np.sqrt((self.exploration * np.log(self.total_mass + 1.0)) / np.maximum(self.counts, 1e-9))
        return int(np.argmax(means + bonus))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del states
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
    reward_windows: list[deque[float]] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        del self.seed
        self.window_size = max(1, int(self.window_size))
        self.reward_windows = [deque(maxlen=self.window_size) for _ in range(self.arm_count)]

    def select_arm(self, states: list[SiteState]) -> int:
        del states
        unseen = [index for index, window in enumerate(self.reward_windows) if not window]
        if unseen:
            return int(unseen[0])
        counts = np.asarray([len(window) for window in self.reward_windows], dtype=float)
        means = np.asarray([float(np.mean(window)) for window in self.reward_windows], dtype=float)
        total_mass = max(float(counts.sum()), 1.0)
        bonus = np.sqrt((self.exploration * np.log(total_mass + 1.0)) / np.maximum(counts, 1.0))
        return int(np.argmax(means + bonus))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del states
        self.reward_windows[chosen_arm].append(float(reward))


@dataclass(slots=True)
class DiscountedGaussianThompsonPolicy(GaussianThompsonPolicy):
    name: str = "discounted-gaussian-thompson"


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
        del self.seed
        self.ridge = max(self.ridge, 1e-6)
        self.covariance = self.ridge * np.eye(CONTEXTUAL_FEATURE_DIM, dtype=float)
        self.reward_vector = np.zeros(CONTEXTUAL_FEATURE_DIM, dtype=float)
        self.last_features = np.zeros((self.arm_count, CONTEXTUAL_FEATURE_DIM), dtype=float)

    def select_arm(self, states: list[SiteState]) -> int:
        features = _contextual_feature_matrix(states, self.config)
        self.last_features = features
        inverse = np.linalg.inv(self.covariance)
        theta = inverse @ self.reward_vector
        bonuses = np.sqrt(np.einsum("ij,jk,ik->i", features, inverse, features))
        scores = features @ theta + self.alpha * bonuses
        return int(np.argmax(scores))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del states
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

    def select_arm(self, states: list[SiteState]) -> int:
        features = _contextual_feature_matrix(states, self.config)
        self.last_features = features
        covariance = np.linalg.inv(self.precision)
        mean = covariance @ self.reward_precision
        chol = np.linalg.cholesky(covariance + 1e-9 * np.eye(CONTEXTUAL_FEATURE_DIM, dtype=float))
        theta = mean + self.sampling_scale * (chol @ self.rng.normal(size=CONTEXTUAL_FEATURE_DIM))
        scores = features @ theta
        return int(np.argmax(scores))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del states
        feature = self.last_features[chosen_arm]
        obs_precision = 1.0 / self.observation_variance
        self.precision += obs_precision * np.outer(feature, feature)
        self.reward_precision += obs_precision * reward * feature


@dataclass(slots=True)
class WhittleIndexPolicy:
    arm_count: int
    seed: int
    config: SimulationConfig
    population_bins: tuple[int, ...] = (1, 3, 6, 10, 16, 24)
    share_bins: tuple[float, ...] = (0.15, 0.35, 0.55, 0.75)
    capital_bins: tuple[float, ...] = (0.15, 0.35, 0.65, 1.0)
    legacy_bins: tuple[float, ...] = (0.05, 0.2, 0.45, 0.7)
    geography_bins: tuple[float, ...] = (0.12, 0.24, 0.36, 0.48, 0.62)
    network_reference_bins: tuple[float, ...] = (0.1, 0.3, 0.55, 0.85, 1.2)
    discount: float = 0.92
    rollout_horizon: int = 5
    subsidy_low: float = -6.0
    subsidy_high: float = 6.0
    subsidy_iterations: int = 10
    name: str = "whittle-index"
    index_cache: dict[tuple[float | int, ...], float] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        del self.seed
        self.index_cache = {}

    @staticmethod
    def _bin(value: float, boundaries: tuple[int, ...] | tuple[float, ...]) -> int:
        for index, boundary in enumerate(boundaries):
            if value <= boundary:
                return index
        return len(boundaries)

    @staticmethod
    def _representative_value(index: int, boundaries: tuple[float, ...], *, minimum: float = 0.0, maximum: float = 1.0) -> float:
        edges = (minimum, *boundaries, maximum)
        lower = edges[index]
        upper = edges[index + 1]
        if math.isclose(lower, upper):
            return lower
        return 0.5 * (lower + upper)

    def _population_value(self, index: int) -> float:
        representative = (1.0, 2.0, 4.5, 8.0, 13.0, 20.0, 30.0)
        return representative[min(index, len(representative) - 1)]

    @staticmethod
    def _clamp(value: float, minimum: float, maximum: float) -> float:
        return min(maximum, max(minimum, value))

    def _network_reference(self, index: int, states: list[SiteState]) -> float:
        state = states[index]
        denominator = max(
            state.institution.openness
            * (1.0 + self.config.network_population_gain * math.log1p(state.population))
            * (1.0 + self.config.network_capital_gain * state.productive_capital),
            1e-6,
        )
        return self._clamp(network_bonus(index, states, self.config) / denominator, 0.0, 1.6)

    def _state_key(self, index: int, states: list[SiteState]) -> tuple[int, ...]:
        return self._encode_state_key(self._observed_state(index, states))

    def _observed_state(self, index: int, states: list[SiteState]) -> dict[str, float]:
        state = states[index]
        return {
            "population": float(state.population),
            "extraction": float(state.institution.extraction),
            "openness": float(state.institution.openness),
            "adaptability": float(state.institution.adaptability),
            "resource": float(state.resource_rent),
            "capital": float(state.productive_capital),
            "legacy": float(state.shock_reform_stock),
            "geography": float(base_geography(state.site, self.config)),
            "network_reference": float(self._network_reference(index, states)),
            "boomtown": float(state.site.boomtown),
            "trade_cluster": float(state.site.trade_cluster),
        }

    def _decode_state_key(self, key: tuple[int, ...]) -> dict[str, float]:
        return {
            "population": self._population_value(key[0]),
            "extraction": self._representative_value(key[1], self.share_bins),
            "openness": self._representative_value(key[2], self.share_bins),
            "adaptability": self._representative_value(key[3], self.share_bins),
            "resource": self._representative_value(key[4], self.share_bins),
            "capital": self._representative_value(key[5], self.capital_bins, maximum=1.5),
            "legacy": self._representative_value(key[6], self.legacy_bins),
            "geography": self._representative_value(key[7], self.geography_bins, maximum=0.8),
            "network_reference": self._representative_value(key[8], self.network_reference_bins, maximum=1.6),
            "boomtown": float(key[9]),
            "trade_cluster": float(key[10]),
        }

    def _encode_state_key(self, state: dict[str, float]) -> tuple[int, ...]:
        return (
            self._bin(state["population"], self.population_bins),
            self._bin(state["extraction"], self.share_bins),
            self._bin(state["openness"], self.share_bins),
            self._bin(state["adaptability"], self.share_bins),
            self._bin(state["resource"], self.share_bins),
            self._bin(state["capital"], self.capital_bins),
            self._bin(state["legacy"], self.legacy_bins),
            self._bin(state["geography"], self.geography_bins),
            self._bin(state["network_reference"], self.network_reference_bins),
            int(state["boomtown"] > 0.5),
            int(state["trade_cluster"] > 0.5),
        )

    def _exact_state_key(self, state: dict[str, float]) -> tuple[float | int, ...]:
        return (
            round(state["population"], 2),
            round(state["extraction"], 3),
            round(state["openness"], 3),
            round(state["adaptability"], 3),
            round(state["resource"], 3),
            round(state["capital"], 3),
            round(state["legacy"], 3),
            round(state["geography"], 3),
            round(state["network_reference"], 3),
            int(state["boomtown"] > 0.5),
            int(state["trade_cluster"] > 0.5),
        )

    def _local_network(self, state: dict[str, float], population: float) -> float:
        return (
            state["network_reference"]
            * state["openness"]
            * (1.0 + self.config.network_population_gain * math.log1p(max(population, 1.0)))
            * (1.0 + self.config.network_capital_gain * state["capital"])
        )

    def _surrogate_reward(self, state: dict[str, float], *, active: bool) -> float:
        population = state["population"] + (1.0 if active else 0.0)
        extraction = state["extraction"]
        network = self._local_network(state, population)
        resource_payoff = state["resource"] * (
            self.config.resource_base_payoff + self.config.resource_capture_gain * extraction
        )
        extractive_cashflow = (
            self.config.extractive_cashflow_premium
            * state["resource"]
            * extraction
            * max(0.55, 1.0 - 0.2 * state["capital"])
        )
        inclusive = (1.0 - extraction) * math.pow(population, self.config.agglomeration_alpha) * (
            1.0 + self.config.inclusive_productivity_gain * state["capital"]
        )
        reinvestment_dividend = (
            self.config.inclusive_investment_gain
            * state["resource"]
            * (1.0 - extraction)
            * (0.45 + state["openness"] + 0.35 * state["capital"])
        )
        target_log = math.log1p(max(self.config.secondary_city_target, 1.0))
        spread = max(self.config.secondary_city_spread, 1e-3)
        mid_city_multiplier = math.exp(-((math.log1p(population) - target_log) ** 2) / (2.0 * spread * spread))
        secondary_city_dividend = self.config.secondary_city_bonus * network * mid_city_multiplier
        path_dependence_dividend = 0.12 * state["geography"] * math.log1p(population) * (
            0.6 + state["capital"] + 0.25 * state["network_reference"]
        )
        extractive_drag = extraction * self.config.extraction_drag * population
        congestion = self.config.congestion * population * population
        overstretch = max(0.0, population - self.config.metropolitan_overstretch_threshold)
        metropolitan_drag = self.config.metropolitan_overstretch_penalty * math.pow(overstretch, 1.35)
        reward = (
            state["geography"]
            + resource_payoff
            + extractive_cashflow
            + inclusive
            + reinvestment_dividend
            + secondary_city_dividend
            + path_dependence_dividend
            - extractive_drag
            - congestion
            - metropolitan_drag
            + network
        )
        if state["trade_cluster"] > 0.5:
            reward += 0.18 * network
        if state["boomtown"] > 0.5 and active:
            active_steps = max(population - 1.0, 0.0)
            if self.config.boomtown_bonus_duration > 0 and active_steps <= self.config.boomtown_bonus_duration:
                remaining_window = 1.0 - active_steps / max(self.config.boomtown_bonus_duration, 1)
                reward += self.config.boomtown_early_reward_bonus * max(remaining_window, 0.25)
            if active_steps > self.config.boomtown_collapse_threshold:
                reward -= self.config.boomtown_collapse_penalty * (active_steps - self.config.boomtown_collapse_threshold)
        return reward

    def _activity_load(self, population: float) -> float:
        active_steps = max(population - 1.0, 0.0)
        return max(0.0, (active_steps - self.config.active_decay_onset) / max(self.config.active_decay_onset, 1))

    def _transition(self, state: dict[str, float], *, active: bool) -> tuple[int, ...]:
        next_state = dict(state)
        next_state["population"] = self._clamp(state["population"] + (1.0 if active else 0.0), 1.0, 42.0)
        network = self._local_network(next_state, next_state["population"])
        reform_signal = sigmoid(
            1.35 * state["adaptability"]
            + 2.1 * state["legacy"]
            + 0.35 * (1.0 - state["resource"])
            + 0.25 * state["capital"]
            - 1.15 * state["extraction"]
        )
        if reform_signal > 0.58:
            next_state["extraction"] = self._clamp(
                state["extraction"] - self.config.reform_step * (0.65 + 0.7 * state["legacy"]),
                0.0,
                1.0,
            )
            next_state["openness"] = self._clamp(
                state["openness"]
                + 0.04
                + 0.06 * state["legacy"]
                + 0.02 * state["trade_cluster"],
                0.0,
                1.0,
            )
            next_state["capital"] = self._clamp(
                state["capital"] + 0.03 + 0.25 * self.config.shock_capital_rebuild * state["legacy"],
                0.0,
                1.5,
            )
            next_state["adaptability"] = self._clamp(state["adaptability"] + 0.03 * state["legacy"], 0.0, 1.0)
            if state["legacy"] > 0.0:
                next_state["legacy"] = self._clamp(
                    max(state["legacy"], 0.25 + 0.45 * reform_signal),
                    0.0,
                    1.0,
                )
        else:
            curse_modifier = max(
                0.1,
                1.0
                - self.config.curse_openness_buffer * state["openness"]
                - self.config.curse_capital_buffer * min(state["capital"], 1.5)
                - self.config.shock_transition_curse_buffer * state["legacy"]
                - self.config.shock_legacy_curse_buffer * state["legacy"],
            )
            next_state["extraction"] = self._clamp(
                state["extraction"]
                + self.config.resource_curse_strength * state["resource"] * curse_modifier * (1.0 - state["extraction"]),
                0.0,
                1.0,
            )

        if active:
            activity_load = self._activity_load(next_state["population"])
            legacy_brake = max(0.0, 1.0 - self.config.shock_legacy_extraction_brake * state["legacy"])
            next_state["extraction"] = self._clamp(
                next_state["extraction"]
                + self.config.active_extraction_pressure
                * legacy_brake
                * activity_load
                * state["resource"]
                * max(next_state["extraction"], 0.1)
                * (1.0 - next_state["extraction"]),
                0.0,
                1.0,
            )
            depletion_multiplier = max(1.0, self.config.boomtown_decay_multiplier) if state["boomtown"] > 0.5 else 1.0
            next_state["resource"] = self._clamp(
                state["resource"]
                * (
                    1.0
                    - self.config.active_resource_depletion
                    * depletion_multiplier
                    * activity_load
                    * state["resource"]
                    * (0.35 + next_state["extraction"])
                ),
                0.0,
                1.0,
            )
            next_state["openness"] = self._clamp(
                next_state["openness"]
                - self.config.active_openness_drag
                * legacy_brake
                * activity_load
                * next_state["extraction"],
                0.0,
                1.0,
            )
        else:
            next_state["resource"] = self._clamp(
                state["resource"] * (1.0 - 0.2 * self.config.depletion_rate * state["legacy"]),
                0.0,
                1.0,
            )

        next_state["extraction"] = self._clamp(
            next_state["extraction"] - self.config.shock_legacy_extraction_decay * state["legacy"],
            0.0,
            1.0,
        )
        next_state["openness"] = self._clamp(
            next_state["openness"] + self.config.shock_legacy_openness_gain * state["legacy"],
            0.0,
            1.0,
        )
        capital_investment = (
            0.22
            * self.config.inclusive_investment_gain
            * next_state["resource"]
            * (1.0 - next_state["extraction"])
            * (0.4 + next_state["openness"] + 0.2 * network)
        )
        capital_erosion = self.config.extractive_capital_erosion * next_state["extraction"] * (0.35 + next_state["resource"])
        if active:
            compounding_gain = (
                (0.015 + 0.04 * state["geography"])
                * (1.0 - next_state["extraction"])
                * (0.6 + state["trade_cluster"] + min(network, 1.5))
            )
            next_state["capital"] = self._clamp(next_state["capital"] + compounding_gain, 0.0, 1.5)
            next_state["openness"] = self._clamp(
                next_state["openness"] + 0.01 * state["geography"] * (1.0 - next_state["extraction"]),
                0.0,
                1.0,
            )
        else:
            passive_drag = 0.012 * max(next_state["extraction"] - next_state["openness"], 0.0)
            next_state["capital"] = self._clamp(next_state["capital"] - passive_drag, 0.0, 1.5)
            next_state["openness"] = self._clamp(next_state["openness"] - 0.5 * passive_drag, 0.0, 1.0)
        next_state["capital"] = self._clamp(
            next_state["capital"] + capital_investment + 0.01 * network - capital_erosion,
            0.0,
            1.5,
        )
        next_state["legacy"] = self._clamp(next_state["legacy"] - self.config.shock_legacy_fade, 0.0, 1.0)
        return self._encode_state_key(next_state)

    def _value(
        self,
        state_key: tuple[int, ...],
        depth: int,
        subsidy: float,
        cache: dict[tuple[tuple[int, ...], int, float], float],
    ) -> float:
        if depth <= 0:
            return 0.0
        subsidy_key = round(subsidy, 6)
        cache_key = (state_key, depth, subsidy_key)
        if cache_key in cache:
            return cache[cache_key]
        active_value, passive_value = self._action_values(state_key, subsidy, depth, cache)
        value = max(active_value, passive_value)
        cache[cache_key] = value
        return value

    def _action_values(
        self,
        state_key: tuple[int, ...],
        subsidy: float,
        depth: int,
        cache: dict[tuple[tuple[int, ...], int, float], float],
    ) -> tuple[float, float]:
        state = self._decode_state_key(state_key)
        active_reward = self._surrogate_reward(state, active=True)
        passive_reward = self._surrogate_reward(state, active=False) + subsidy
        if depth <= 1:
            return active_reward, passive_reward
        active_next = self._transition(state, active=True)
        passive_next = self._transition(state, active=False)
        active_value = active_reward + self.discount * self._value(active_next, depth - 1, subsidy, cache)
        passive_value = passive_reward + self.discount * self._value(passive_next, depth - 1, subsidy, cache)
        return active_value, passive_value

    def _root_action_values(
        self,
        index: int,
        states: list[SiteState],
        exact_state: dict[str, float],
        subsidy: float,
        cache: dict[tuple[tuple[int, ...], int, float], float],
    ) -> tuple[float, float]:
        current_reward = compute_reward(index, states, self.config)
        states[index].population += 1
        active_reward = compute_reward(index, states, self.config)
        states[index].population -= 1
        active_next = self._transition(exact_state, active=True)
        passive_next = self._transition(exact_state, active=False)
        active_value = active_reward + self.discount * self._value(active_next, self.rollout_horizon - 1, subsidy, cache)
        passive_value = current_reward + subsidy + self.discount * self._value(passive_next, self.rollout_horizon - 1, subsidy, cache)
        return active_value, passive_value

    def _compute_index(self, index: int, states: list[SiteState]) -> float:
        exact_state = self._observed_state(index, states)
        exact_key = self._exact_state_key(exact_state)
        cached = self.index_cache.get(exact_key)
        if cached is not None:
            return cached
        low = self.subsidy_low
        high = self.subsidy_high
        for _ in range(self.subsidy_iterations):
            mid = 0.5 * (low + high)
            cache: dict[tuple[tuple[int, ...], int, float], float] = {}
            active_value, passive_value = self._root_action_values(index, states, exact_state, mid, cache)
            if passive_value >= active_value:
                high = mid
            else:
                low = mid
        network_anchor = self._local_network(exact_state, exact_state["population"])
        core_premium = max(0.0, exact_state["geography"] - 0.38)
        spatial_anchor = (
            5.5 * math.pow(exact_state["geography"], 2.0)
            + 24.0 * core_premium * core_premium
            + 0.35 * network_anchor
            + 2.4 * math.pow(exact_state["geography"], 2.0) * math.log1p(exact_state["population"])
            + 0.04 * math.pow(math.log1p(exact_state["population"]), 2.0)
            - 0.04 * math.pow(max(0.0, exact_state["population"] - self.config.metropolitan_overstretch_threshold), 1.2)
        )
        index_value = 0.5 * (low + high) + spatial_anchor
        self.index_cache[exact_key] = index_value
        return index_value

    def select_arm(self, states: list[SiteState]) -> int:
        indices = [self._compute_index(index, states) for index in range(len(states))]
        return int(np.argmax(indices))

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del chosen_arm, reward, states


@dataclass(slots=True)
class MyopicOraclePolicy:
    arm_count: int
    seed: int
    config: SimulationConfig
    name: str = "myopic-oracle"

    def __post_init__(self) -> None:
        del self.seed

    def select_arm(self, states: list[SiteState]) -> int:
        best_arm = 0
        best_reward = float("-inf")
        for arm in range(min(self.arm_count, len(states))):
            states[arm].population += 1
            reward = compute_reward(arm, states, self.config)
            states[arm].population -= 1
            if reward > best_reward:
                best_arm = arm
                best_reward = reward
        return best_arm

    def update(self, chosen_arm: int, reward: float, states: list[SiteState]) -> None:
        del chosen_arm, reward, states


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
