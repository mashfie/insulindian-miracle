use clap::{Parser, Subcommand};
use engine::experiments::run_experiment_suite;
use engine::runner::{run_simulation_with_options, run_sweep_rust_core, set_result_baselines};
use engine::scenarios::apply_scenario_rust;
use engine::types::SimulationConfig;
use std::fs;

const ORACLE_POLICY: &str = "myopic-oracle";
const CANONICAL_POLICIES: &[&str] = &[
    "epsilon-greedy",
    "ucb1",
    "discounted-ucb",
    "sliding-window-ucb",
    "gaussian-thompson",
    "discounted-gaussian-thompson",
    "whittle-index",
    "linucb",
    "linear-thompson",
];

#[derive(Parser)]
#[command(name = "insulindian-miracle")]
#[command(about = "High-Performance Monte Carlo Laboratory for Evolutionary Urban Economics", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a single simulation
    Run {
        #[arg(short, long)]
        config: Option<String>,
        /// JSON scenario file with `overrides` merged into the base config
        #[arg(short, long)]
        scenario: Option<String>,
        #[arg(short, long)]
        policy: Option<String>,
        #[arg(short, long)]
        output: Option<String>,
    },
    /// Run a high-performance sweep
    Sweep {
        #[arg(short, long)]
        input: String,
        #[arg(short, long)]
        policies: Vec<String>,
        #[arg(short, long)]
        output: String,
        #[arg(short, long)]
        limit: Option<usize>,
    },
    /// List available scenarios
    Scenarios,
    /// Run benchmark over canonical policies
    Benchmark {
        #[arg(short, long)]
        config: Option<String>,
        #[arg(short, long)]
        scenario: Option<String>,
    },
    /// Run comparison of canonical policies and output to JSON
    Compare {
        #[arg(short, long)]
        config: Option<String>,
        #[arg(short, long)]
        scenario: Option<String>,
        #[arg(short, long)]
        output: String,
    },
    /// Run an experiment suite from a JSON file
    Experiment {
        #[arg(short, long)]
        input: String,
        #[arg(short, long)]
        output: String,
    },
}

fn load_base_config(path: Option<&str>) -> SimulationConfig {
    match path {
        Some(p) => {
            let content = fs::read_to_string(p).expect("Failed to read config file");
            serde_json::from_str(&content).expect("Failed to parse config JSON")
        }
        None => SimulationConfig::default(),
    }
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Run {
            config,
            scenario,
            policy,
            output,
        } => {
            let mut sim_config = load_base_config(config.as_deref());
            if let Some(path) = scenario {
                let raw = fs::read_to_string(path).expect("Failed to read scenario file");
                sim_config = apply_scenario_rust(sim_config, &raw);
            }
            let policy_name = policy
                .clone()
                .unwrap_or_else(|| "gaussian-thompson".to_string());
            let result = run_simulation_with_options(&sim_config, &policy_name, "cli")
                .unwrap_or_else(|e| {
                    eprintln!("{e}");
                    std::process::exit(1);
                });

            if let Some(out_path) = output {
                let res_json = serde_json::to_string_pretty(&result).unwrap();
                fs::write(out_path, res_json).expect("Failed to write output file");
            } else {
                println!("{:?}", result);
            }
        }
        Commands::Sweep {
            input,
            policies,
            output,
            limit,
        } => {
            println!("Starting sweep: {} -> {}", input, output);
            if let Err(e) = run_sweep_rust_core(input, policies, output, *limit) {
                eprintln!("Sweep failed: {e}");
                std::process::exit(1);
            }
            println!("Sweep complete.");
        }
        Commands::Scenarios => {
            println!("Available scenarios (configs/scenarios/):");
            let paths = fs::read_dir("configs/scenarios")
                .expect("Failed to read configs/scenarios directory");
            for path in paths {
                let p = path.unwrap().path();
                if p.extension().and_then(|s| s.to_str()) == Some("json") {
                    println!("  - {}", p.file_stem().unwrap().to_str().unwrap());
                }
            }
        }
        Commands::Benchmark { config, scenario } => {
            let mut sim_config = load_base_config(config.as_deref());
            if let Some(path) = scenario {
                let raw = fs::read_to_string(path).expect("Failed to read scenario file");
                sim_config = apply_scenario_rust(sim_config, &raw);
            }
            let oracle = run_simulation_with_options(&sim_config, ORACLE_POLICY, "benchmark")
                .expect("Oracle benchmark failed");
            let mut results = vec![oracle];
            for p in CANONICAL_POLICIES {
                let result = run_simulation_with_options(&sim_config, p, "benchmark")
                    .unwrap_or_else(|e| panic!("policy benchmark failed for {p}: {e}"));
                results.push(result);
            }
            set_result_baselines(&mut results);
            let best_reward = results
                .iter()
                .filter_map(|result| result.empirical_best_reward)
                .next()
                .unwrap_or(0.0);
            let oracle_reward = results
                .iter()
                .filter_map(|result| result.oracle_reward)
                .next()
                .unwrap_or(0.0);
            println!("Myopic oracle baseline: {:.2}", oracle_reward);
            println!("Best observed baseline: {:.2}", best_reward);
            println!(
                "{:<25} | {:<15} | {:<15} | {:<15} | {:<15}",
                "Policy", "Reward", "Extraction", "Oracle Gap", "Empirical Regret"
            );
            println!(
                "{:-<25}-|-{:-<15}-|-{:-<15}-|-{:-<15}-|-{:-<15}",
                "", "", "", "", ""
            );
            for result in results {
                println!(
                    "{:<25} | {:<15.2} | {:<15.4} | {:<15.2} | {:<15.2}",
                    result.policy.as_str(),
                    result.cumulative_reward,
                    result.mean_final_extraction,
                    result.oracle_regret.unwrap_or(0.0),
                    result.empirical_regret.unwrap_or(0.0),
                );
            }
        }
        Commands::Compare {
            config,
            scenario,
            output,
        } => {
            let mut sim_config = load_base_config(config.as_deref());
            if let Some(path) = scenario {
                let raw = fs::read_to_string(path).expect("Failed to read scenario file");
                sim_config = apply_scenario_rust(sim_config, &raw);
            }
            let oracle = run_simulation_with_options(&sim_config, ORACLE_POLICY, "compare")
                .expect("Oracle comparison failed");
            let mut results = Vec::new();
            results.push(oracle);
            for p in CANONICAL_POLICIES {
                let result = run_simulation_with_options(&sim_config, p, "compare")
                    .unwrap_or_else(|e| panic!("policy comparison failed for {p}: {e}"));
                results.push(result);
            }
            set_result_baselines(&mut results);
            let res_json = serde_json::to_string_pretty(&results).unwrap();
            fs::write(output, res_json).expect("Failed to write comparison output file");
            println!("Comparison saved to {}", output);
        }
        Commands::Experiment { input, output } => {
            if let Err(e) = run_experiment_suite(input, output) {
                eprintln!("Experiment suite failed: {e}");
                std::process::exit(1);
            }
        }
    }
}
