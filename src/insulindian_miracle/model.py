from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
import math
from pathlib import Path
from typing import Any, TypeAlias

import numpy as np

from .terrain import Site, TerrainConfig


# Type alias for the decision-making action (choosing a site index for investment)
Action: TypeAlias = int


def sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


@dataclass(slots=True)
class InstitutionState:
    extraction: float
    openness: float
    adaptability: float
    reform_timer: int = 0


@dataclass(slots=True)
class SiteState:
    site: Site
    institution: InstitutionState
    resource_rent: float
    productive_capital: float = 0.0
    initial_productive_capital: float = 0.0
    population: int = 1
    population_momentum: float = 0.0
    last_reward: float = 0.0
    reward_delta: float = 0.0
    cumulative_reward: float = 0.0
    reforms_triggered: int = 0
    shock_hits: int = 0
    initial_resource_rent: float = 0.0
    initial_extraction: float = 0.0
    initial_openness: float = 0.0
    initial_adaptability: float = 0.0
    first_shock_step: int | None = None
    shock_memory: int = 0
    post_shock_timer: int = 0
    shock_reform_stock: float = 0.0
    shock_readiness: float = 0.0
    post_shock_persistence: float = 0.0

    def snapshot(self) -> SiteStateSnapshot:
        return SiteStateSnapshot(
            site_id=self.site.id,
            x=self.site.x,
            y=self.site.y,
            boomtown=self.site.boomtown,
            trade_cluster=self.site.trade_cluster,
            extraction=self.institution.extraction,
            openness=self.institution.openness,
            adaptability=self.institution.adaptability,
            resource_rent=self.resource_rent,
            productive_capital=self.productive_capital,
            population=self.population,
            shock_reform_stock=self.shock_reform_stock,
        )


@dataclass(frozen=True, slots=True)
class SiteStateSnapshot:
    """Immutable snapshot of a site's state for policy decision making."""
    site_id: int
    x: float
    y: float
    boomtown: bool
    trade_cluster: bool
    extraction: float
    openness: float
    adaptability: float
    resource_rent: float
    productive_capital: float
    population: int
    shock_reform_stock: float


@dataclass(slots=True)
class SimulationConfig:
    terrain: TerrainConfig = field(default_factory=TerrainConfig)
    horizon: int = 300
    num_sites: int = 15
    min_site_spacing: float = 0.12
    seed: int = 7
    initial_extraction_alpha: float = 2.0
    initial_extraction_beta: float = 5.0
    initial_extraction_resource_bias: float = 2.5
    initial_openness_alpha: float = 2.2
    initial_openness_beta: float = 2.2
    initial_adaptability_alpha: float = 3.0
    initial_adaptability_beta: float = 3.0
    agglomeration_alpha: float = 0.52
    extraction_drag: float = 0.08
    congestion: float = 0.003
    network_scale: float = 0.35
    network_population_gain: float = 0.12
    network_capital_gain: float = 0.45
    network_density_gain: float = 0.7
    resource_base_payoff: float = 0.2
    resource_capture_gain: float = 1.35
    extractive_cashflow_premium: float = 0.32
    resource_curse_strength: float = 0.04
    curse_openness_buffer: float = 0.35
    curse_capital_buffer: float = 0.25
    inclusive_investment_gain: float = 0.12
    inclusive_productivity_gain: float = 0.65
    extractive_capital_erosion: float = 0.045
    secondary_city_bonus: float = 0.75
    secondary_city_target: float = 16.0
    secondary_city_spread: float = 0.72
    metropolitan_overstretch_threshold: float = 22.0
    metropolitan_overstretch_penalty: float = 0.05
    endogenous_growth_rate: float = 0.0
    endogenous_growth_decay: float = 0.72
    endogenous_decline_rate: float = 0.0
    active_extraction_pressure: float = 0.0
    active_resource_depletion: float = 0.0
    active_openness_drag: float = 0.0
    active_decay_onset: int = 0
    trade_cluster_count: int = 0
    trade_cluster_radius: float = 0.18
    trade_cluster_openness_bonus: float = 0.0
    trade_cluster_capital_bonus: float = 0.0
    trade_cluster_accessibility_bonus: float = 0.0
    boomtown_count: int = 0
    boomtown_resource_bonus: float = 0.0
    boomtown_geography_penalty: float = 0.0
    boomtown_initial_extraction_boost: float = 0.0
    boomtown_early_reward_bonus: float = 0.0
    boomtown_bonus_duration: int = 0
    boomtown_collapse_penalty: float = 0.0
    boomtown_collapse_threshold: int = 0
    boomtown_decay_multiplier: float = 1.0
    thompson_posterior_decay: float = 0.995
    discounted_ucb_gamma: float = 0.97
    sliding_window_ucb_window: int = 40
    discounted_thompson_posterior_decay: float = 0.94
    linucb_alpha: float = 1.15
    linear_bandit_ridge: float = 1.0
    linear_thompson_observation_variance: float = 9.0
    linear_thompson_sampling_scale: float = 1.0
    reform_sensitivity: float = 3.0
    reform_step: float = 0.18
    reform_duration: int = 5
    reform_cost: float = 0.2
    shock_reform_memory: int = 0
    shock_reform_bonus: float = 0.0
    shock_reform_step_bonus: float = 0.0
    shock_openness_bonus: float = 0.0
    shock_capital_rebuild: float = 0.0
    shock_transition_duration: int = 0
    shock_transition_adaptability_bonus: float = 0.0
    shock_transition_curse_buffer: float = 0.0
    shock_transition_extraction_decay: float = 0.0
    shock_transition_extraction_cap: float = 1.0
    shock_transition_openness_gain: float = 0.0
    shock_transition_capital_gain: float = 0.0
    shock_legacy_fade: float = 0.0
    shock_legacy_adaptability_bonus: float = 0.0
    shock_legacy_curse_buffer: float = 0.0
    shock_legacy_extraction_decay: float = 0.0
    shock_legacy_extraction_brake: float = 0.0
    shock_legacy_openness_gain: float = 0.0
    shock_readiness_weight: float = 0.0
    shock_lock_in_bonus: float = 0.0
    shock_snapback_pressure: float = 0.0
    shock_probability: float = 0.0
    depletion_rate: float = 0.18
    shock_target_resource_bias: float = 0.0
    geography_weights: tuple[float, float, float, float, float] = (0.28, 0.18, 0.2, 0.16, 0.18)
    # Terrain Shaping
    spine_height: float = 0.9
    spine_curvature: float = 1.45
    taper_offset: float = 0.35
    taper_curvature_x: float = 0.45
    taper_bias_x: float = 0.15
    taper_linear_x: float = 0.55
    headland_height: float = 0.28
    headland_x: float = 0.45
    mainland_bridge_height: float = 0.22
    # Evolution Constants
    shock_readiness_base: float = 0.35
    shock_legacy_readiness_base: float = 0.25
    reform_openness_gain: float = 0.08
    reform_adaptability_gain: float = 0.35
    passive_investment_scale: float = 0.45
    network_openness_influence: float = 0.035
    growth_structural_weight: float = 0.9
    migration_threshold: float = 0.75
    lod: str = "LOW"
    run_id: int = 0

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "SimulationConfig":
        terrain_payload = payload.get("terrain", {})
        terrain = TerrainConfig(**terrain_payload)
        params = {key: value for key, value in payload.items() if key != "terrain"}
        if "geography_weights" in params:
            params["geography_weights"] = tuple(params["geography_weights"])
        return cls(terrain=terrain, **params)

    @classmethod
    def from_path(cls, path: str | Path) -> "SimulationConfig":
        with Path(path).open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return cls.from_dict(payload)


@dataclass(slots=True)
class Observation:
    step: int
    site_id: int
    reward: float
    cumulative_reward: float


@dataclass(slots=True)
class SiteOutcome:
    site_id: int
    x: float
    y: float
    boomtown: bool
    trade_cluster: bool
    geography: float
    suitability: float
    resource_rent: float
    final_resource_rent: float
    productive_capital: float
    initial_productive_capital: float
    initial_extraction: float
    final_extraction: float
    initial_openness: float
    final_openness: float
    initial_adaptability: float
    final_adaptability: float
    shock_readiness: float
    post_shock_persistence: float
    final_population: int
    cumulative_reward: float
    selection_count: int
    reforms_triggered: int
    shock_hits: int
    first_shock_step: int | None


@dataclass(slots=True)
class SimulationResult:
    policy: str
    seed: int
    cumulative_reward: float
    selected_sites: list[int]
    reward_history: list[float]
    population_by_site: dict[int, int]
    final_extraction_by_site: dict[int, float]
    final_openness_by_site: dict[int, float]
    site_outcomes: list[SiteOutcome]
    metrics: dict[str, float]
    terrain_summary: dict[str, float]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class EvolveReport:
    rewards: list[float]
    shock_site: int | None = None


class Simulation:
    def __init__(self, config: SimulationConfig, sites: list[Site]):
        self.config = config
        self.rng = np.random.default_rng(config.seed)
        self.states = initialize_site_states(sites, config, self.rng)
        self.step = 0
        self.cumulative_reward = 0.0
        self.selected_sites: list[int] = []
        self.reward_history: list[float] = []
        
        # Performance Caching
        self.geographies = np.fromiter((base_geography(s.site, config) for s in self.states), dtype=float)
        
        n = len(self.states)
        xs = np.fromiter((s.site.x for s in self.states), dtype=float)
        ys = np.fromiter((s.site.y for s in self.states), dtype=float)
        dx = xs[:, np.newaxis] - xs[np.newaxis, :]
        dy = ys[:, np.newaxis] - ys[np.newaxis, :]
        dist = np.sqrt(dx * dx + dy * dy)
        np.clip(dist, 1e-6, None, out=dist)
        self.decay_matrix = np.exp(-dist / config.network_scale)
        np.fill_diagonal(self.decay_matrix, 0.0)

    def run_step(self, action: int) -> float:
        """Advance the simulation by one step given an action (site index)."""
        if action < 0 or action >= len(self.states):
            raise ValueError(f"Action {action} is out of bounds for {len(self.states)} sites.")

        self.states[action].population += 1
        evolve_report = evolve_sites(
            self.states, 
            self.config, 
            self.rng, 
            active_site=action, 
            step=self.step,
            decay_matrix=self.decay_matrix,
            geographies=self.geographies
        )
        reward = float(evolve_report.rewards[action])

        self.selected_sites.append(action)
        self.reward_history.append(reward)
        self.cumulative_reward += reward
        self.step += 1

        return reward


def initialize_site_states(sites: list[Site], config: SimulationConfig, rng: np.random.Generator) -> list[SiteState]:
    states: list[SiteState] = []
    for site in sites:
        extraction_bias = config.initial_extraction_resource_bias * site.resource_rent
        extraction_alpha = max(0.1, config.initial_extraction_alpha + extraction_bias)
        extraction_beta = max(0.1, config.initial_extraction_beta - extraction_bias)
        extraction = float(rng.beta(extraction_alpha, extraction_beta))
        extraction = min(1.0, extraction + site.boomtown_initial_extraction_boost)
        openness = float(rng.beta(config.initial_openness_alpha, config.initial_openness_beta))
        openness = min(1.0, openness + site.trade_cluster_openness_bonus)
        adaptability = float(rng.beta(config.initial_adaptability_alpha, config.initial_adaptability_beta))
        if site.trade_cluster:
            adaptability = min(1.0, adaptability + 0.35 * site.trade_cluster_openness_bonus)
        productive_capital = min(
            1.5,
            0.04 + 0.08 * (site.port_access + site.river_access + site.accessibility) + site.trade_cluster_capital_bonus,
        )
        states.append(
            SiteState(
                site=site,
                institution=InstitutionState(extraction=extraction, openness=openness, adaptability=adaptability),
                resource_rent=site.resource_rent,
                productive_capital=productive_capital,
                initial_productive_capital=productive_capital,
                initial_resource_rent=site.resource_rent,
                initial_extraction=extraction,
                initial_openness=openness,
                initial_adaptability=adaptability,
                shock_readiness=institutional_readiness(
                    extraction=extraction,
                    openness=openness,
                    adaptability=adaptability,
                    productive_capital=productive_capital,
                ),
            )
        )
    return states


def institutional_readiness(
    *,
    extraction: float,
    openness: float,
    adaptability: float,
    productive_capital: float,
) -> float:
    capital_scale = min(max(productive_capital / 1.5, 0.0), 1.0)
    # These weights are still somewhat fixed, but we could parameterize them if needed.
    # For now, keeping them as is but using capital_scale.
    readiness = (
        0.28 * (1.0 - extraction)
        + 0.28 * openness
        + 0.26 * adaptability
        + 0.18 * capital_scale
    )
    return min(1.0, max(0.0, readiness))


def base_geography(site: Site, config: SimulationConfig) -> float:
    weights = config.geography_weights
    return (
        weights[0] * site.port_access
        + weights[1] * site.river_access
        + weights[2] * site.arability
        + weights[3] * site.defensibility
        + weights[4] * site.accessibility
    )


def site_distance(left: Site, right: Site) -> float:
    return math.hypot(left.x - right.x, left.y - right.y)


def calculate_all_network_bonuses(
    states: list[SiteState], config: SimulationConfig, decay_matrix: np.ndarray | None = None
) -> np.ndarray:
    n = len(states)
    if n <= 1:
        return np.zeros(n)

    openness = np.fromiter((s.institution.openness for s in states), dtype=float)
    populations = np.fromiter((s.population for s in states), dtype=float)
    capitals = np.fromiter((s.productive_capital for s in states), dtype=float)

    if decay_matrix is None:
        xs = np.fromiter((s.site.x for s in states), dtype=float)
        ys = np.fromiter((s.site.y for s in states), dtype=float)
        dx = xs[:, np.newaxis] - xs[np.newaxis, :]
        dy = ys[:, np.newaxis] - ys[np.newaxis, :]
        dist = np.sqrt(dx * dx + dy * dy)
        np.clip(dist, 1e-6, None, out=dist)

        decay_matrix = np.exp(-dist / config.network_scale)
        np.fill_diagonal(decay_matrix, 0.0)

    partner_scale = (
        openness
        * (1.0 + config.network_population_gain * np.log1p(populations))
        * (1.0 + config.network_capital_gain * capitals)
    )

    trade_mass = decay_matrix @ partner_scale
    weight_sum = decay_matrix.sum(axis=1)

    valid_mask = weight_sum > 1e-9
    local_density = np.zeros(n)
    local_market = np.zeros(n)
    local_density[valid_mask] = weight_sum[valid_mask] / (n - 1)
    local_market[valid_mask] = trade_mass[valid_mask] / weight_sum[valid_mask]

    return openness * local_market * (1.0 + config.network_density_gain * local_density)


def compute_all_rewards(
    states: list[SiteState],
    config: SimulationConfig,
    bonuses: np.ndarray,
    geographies: np.ndarray | None = None,
) -> np.ndarray:
    n = len(states)
    extractions = np.fromiter((s.institution.extraction for s in states), dtype=float)
    openness = np.fromiter((s.institution.openness for s in states), dtype=float)
    populations = np.fromiter((max(s.population, 1) for s in states), dtype=float)
    resource_rents = np.fromiter((s.resource_rent for s in states), dtype=float)
    capitals = np.fromiter((s.productive_capital for s in states), dtype=float)
    active_steps = np.maximum(populations - 1, 0)
    reform_timers = np.fromiter((s.institution.reform_timer for s in states), dtype=int)

    if geographies is None:
        geographies = np.fromiter((base_geography(s.site, config) for s in states), dtype=float)

    resource_payoff = resource_rents * (config.resource_base_payoff + config.resource_capture_gain * extractions)
    extractive_cashflow = (
        config.extractive_cashflow_premium
        * resource_rents
        * extractions
        * np.maximum(0.55, 1.0 - 0.2 * capitals)
    )
    inclusive = (1.0 - extractions) * np.power(populations, config.agglomeration_alpha) * (
        1.0 + config.inclusive_productivity_gain * capitals
    )
    reinvestment_dividend = config.inclusive_investment_gain * resource_rents * (1.0 - extractions) * (
        0.45 + openness + 0.35 * capitals
    )

    target_log = math.log1p(max(config.secondary_city_target, 1.0))
    spread = max(config.secondary_city_spread, 1e-3)
    mid_city_multiplier = np.exp(-((np.log1p(populations) - target_log) ** 2) / (2.0 * spread * spread))
    secondary_city_dividend = config.secondary_city_bonus * bonuses * mid_city_multiplier

    extractive_drag = extractions * config.extraction_drag * populations
    congestion = config.congestion * populations * populations
    overstretch = np.maximum(0.0, populations - config.metropolitan_overstretch_threshold)
    metropolitan_drag = config.metropolitan_overstretch_penalty * np.power(overstretch, 1.35)
    reform_cost = np.where(reform_timers > 0, config.reform_cost, 0.0)

    boomtown_bonus = np.zeros(n)
    is_boomtown = np.fromiter((s.site.boomtown for s in states), dtype=bool)
    boomtown_duration = np.fromiter((s.site.boomtown_bonus_duration for s in states), dtype=int)
    boomtown_reward_bonus = np.fromiter((s.site.boomtown_reward_bonus for s in states), dtype=float)

    mask_bt = is_boomtown & (boomtown_duration > 0) & (active_steps <= boomtown_duration)
    if np.any(mask_bt):
        rem = 1.0 - (active_steps[mask_bt] / np.maximum(boomtown_duration[mask_bt], 1))
        boomtown_bonus[mask_bt] = boomtown_reward_bonus[mask_bt] * np.maximum(rem, 0.25)

    collapse_penalty = np.zeros(n)
    bt_threshold = np.fromiter((s.site.boomtown_collapse_threshold for s in states), dtype=int)
    bt_penalty = np.fromiter((s.site.boomtown_collapse_penalty for s in states), dtype=float)
    mask_coll = is_boomtown & (active_steps > bt_threshold)
    if np.any(mask_coll):
        overflow = active_steps[mask_coll] - bt_threshold[mask_coll]
        collapse_penalty[mask_coll] = bt_penalty[mask_coll] * overflow

    rewards = (
        geographies
        + resource_payoff
        + extractive_cashflow
        + inclusive
        + reinvestment_dividend
        + secondary_city_dividend
        - extractive_drag
        - congestion
        - metropolitan_drag
        + bonuses
        - reform_cost
        + boomtown_bonus
        - collapse_penalty
    )
    return rewards


def network_bonus(index: int, states: list[SiteState], config: SimulationConfig) -> float:
    state = states[index]
    if len(states) <= 1:
        return 0.0
    trade_mass = 0.0
    weight_sum = 0.0
    for other_index, other in enumerate(states):
        if other_index == index:
            continue
        distance = max(site_distance(state.site, other.site), 1e-6)
        decay = math.exp(-distance / config.network_scale)
        partner_scale = (
            other.institution.openness
            * (1.0 + config.network_population_gain * math.log1p(other.population))
            * (1.0 + config.network_capital_gain * other.productive_capital)
        )
        trade_mass += partner_scale * decay
        weight_sum += decay
    if math.isclose(weight_sum, 0.0):
        return 0.0
    local_density = weight_sum / (len(states) - 1)
    local_market = trade_mass / weight_sum
    return state.institution.openness * local_market * (1.0 + config.network_density_gain * local_density)


def compute_reward(index: int, states: list[SiteState], config: SimulationConfig, network: float | None = None) -> float:
    state = states[index]
    institution = state.institution
    population = max(state.population, 1)
    active_steps = max(population - 1, 0)

    if network is None:
        network = network_bonus(index, states, config)
    resource_payoff = state.resource_rent * (config.resource_base_payoff + config.resource_capture_gain * institution.extraction)
    extractive_cashflow = (
        config.extractive_cashflow_premium
        * state.resource_rent
        * institution.extraction
        * max(0.55, 1.0 - 0.2 * state.productive_capital)
    )
    inclusive = (1.0 - institution.extraction) * math.pow(population, config.agglomeration_alpha) * (
        1.0 + config.inclusive_productivity_gain * state.productive_capital
    )
    reinvestment_dividend = config.inclusive_investment_gain * state.resource_rent * (1.0 - institution.extraction) * (
        0.45 + institution.openness + 0.35 * state.productive_capital
    )
    target_log = math.log1p(max(config.secondary_city_target, 1.0))
    spread = max(config.secondary_city_spread, 1e-3)
    mid_city_multiplier = math.exp(-((math.log1p(population) - target_log) ** 2) / (2.0 * spread * spread))
    secondary_city_dividend = config.secondary_city_bonus * network * mid_city_multiplier
    extractive_drag = institution.extraction * config.extraction_drag * population
    congestion = config.congestion * population * population
    overstretch = max(0.0, population - config.metropolitan_overstretch_threshold)
    metropolitan_drag = config.metropolitan_overstretch_penalty * math.pow(overstretch, 1.35)
    reform_cost = config.reform_cost if institution.reform_timer > 0 else 0.0
    boomtown_bonus = 0.0
    if state.site.boomtown and state.site.boomtown_bonus_duration > 0 and active_steps <= state.site.boomtown_bonus_duration:
        remaining_window = 1.0 - (active_steps / max(state.site.boomtown_bonus_duration, 1))
        boomtown_bonus += state.site.boomtown_reward_bonus * max(remaining_window, 0.25)

    collapse_penalty = 0.0
    if state.site.boomtown and active_steps > state.site.boomtown_collapse_threshold:
        overflow = active_steps - state.site.boomtown_collapse_threshold
        collapse_penalty = state.site.boomtown_collapse_penalty * overflow

    reward = (
        base_geography(state.site, config)
        + resource_payoff
        + extractive_cashflow
        + inclusive
        + reinvestment_dividend
        + secondary_city_dividend
        - extractive_drag
        - congestion
        - metropolitan_drag
        + network
        - reform_cost
        + boomtown_bonus
        - collapse_penalty
    )
    return reward


def _choose_shock_target(states: list[SiteState], config: SimulationConfig, rng: np.random.Generator) -> int:
    if not states:
        raise ValueError("cannot choose shock target from empty states")
    if config.shock_target_resource_bias <= 0.0:
        return int(rng.integers(0, len(states)))

    weights = np.asarray(
        [
            math.pow(max(state.resource_rent, 1e-6), 1.0 + config.shock_target_resource_bias)
            for state in states
        ],
        dtype=float,
    )
    total = float(weights.sum())
    if math.isclose(total, 0.0):
        return int(rng.integers(0, len(states)))
    weights /= total
    return int(rng.choice(len(states), p=weights))


def evolve_sites(
    states: list[SiteState],
    config: SimulationConfig,
    rng: np.random.Generator,
    active_site: int | None = None,
    step: int | None = None,
    decay_matrix: np.ndarray | None = None,
    geographies: np.ndarray | None = None,
) -> EvolveReport:
    bonuses = calculate_all_network_bonuses(states, config, decay_matrix=decay_matrix)
    rewards = compute_all_rewards(states, config, bonuses, geographies=geographies)
    mean_reward = float(np.mean(rewards)) if rewards.size > 0 else 0.0
    reward_scale = max(float(np.std(rewards)), 1.0)
    target_log = math.log1p(max(config.secondary_city_target, 1.0))
    spread = max(config.secondary_city_spread * 1.2, 1e-3)
    for index, state in enumerate(states):
        reward = float(rewards[index])
        delta = reward - state.last_reward
        institution = state.institution
        network = bonuses[index]
        if state.shock_memory > 0:
            state.shock_memory -= 1
        legacy_factor = state.shock_reform_stock
        transition_factor = (
            state.post_shock_timer / max(config.shock_transition_duration, 1)
            if config.shock_transition_duration > 0 and state.post_shock_timer > 0
            else 0.0
        )
        readiness = state.shock_readiness if state.first_shock_step is not None else institutional_readiness(
            extraction=institution.extraction,
            openness=institution.openness,
            adaptability=institution.adaptability,
            productive_capital=state.productive_capital,
        )
        readiness_scale = (
            config.shock_readiness_base + config.shock_readiness_weight * readiness
            if config.shock_readiness_weight > 0.0
            else 1.0
        )
        transition_support = transition_factor * readiness_scale
        legacy_support = legacy_factor * (
            config.shock_legacy_readiness_base + config.shock_readiness_weight * readiness
            if config.shock_readiness_weight > 0.0
            else 1.0
        )
        effective_adaptability = min(
            1.0,
            institution.adaptability
            + config.shock_transition_adaptability_bonus * transition_support
            + config.shock_legacy_adaptability_bonus * legacy_support,
        )

        if institution.reform_timer == 0:
            shock_factor = state.shock_memory / max(config.shock_reform_memory, 1) if config.shock_reform_memory > 0 else 0.0
            crisis_pressure = sigmoid(
                (-delta) * config.reform_sensitivity
                + config.shock_reform_bonus * shock_factor
                + 2.0 * transition_factor
                + legacy_factor
            )
            reform_probability = min(1.0, effective_adaptability * crisis_pressure)
            if rng.random() < reform_probability:
                reform_scale = 1.0 + config.shock_reform_step_bonus * shock_factor
                institution.extraction = max(0.0, institution.extraction - config.reform_step * reform_scale)
                institution.openness = min(1.0, institution.openness + config.reform_openness_gain + config.shock_openness_bonus * shock_factor)
                institution.reform_timer = config.reform_duration
                state.reforms_triggered += 1
                state.productive_capital = min(1.5, state.productive_capital + config.shock_capital_rebuild * shock_factor)
                if shock_factor > 0.0 or transition_factor > 0.0:
                    state.shock_reform_stock = min(
                        1.0,
                        max(
                            state.shock_reform_stock,
                            config.reform_openness_gain + 0.75 * readiness * max(shock_factor, transition_factor),
                        ),
                    )
            else:
                curse_modifier = max(
                    0.1,
                    1.0
                    - config.curse_openness_buffer * institution.openness
                    - config.curse_capital_buffer * min(state.productive_capital, 1.5)
                    - config.shock_transition_curse_buffer * transition_support
                    - config.shock_legacy_curse_buffer * legacy_support
                )
                institution.extraction = min(
                    1.0,
                    institution.extraction
                    + config.resource_curse_strength * state.resource_rent * curse_modifier * (1.0 - institution.extraction),
                )
        else:
            institution.reform_timer -= 1

        if transition_factor > 0.0:
            institution.extraction = max(0.0, institution.extraction - config.shock_transition_extraction_decay * transition_support)
            extraction_cap = 1.0 - (1.0 - config.shock_transition_extraction_cap) * min(transition_support, 1.0)
            institution.extraction = min(institution.extraction, extraction_cap)
            institution.openness = min(
                1.0,
                institution.openness
                + (config.shock_transition_openness_gain + 0.45 * config.shock_lock_in_bonus * readiness) * transition_support,
            )
            state.productive_capital = min(
                1.5,
                state.productive_capital
                + (config.shock_transition_capital_gain + 0.6 * config.shock_lock_in_bonus * readiness) * transition_support,
            )
            state.post_shock_timer -= 1
        if legacy_factor > 0.0:
            institution.extraction = max(0.0, institution.extraction - config.shock_legacy_extraction_decay * legacy_support)
            institution.openness = min(
                1.0,
                institution.openness + (config.shock_legacy_openness_gain + 0.25 * config.shock_lock_in_bonus * readiness) * legacy_support,
            )

        capital_investment = 0.25 * config.inclusive_investment_gain * state.resource_rent * (1.0 - institution.extraction) * (
            0.4 + institution.openness + 0.25 * network
        )
        capital_erosion = config.extractive_capital_erosion * institution.extraction * (0.35 + state.resource_rent)
        passive_scale = 1.0 if active_site is not None and index == active_site else config.passive_investment_scale
        state.productive_capital = min(
            1.5,
            max(0.0, state.productive_capital + passive_scale * capital_investment + 0.015 * network - capital_erosion),
        )

        if active_site is not None and index == active_site:
            active_steps = max(0, state.population - 1)
            activity_load = max(0.0, (active_steps - config.active_decay_onset) / max(config.active_decay_onset, 1))
            if state.site.boomtown:
                activity_load *= state.site.boomtown_decay_multiplier
            transition_brake = max(0.0, 1.0 - 1.5 * min(transition_support, 1.0))
            legacy_brake = max(0.0, 1.0 - config.shock_legacy_extraction_brake * legacy_support)
            extraction_pressure = (
                config.active_extraction_pressure
                * transition_brake
                * legacy_brake
                * activity_load
                * state.resource_rent
                * max(institution.extraction, 0.1)
                * (1.0 - institution.extraction)
            )
            institution.extraction = min(1.0, institution.extraction + extraction_pressure)
            if transition_factor > 0.0:
                institution.extraction = min(institution.extraction, extraction_cap)
            depletion_pressure = (
                config.active_resource_depletion
                * (0.6 + 0.4 * transition_brake)
                * activity_load
                * state.resource_rent
                * (0.35 + institution.extraction)
            )
            state.resource_rent = max(0.0, state.resource_rent * (1.0 - depletion_pressure))
            institution.openness = max(
                0.0,
                institution.openness - config.active_openness_drag * transition_brake * activity_load * institution.extraction,
            )

        if state.first_shock_step is not None and transition_factor <= 0.0:
            lock_in = config.shock_lock_in_bonus * readiness * min(state.productive_capital, 1.0)
            snapback = config.shock_snapback_pressure * (1.0 - readiness) * state.resource_rent * (1.0 - institution.openness)
            institution.extraction = min(1.0, max(0.0, institution.extraction + snapback - lock_in))
            institution.openness = min(1.0, max(0.0, institution.openness + 0.35 * lock_in - 0.15 * snapback))

        institution.openness = min(1.0, max(0.0, institution.openness + config.network_openness_influence * (network - institution.openness)))
        reward_signal = (reward - mean_reward) / reward_scale
        mid_city_signal = math.exp(-((math.log1p(max(state.population, 1)) - target_log) ** 2) / (2.0 * spread * spread))
        overstretch_ratio = max(0.0, state.population - config.metropolitan_overstretch_threshold) / max(
            config.metropolitan_overstretch_threshold,
            1.0,
        )
        structural_signal = base_geography(state.site, config) + 0.45 * network + 0.35 * state.productive_capital
        growth_signal = reward_signal + config.growth_structural_weight * (structural_signal - 0.75) + 0.45 * (mid_city_signal - 0.35)
        momentum_delta = config.endogenous_growth_rate * growth_signal - config.endogenous_decline_rate * overstretch_ratio
        state.population_momentum = config.endogenous_growth_decay * state.population_momentum + momentum_delta
        if legacy_factor > 0.0 and config.shock_legacy_fade > 0.0:
            state.shock_reform_stock = max(0.0, state.shock_reform_stock - config.shock_legacy_fade)
        if state.first_shock_step is not None and institution.extraction < state.initial_extraction:
            state.post_shock_persistence += 1.0
        state.reward_delta = delta
        state.last_reward = reward
        state.cumulative_reward += reward

    donor_candidates = [index for index, state in enumerate(states) if state.population > 1]
    if donor_candidates:
        recipient = max(range(len(states)), key=lambda idx: states[idx].population_momentum)
        donor = min(donor_candidates, key=lambda idx: states[idx].population_momentum)
        migration_threshold = config.migration_threshold
        if (
            recipient != donor
            and states[recipient].population_momentum >= migration_threshold
            and states[donor].population_momentum <= -migration_threshold
        ):
            states[recipient].population += 1
            states[recipient].population_momentum -= migration_threshold
            states[donor].population -= 1
            states[donor].population_momentum += migration_threshold

    shock_site: int | None = None
    if config.shock_probability > 0 and rng.random() < config.shock_probability:
        choice = _choose_shock_target(states, config, rng)
        states[choice].resource_rent = max(0.0, states[choice].resource_rent * (1.0 - config.depletion_rate))
        states[choice].productive_capital = max(0.0, states[choice].productive_capital - 0.3 * config.depletion_rate)
        states[choice].shock_hits += 1
        if states[choice].first_shock_step is None:
            states[choice].first_shock_step = step
        states[choice].shock_memory = max(states[choice].shock_memory, config.shock_reform_memory)
        states[choice].post_shock_timer = max(states[choice].post_shock_timer, config.shock_transition_duration)
        if config.shock_reform_bonus > 0.0:
            shock_reformer = states[choice]
            readiness = shock_reformer.shock_readiness
            impulse = readiness
            if impulse > 0.0:
                shock_reformer.institution.adaptability = min(
                    1.0,
                    shock_reformer.institution.adaptability + 0.35 * config.shock_transition_adaptability_bonus * impulse,
                )
                shock_reformer.shock_reform_stock = min(
                    1.0,
                    max(shock_reformer.shock_reform_stock, 0.08 + 0.82 * impulse),
                )
                shock_reformer.institution.extraction = max(
                    0.0,
                    shock_reformer.institution.extraction
                    - 0.45 * config.reform_step * (1.0 + config.shock_reform_step_bonus) * (0.25 + impulse)
                    - 0.5 * config.shock_transition_extraction_decay * impulse,
                )
                shock_reformer.institution.openness = min(
                    1.0,
                    shock_reformer.institution.openness + config.shock_openness_bonus * impulse,
                )
                shock_reformer.productive_capital = min(
                    1.5,
                    shock_reformer.productive_capital + config.shock_capital_rebuild * impulse,
                )
                shock_reformer.reforms_triggered += 1
                shock_reformer.institution.reform_timer = max(
                    shock_reformer.institution.reform_timer,
                    max(1, config.reform_duration // 2),
                )
        shock_site = choice

    return EvolveReport(rewards=rewards, shock_site=shock_site)
