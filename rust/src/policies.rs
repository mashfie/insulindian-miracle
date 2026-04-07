use crate::snapshot_physics::network_bonus_snapshot;
use crate::types::{SimulationConfig, SiteStateSnapshot};
use ndarray::Array1;
use rand::Rng;
use rand_distr::{Normal, Distribution};
use std::collections::VecDeque;

pub trait Policy {
    fn select_site(&mut self, states: &[SiteStateSnapshot]) -> usize;
    fn update(&mut self, chosen_arm: usize, reward: f64, states: &[SiteStateSnapshot]);
    fn wants_snapshots(&self) -> bool { false }
}

pub struct EpsilonGreedyPolicy<R: Rng> {
    arm_count: usize,
    rng: R,
    epsilon: f64,
    counts: Array1<usize>,
    values: Array1<f64>,
}

impl<R: Rng> EpsilonGreedyPolicy<R> {
    pub fn new(arm_count: usize, rng: R, epsilon: f64) -> Self {
        Self {
            arm_count,
            rng,
            epsilon,
            counts: Array1::zeros(arm_count),
            values: Array1::zeros(arm_count),
        }
    }
}

impl<R: Rng> Policy for EpsilonGreedyPolicy<R> {
    fn select_site(&mut self, _states: &[SiteStateSnapshot]) -> usize {
        for i in 0..self.arm_count {
            if self.counts[i] == 0 {
                return i;
            }
        }
        if self.rng.gen::<f64>() < self.epsilon {
            self.rng.gen_range(0..self.arm_count)
        } else {
            let mut best_arm = 0;
            let mut best_val = f64::NEG_INFINITY;
            for i in 0..self.arm_count {
                if self.values[i] > best_val {
                    best_val = self.values[i];
                    best_arm = i;
                }
            }
            best_arm
        }
    }

    fn update(&mut self, chosen_arm: usize, reward: f64, _states: &[SiteStateSnapshot]) {
        self.counts[chosen_arm] += 1;
        let count = self.counts[chosen_arm] as f64;
        self.values[chosen_arm] += (reward - self.values[chosen_arm]) / count;
    }
}

pub struct UCB1Policy {
    arm_count: usize,
    exploration: f64,
    counts: Array1<usize>,
    values: Array1<f64>,
    steps: usize,
}

impl UCB1Policy {
    pub fn new(arm_count: usize, exploration: f64) -> Self {
        Self {
            arm_count,
            exploration,
            counts: Array1::zeros(arm_count),
            values: Array1::zeros(arm_count),
            steps: 0,
        }
    }
}

impl Policy for UCB1Policy {
    fn select_site(&mut self, _states: &[SiteStateSnapshot]) -> usize {
        for i in 0..self.arm_count {
            if self.counts[i] == 0 {
                return i;
            }
        }
        
        let mut best_arm = 0;
        let mut best_val = f64::NEG_INFINITY;
        let log_steps = (self.steps.max(1) as f64).ln();
        
        for i in 0..self.arm_count {
            let bonus = (self.exploration * log_steps / self.counts[i] as f64).sqrt();
            let score = self.values[i] + bonus;
            if score > best_val {
                best_val = score;
                best_arm = i;
            }
        }
        best_arm
    }

    fn update(&mut self, chosen_arm: usize, reward: f64, _states: &[SiteStateSnapshot]) {
        self.steps += 1;
        self.counts[chosen_arm] += 1;
        let count = self.counts[chosen_arm] as f64;
        self.values[chosen_arm] += (reward - self.values[chosen_arm]) / count;
    }
}

pub struct GaussianThompsonPolicy<R: Rng> {
    arm_count: usize,
    rng: R,
    observation_variance: f64,
    prior_precision: f64,
    prior_mean_precision: f64,
    posterior_decay: f64,
    minimum_exploration_variance: f64,
    precisions: Array1<f64>,
    mean_precision: Array1<f64>,
    counts: Array1<f64>,
    observed: Array1<bool>,
    discounted: bool,
}

impl<R: Rng> GaussianThompsonPolicy<R> {
    pub fn new(
        arm_count: usize,
        rng: R,
        observation_variance: f64,
        prior_mean: f64,
        prior_variance: f64,
        posterior_decay: f64,
        minimum_exploration_variance: f64,
        discounted: bool,
    ) -> Self {
        let prior_precision = 1.0 / prior_variance;
        let prior_mean_precision = prior_mean / prior_variance;
        
        Self {
            arm_count,
            rng,
            observation_variance,
            prior_precision,
            prior_mean_precision,
            posterior_decay,
            minimum_exploration_variance,
            precisions: Array1::from_elem(arm_count, prior_precision),
            mean_precision: Array1::from_elem(arm_count, prior_mean_precision),
            counts: Array1::zeros(arm_count),
            observed: Array1::from_elem(arm_count, false),
            discounted,
        }
    }
    
    fn sample_arm(&mut self) -> usize {
        let mut best_arm = 0;
        let mut best_val = f64::NEG_INFINITY;
        
        for i in 0..self.arm_count {
            let var1 = 1.0 / self.precisions[i];
            let var2 = self.minimum_exploration_variance / (self.counts[i] + 1.0).sqrt();
            let variance = var1.max(var2);
            let mean = self.mean_precision[i] / self.precisions[i];
            
            let normal = Normal::new(mean, variance.sqrt()).unwrap();
            let draw = normal.sample(&mut self.rng);
            if draw > best_val {
                best_val = draw;
                best_arm = i;
            }
        }
        best_arm
    }
}

impl<R: Rng> Policy for GaussianThompsonPolicy<R> {
    fn select_site(&mut self, _states: &[SiteStateSnapshot]) -> usize {
        if self.discounted {
            for i in 0..self.arm_count {
                if !self.observed[i] {
                    return i;
                }
            }
        } else {
            for i in 0..self.arm_count {
                if self.counts[i] < 0.5 {
                    return i;
                }
            }
        }
        self.sample_arm()
    }

    fn update(&mut self, chosen_arm: usize, reward: f64, _states: &[SiteStateSnapshot]) {
        let obs_precision = 1.0 / self.observation_variance;
        
        for i in 0..self.arm_count {
            self.counts[i] *= self.posterior_decay;
            self.precisions[i] = self.prior_precision + self.posterior_decay * (self.precisions[i] - self.prior_precision);
            self.mean_precision[i] = self.prior_mean_precision + self.posterior_decay * (self.mean_precision[i] - self.prior_mean_precision);
        }
        
        self.counts[chosen_arm] += 1.0;
        self.precisions[chosen_arm] += obs_precision;
        self.mean_precision[chosen_arm] += reward * obs_precision;
        
        if self.discounted {
            self.observed[chosen_arm] = true;
        }
    }
}

pub struct DiscountedUCBPolicy {
    arm_count: usize,
    gamma: f64,
    exploration: f64,
    counts: Array1<f64>,
    reward_sums: Array1<f64>,
    total_mass: f64,
}

impl DiscountedUCBPolicy {
    pub fn new(arm_count: usize, gamma: f64, exploration: f64) -> Self {
        Self {
            arm_count,
            gamma: gamma.clamp(0.0, 1.0),
            exploration,
            counts: Array1::zeros(arm_count),
            reward_sums: Array1::zeros(arm_count),
            total_mass: 0.0,
        }
    }
}

impl Policy for DiscountedUCBPolicy {
    fn select_site(&mut self, _states: &[SiteStateSnapshot]) -> usize {
        for i in 0..self.arm_count {
            if self.counts[i] <= 1e-9 {
                return i;
            }
        }
        
        let mut best_arm = 0;
        let mut best_val = f64::NEG_INFINITY;
        let log_mass = (self.total_mass + 1.0).ln();
        
        for i in 0..self.arm_count {
            let mean = self.reward_sums[i] / self.counts[i].max(1e-9);
            let bonus = (self.exploration * log_mass / self.counts[i].max(1e-9)).sqrt();
            let score = mean + bonus;
            if score > best_val {
                best_val = score;
                best_arm = i;
            }
        }
        best_arm
    }

    fn update(&mut self, chosen_arm: usize, reward: f64, _states: &[SiteStateSnapshot]) {
        for i in 0..self.arm_count {
            self.counts[i] *= self.gamma;
            self.reward_sums[i] *= self.gamma;
        }
        self.total_mass = self.total_mass * self.gamma + 1.0;
        
        self.counts[chosen_arm] += 1.0;
        self.reward_sums[chosen_arm] += reward;
    }
}

pub struct SlidingWindowUCBPolicy {
    arm_count: usize,
    window_size: usize,
    exploration: f64,
    observation_window: VecDeque<(usize, f64)>,
    counts: Array1<f64>,
    reward_sums: Array1<f64>,
}

impl SlidingWindowUCBPolicy {
    pub fn new(arm_count: usize, window_size: usize, exploration: f64) -> Self {
        Self {
            arm_count,
            window_size: window_size.max(1),
            exploration,
            observation_window: VecDeque::new(),
            counts: Array1::zeros(arm_count),
            reward_sums: Array1::zeros(arm_count),
        }
    }
}

impl Policy for SlidingWindowUCBPolicy {
    fn select_site(&mut self, _states: &[SiteStateSnapshot]) -> usize {
        for i in 0..self.arm_count {
            if self.counts[i] <= 1e-9 {
                return i;
            }
        }
        
        let mut best_arm = 0;
        let mut best_val = f64::NEG_INFINITY;
        let total_mass = (self.observation_window.len() as f64).max(1.0);
        let log_mass = (total_mass + 1.0).ln();
        
        for i in 0..self.arm_count {
            let mean = self.reward_sums[i] / self.counts[i].max(1.0);
            let bonus = (self.exploration * log_mass / self.counts[i].max(1.0)).sqrt();
            let score = mean + bonus;
            if score > best_val {
                best_val = score;
                best_arm = i;
            }
        }
        best_arm
    }

    fn update(&mut self, chosen_arm: usize, reward: f64, _states: &[SiteStateSnapshot]) {
        if self.observation_window.len() == self.window_size {
            if let Some((expired_arm, expired_reward)) = self.observation_window.pop_front() {
                self.counts[expired_arm] = (self.counts[expired_arm] - 1.0).max(0.0);
                self.reward_sums[expired_arm] -= expired_reward;
                if self.counts[expired_arm] <= 1e-9 {
                    self.counts[expired_arm] = 0.0;
                    self.reward_sums[expired_arm] = 0.0;
                }
            }
        }
        
        self.observation_window.push_back((chosen_arm, reward));
        self.counts[chosen_arm] += 1.0;
        self.reward_sums[chosen_arm] += reward;
    }
}

pub struct MyopicOraclePolicy {
}

impl MyopicOraclePolicy {
    pub fn new(_arm_count: usize) -> Self {
        Self { }
    }
}

impl Policy for MyopicOraclePolicy {
    fn wants_snapshots(&self) -> bool { true }
    fn select_site(&mut self, states: &[SiteStateSnapshot]) -> usize {
        let mut best_arm = 0;
        let mut best_rent = f64::NEG_INFINITY;
        for (i, state) in states.iter().enumerate() {
            if state.resource_rent > best_rent {
                best_rent = state.resource_rent;
                best_arm = i;
            }
        }
        best_arm
    }
    fn update(&mut self, _chosen_arm: usize, _reward: f64, _states: &[SiteStateSnapshot]) {}
}

const CONTEXTUAL_FEATURE_DIM: usize = 11;

fn get_contextual_feature_vector(
    index: usize,
    states: &[SiteStateSnapshot],
    config: &SimulationConfig,
) -> Array1<f64> {
    let state = &states[index];
    let nb = network_bonus_snapshot(index, states, config).clamp(0.0, 3.0);
    ndarray::array![
        1.0,
        state.geography,
        state.resource_rent,
        state.extraction,
        state.openness,
        state.adaptability,
        state.productive_capital,
        (state.population.max(1) as f64).ln_1p(),
        nb,
        if state.boomtown { 1.0 } else { 0.0 },
        if state.trade_cluster { 1.0 } else { 0.0 }
    ]
}

use crate::math_utils::{invert_matrix, cholesky_decomposition};
use ndarray::Array2;

pub struct LinUCBPolicy {
    arm_count: usize,
    alpha: f64,
    config: SimulationConfig,
    inv_covariance: Array2<f64>,
    reward_vector: Array1<f64>,
    last_features: Vec<Array1<f64>>,
}

impl LinUCBPolicy {
    pub fn new(arm_count: usize, alpha: f64, ridge: f64, config: SimulationConfig) -> Self {
        let ridge_val = ridge.max(1e-6);
        let inv_covariance = Array2::eye(CONTEXTUAL_FEATURE_DIM) * (1.0 / ridge_val);
        Self {
            arm_count,
            alpha,
            config,
            inv_covariance,
            reward_vector: Array1::zeros(CONTEXTUAL_FEATURE_DIM),
            last_features: vec![Array1::zeros(CONTEXTUAL_FEATURE_DIM); arm_count],
        }
    }
}

impl Policy for LinUCBPolicy {
    fn wants_snapshots(&self) -> bool { true }
    fn select_site(&mut self, states: &[SiteStateSnapshot]) -> usize {
        let theta = self.inv_covariance.dot(&self.reward_vector);
        
        let mut best_arm = 0;
        let mut best_val = f64::NEG_INFINITY;
        
        for i in 0..self.arm_count {
            let feat = get_contextual_feature_vector(i, states, &self.config);
            self.last_features[i] = feat.clone();
            
            let temp = self.inv_covariance.dot(&feat);
            let variance = feat.dot(&temp);
            let bonus = self.alpha * variance.sqrt();
            let score = feat.dot(&theta) + bonus;
            
            if score > best_val {
                best_val = score;
                best_arm = i;
            }
        }
        best_arm
    }

    fn update(&mut self, chosen_arm: usize, reward: f64, _states: &[SiteStateSnapshot]) {
        let x = &self.last_features[chosen_arm];
        
        // Sherman-Morrison rank-1 update for inverse:
        // (A + xx^T)^{-1} = A^{-1} - (A^{-1}xx^T A^{-1}) / (1 + x^T A^{-1}x)
        let a_inv_x = self.inv_covariance.dot(x);
        let x_t_a_inv_x = x.dot(&a_inv_x);
        let denom = 1.0 + x_t_a_inv_x;
        
        for i in 0..CONTEXTUAL_FEATURE_DIM {
            for j in 0..CONTEXTUAL_FEATURE_DIM {
                self.inv_covariance[[i, j]] -= (a_inv_x[i] * a_inv_x[j]) / denom;
            }
            self.reward_vector[i] += reward * x[i];
        }
    }
}

pub struct LinearThompsonPolicy<R: Rng> {
    arm_count: usize,
    rng: R,
    config: SimulationConfig,
    observation_variance: f64,
    sampling_scale: f64,
    precision: Array2<f64>,
    reward_precision: Array1<f64>,
    last_features: Vec<Array1<f64>>,
}

impl<R: Rng> LinearThompsonPolicy<R> {
    pub fn new(
        arm_count: usize,
        rng: R,
        ridge: f64,
        observation_variance: f64,
        sampling_scale: f64,
        config: SimulationConfig,
    ) -> Self {
        let ridge_val = ridge.max(1e-6);
        let precision = Array2::eye(CONTEXTUAL_FEATURE_DIM) * ridge_val;
        Self {
            arm_count,
            rng,
            config,
            observation_variance: observation_variance.max(1e-6),
            sampling_scale: sampling_scale.max(1e-6),
            precision,
            reward_precision: Array1::zeros(CONTEXTUAL_FEATURE_DIM),
            last_features: vec![Array1::zeros(CONTEXTUAL_FEATURE_DIM); arm_count],
        }
    }
}

impl<R: Rng> Policy for LinearThompsonPolicy<R> {
    fn wants_snapshots(&self) -> bool { true }
    fn select_site(&mut self, states: &[SiteStateSnapshot]) -> usize {
        let mut covariance = invert_matrix(&self.precision).unwrap_or_else(|| Array2::eye(CONTEXTUAL_FEATURE_DIM));
        let mean = covariance.dot(&self.reward_precision);
        
        for i in 0..CONTEXTUAL_FEATURE_DIM {
            covariance[[i, i]] += 1e-9;
        }
        
        let chol = cholesky_decomposition(&covariance).unwrap_or_else(|| Array2::eye(CONTEXTUAL_FEATURE_DIM));
        
        let mut normal_sample = Array1::<f64>::zeros(CONTEXTUAL_FEATURE_DIM);
        let normal = Normal::new(0.0, 1.0).unwrap();
        for i in 0..CONTEXTUAL_FEATURE_DIM {
            normal_sample[i] = normal.sample(&mut self.rng);
        }
        
        let theta = &mean + &(chol.dot(&normal_sample) * self.sampling_scale);
        
        let mut best_arm = 0;
        let mut best_val = f64::NEG_INFINITY;
        
        for i in 0..self.arm_count {
            let feat = get_contextual_feature_vector(i, states, &self.config);
            self.last_features[i] = feat.clone();
            
            let score = feat.dot(&theta);
            if score > best_val {
                best_val = score;
                best_arm = i;
            }
        }
        best_arm
    }

    fn update(&mut self, chosen_arm: usize, reward: f64, _states: &[SiteStateSnapshot]) {
        let feat = &self.last_features[chosen_arm];
        let obs_precision = 1.0 / self.observation_variance;
        for i in 0..CONTEXTUAL_FEATURE_DIM {
            for j in 0..CONTEXTUAL_FEATURE_DIM {
                self.precision[[i, j]] += obs_precision * feat[i] * feat[j];
            }
            self.reward_precision[i] += obs_precision * reward * feat[i];
        }
    }
}

