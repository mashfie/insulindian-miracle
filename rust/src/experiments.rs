use crate::runner::{
    is_oracle_policy_name, run_simulation_with_options, set_result_baselines, RunResult,
};
use crate::scenarios::apply_scenario_rust;
use crate::types::{ExperimentSuite, RunManifest, SimulationConfig};
use serde::Serialize;
use std::collections::BTreeMap;
use std::error::Error;
use std::fs;
use std::io;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

const ORACLE_POLICY: &str = "myopic-oracle";

#[derive(Debug, Serialize)]
struct MetricAggregate {
    metric: String,
    policy: String,
    n: usize,
    mean: f64,
    min: f64,
    max: f64,
}

fn is_oracle_policy(policy: &str) -> bool {
    is_oracle_policy_name(policy)
}

fn actual_policy_list(policies: &[String]) -> Vec<String> {
    let mut actual = vec![ORACLE_POLICY.to_string()];
    for policy in policies {
        if !is_oracle_policy(policy) {
            actual.push(policy.clone());
        }
    }
    actual
}

fn metric_aggregates(
    results: &[RunResult],
    metrics: &[String],
) -> Result<Vec<MetricAggregate>, Box<dyn Error>> {
    let mut aggregates = Vec::new();
    for metric in metrics {
        let mut groups: BTreeMap<String, Vec<f64>> = BTreeMap::new();
        for result in results {
            let value = result.metric_value(metric).ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::InvalidInput,
                    format!("unsupported metric_of_interest: {metric}"),
                )
            })?;
            groups.entry(result.policy.clone()).or_default().push(value);
        }

        for (policy, values) in groups {
            let n = values.len();
            let sum: f64 = values.iter().sum();
            let mean = if n > 0 { sum / n as f64 } else { 0.0 };
            let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
            let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
            aggregates.push(MetricAggregate {
                metric: metric.clone(),
                policy,
                n,
                mean,
                min,
                max,
            });
        }
    }
    Ok(aggregates)
}

pub fn run_experiment_suite(suite_path: &str, output_dir: &str) -> Result<(), Box<dyn Error>> {
    let suite_json = fs::read_to_string(suite_path)?;
    let suite: ExperimentSuite = serde_json::from_str(&suite_json)?;

    let base_config_json = fs::read_to_string(&suite.global_settings.base_config)?;
    let base_config: SimulationConfig = serde_json::from_str(&base_config_json)?;

    fs::create_dir_all(output_dir)?;
    let manifest_dir = Path::new(output_dir).join("manifests");
    fs::create_dir_all(&manifest_dir)?;

    println!("Starting Experiment Suite: {}", suite.experiment_name);

    for hypothesis in &suite.hypotheses {
        println!(
            "  Running Hypothesis: {} ({})",
            hypothesis.id, hypothesis.name
        );

        for scenario_path in &hypothesis.scenarios {
            let scenario_name = Path::new(scenario_path)
                .file_stem()
                .unwrap()
                .to_str()
                .unwrap();

            println!("    Scenario: {}", scenario_name);

            let scenario_raw = fs::read_to_string(scenario_path)?;

            let mut results = Vec::new();

            for &seed in &suite.global_settings.seeds {
                let mut config = base_config.clone();
                config = apply_scenario_rust(config, &scenario_raw);
                config.seed = seed as i32;
                config.lod = suite.global_settings.output_mode.clone();

                let mut seed_results = Vec::new();

                let oracle = run_simulation_with_options(&config, ORACLE_POLICY, scenario_name)
                    .map_err(io::Error::other)?;
                seed_results.push(oracle);

                for policy in &suite.global_settings.policies {
                    if is_oracle_policy(policy) {
                        continue;
                    }

                    let result = run_simulation_with_options(&config, policy, scenario_name)
                        .map_err(|e| {
                            io::Error::other(format!(
                                "error running {scenario_name}/{policy} with seed {seed}: {e}"
                            ))
                        })?;
                    seed_results.push(result);
                }

                set_result_baselines(&mut seed_results);
                results.extend(seed_results);
            }

            let output_file = format!("{}_{}.json", hypothesis.id, scenario_name);
            let output_path = Path::new(output_dir).join(&output_file);
            let res_json = serde_json::to_string_pretty(&results)?;
            fs::write(&output_path, res_json)?;

            let metrics_file = format!("{}_{}_metrics.json", hypothesis.id, scenario_name);
            let metrics_path = Path::new(output_dir).join(&metrics_file);
            let metrics = metric_aggregates(&results, &hypothesis.metrics_of_interest)?;
            let metrics_json = serde_json::to_string_pretty(&metrics)?;
            fs::write(metrics_path, metrics_json)?;

            let timestamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();

            let manifest = RunManifest {
                experiment_name: suite.experiment_name.clone(),
                engine_version: "0.2.0-recovery".to_string(),
                model_version: "v2-terrain-rewrite".to_string(),
                timestamp: timestamp.to_string(),
                hypothesis_id: hypothesis.id.clone(),
                scenario: scenario_name.to_string(),
                policies: actual_policy_list(&suite.global_settings.policies),
                seeds: suite.global_settings.seeds.clone(),
                output_mode: suite.global_settings.output_mode.clone(),
                metrics_of_interest: hypothesis.metrics_of_interest.clone(),
                output_file: output_file.clone(),
                metrics_file: metrics_file.clone(),
            };

            let manifest_file = format!("{}_{}_manifest.json", hypothesis.id, scenario_name);
            let manifest_path = manifest_dir.join(manifest_file);
            let manifest_json = serde_json::to_string_pretty(&manifest)?;
            fs::write(manifest_path, manifest_json)?;
        }
    }

    println!("Experiment Suite Complete. Results in {}", output_dir);
    Ok(())
}
