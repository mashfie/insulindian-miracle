#![allow(clippy::module_inception)]

#[cfg(test)]
mod tests {
    use crate::math_utils::{
        calculate_gini, calculate_hhi, calculate_zipf_slope, cholesky_decomposition, invert_matrix,
    };
    use crate::policies::{LinUCBPolicy, Policy};
    use crate::runner::{parse_sweep_input_line, run_simulation_with_options};
    use crate::scenarios::apply_scenario_rust;
    use crate::snapshot_physics::{compute_reward_snapshot, network_bonus_snapshot};
    use crate::types::{SimulationConfig, SiteStateSnapshot};
    use crate::whittle::WhittleIndexPolicy;
    use ndarray::{array, Array2};

    #[test]
    fn test_scenario_validation() {
        let base = SimulationConfig::default();
        let scenario_json = r#"{
            "overrides": {
                "horizon": 100,
                "agglomeration_alpha": 0.6
            }
        }"#;
        let modified = apply_scenario_rust(base, scenario_json);
        assert_eq!(modified.horizon, 100);
        assert_eq!(modified.agglomeration_alpha, 0.6);
    }

    #[test]
    fn test_network_bonus() {
        let config = SimulationConfig::default();
        let mut states = vec![SiteStateSnapshot::default(), SiteStateSnapshot::default()];
        states[0].x = 0.0;
        states[0].y = 0.0;
        states[0].openness = 1.0;
        states[0].population = 10;
        states[0].productive_capital = 1.0;

        states[1].x = 1.0;
        states[1].y = 0.0;
        states[1].openness = 1.0;
        states[1].population = 10;
        states[1].productive_capital = 1.0;

        let nb = network_bonus_snapshot(0, &states, &config);
        assert!(nb > 0.0, "Network bonus should be positive");
    }

    #[test]
    fn test_reward_computation() {
        let config = SimulationConfig::default();
        let mut states = vec![SiteStateSnapshot::default()];
        states[0].population = 10;
        states[0].extraction = 0.5;
        states[0].resource_rent = 0.8;
        states[0].productive_capital = 1.0;
        states[0].geography = 0.5;

        let reward = compute_reward_snapshot(0, &states, &config, 1);
        assert!(reward != 0.0, "Reward should be computed");
    }

    #[test]
    fn test_policy_smoke() {
        let config = SimulationConfig::default();
        let result = run_simulation_with_options(&config, "epsilon-greedy", "test");
        assert!(result.is_ok(), "Simulation should run without error");
        let result = result.unwrap();
        assert!(result.cumulative_reward != 0.0);
    }

    #[test]
    fn test_parse_sweep_input_line_backwards_compatible() {
        let raw = serde_json::to_string(&SimulationConfig::default()).expect("serialize");
        let (config, scenario) = parse_sweep_input_line(&raw).expect("parse");
        assert_eq!(scenario, "sweep");
        assert_eq!(config.seed, SimulationConfig::default().seed);
    }

    #[test]
    fn test_parse_sweep_input_line_labeled() {
        let raw = serde_json::json!({
            "scenario": "resource-curse",
            "config": SimulationConfig::default(),
        })
        .to_string();
        let (config, scenario) = parse_sweep_input_line(&raw).expect("parse");
        assert_eq!(scenario, "resource-curse");
        assert_eq!(config.horizon, SimulationConfig::default().horizon);
    }

    // --- NEW: Mathematical Validation Tests ---

    #[test]
    fn test_math_gini() {
        // Gini of [1, 1, 1, 1] is 0 (perfect equality)
        let g1 = calculate_gini(&[1.0, 1.0, 1.0, 1.0]);
        assert!(g1.abs() < 1e-9);

        // Gini of [0, 0, 0, 10] is 0.75 (high inequality)
        let g2 = calculate_gini(&[0.0, 0.0, 0.0, 10.0]);
        assert!((g2 - 0.75).abs() < 1e-9);
    }

    #[test]
    fn test_math_hhi() {
        // HHI of [25, 25, 25, 25] = 4 * (0.25^2) = 0.25
        let h1 = calculate_hhi(&[25.0, 25.0, 25.0, 25.0]);
        assert!((h1 - 0.25).abs() < 1e-9);

        // HHI of [100, 0, 0, 0] = 1.0 (monopoly)
        let h2 = calculate_hhi(&[100.0, 0.0, 0.0, 0.0]);
        assert!((h2 - 1.0).abs() < 1e-9);
    }

    #[test]
    fn test_math_zipf_slope() {
        // Zipf's law: Pop = k / Rank => Pop.ln = K - Rank.ln
        // Rank 1: Pop 100, Rank 2: Pop 50, Rank 3: Pop 33.33...
        // Slope should be approx -1.0
        let slope = calculate_zipf_slope(&[100.0, 50.0, 33.333333]);
        assert!((slope - (-1.0)).abs() < 1e-2); // roughly -1.0
    }

    #[test]
    fn test_math_invert_matrix() {
        // [4, 7]
        // [2, 6]
        // Determinant = 24 - 14 = 10
        // Inverse = [0.6, -0.7]
        //           [-0.2, 0.4]
        let m = array![[4.0, 7.0], [2.0, 6.0]];
        let inv = invert_matrix(&m).expect("Should invert");
        assert!((inv[[0, 0]] - 0.6).abs() < 1e-9);
        assert!((inv[[0, 1]] - (-0.7)).abs() < 1e-9);
        assert!((inv[[1, 0]] - (-0.2)).abs() < 1e-9);
        assert!((inv[[1, 1]] - 0.4).abs() < 1e-9);
    }

    #[test]
    fn test_math_cholesky() {
        // [4, 12, -16]
        // [12, 37, -43]
        // [-16, -43, 98]
        let m = array![
            [4.0, 12.0, -16.0],
            [12.0, 37.0, -43.0],
            [-16.0, -43.0, 98.0]
        ];
        let l = cholesky_decomposition(&m).expect("Should decompose");
        // Lower triangular should be:
        // [2,  0,  0]
        // [6,  1,  0]
        // [-8, 5,  3]
        assert!((l[[0, 0]] - 2.0).abs() < 1e-9);
        assert!((l[[1, 0]] - 6.0).abs() < 1e-9);
        assert!((l[[1, 1]] - 1.0).abs() < 1e-9);
        assert!((l[[2, 0]] - (-8.0)).abs() < 1e-9);
        assert!((l[[2, 1]] - 5.0).abs() < 1e-9);
        assert!((l[[2, 2]] - 3.0).abs() < 1e-9);
    }

    // --- NEW: Advanced Policy Logic Tests ---

    #[test]
    fn test_whittle_index_smoke() {
        let config = SimulationConfig::default();
        let mut policy = WhittleIndexPolicy::new(1, config.clone());
        let mut states = vec![SiteStateSnapshot::default()];
        states[0].population = 10;
        states[0].extraction = 0.2;
        states[0].openness = 0.8;
        states[0].productive_capital = 1.0;
        states[0].resource_rent = 0.5;

        // Ensure we can select a site without panicking and that it computes an index.
        let selected = policy.select_site(&states);
        assert_eq!(selected, 0);
    }

    #[test]
    fn test_linucb_sherman_morrison_update() {
        let config = SimulationConfig::default();
        // alpha = 1.0, ridge = 1.0
        let mut policy = LinUCBPolicy::new(1, 1.0, 1.0, config);
        let mut states = vec![SiteStateSnapshot::default()];
        states[0].population = 10;

        // Select to ensure it populates features
        let selected = policy.select_site(&states);
        assert_eq!(selected, 0);

        // Perform an update; the Sherman-Morrison rank-1 update should modify inv_covariance
        policy.update(0, 10.0, &states);
        
        // Select again to ensure the updated covariance matrix doesn't cause divergence
        let next_selected = policy.select_site(&states);
        assert_eq!(next_selected, 0);
    }
}
