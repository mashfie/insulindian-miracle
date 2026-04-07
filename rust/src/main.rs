use clap::{Parser, Subcommand};
use engine::runner::{run_simulation_with_options, run_sweep_rust_core};
use engine::scenarios::apply_scenario_rust;
use engine::types::SimulationConfig;
use std::fs;

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
            let policy_name = policy.clone().unwrap_or_else(|| "gaussian-thompson".to_string());
            let result = run_simulation_with_options(&sim_config, &policy_name, "cli").unwrap_or_else(
                |e| {
                    eprintln!("{e}");
                    std::process::exit(1);
                },
            );

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
            run_sweep_rust_core(input, policies, output, *limit).expect("Sweep failed");
            println!("Sweep complete.");
        }
    }
}
