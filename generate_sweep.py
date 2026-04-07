import json
import argparse
from pathlib import Path
import numpy as np

def generate_sweep(output_path: str, count: int, seed: int = 42):
    rng = np.random.default_rng(seed)
    
    # Define parameter ranges
    # We vary a subset of parameters to explore the state space
    param_ranges = {
        "agglomeration_alpha": (0.4, 0.7),
        "resource_curse_strength": (0.0, 0.1),
        "network_scale": (0.1, 0.6),
        "shock_probability": (0.0, 0.05),
        "initial_extraction_resource_bias": (0.0, 5.0),
        "extraction_drag": (0.01, 0.15),
        "inclusive_productivity_gain": (0.3, 0.9),
    }
    
    # Load default config to use as base
    default_config_path = Path("configs/default.json")
    with open(default_config_path, "r") as f:
        base_config = json.load(f)
    
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Generating {count} configurations to {output_path}...")
    
    with open(output_file, "w") as f:
        for i in range(count):
            if i % 10000 == 0 and i > 0:
                print(f"  Generated {i} configs...")
            
            config = base_config.copy()
            
            # Vary selected parameters
            for param, (low, high) in param_ranges.items():
                config[param] = float(rng.uniform(low, high))
            
            # Update seeds to ensure uniqueness
            config["seed"] = int(rng.integers(0, 2**31 - 1))
            config["terrain"]["seed"] = int(rng.integers(0, 2**31 - 1))
            
            # Add a run_id for tracking
            config["run_id"] = i
            
            # Set LoD to LOW for the sweep
            config["lod"] = "LOW"
            
            f.write(json.dumps(config) + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a sweep of simulation configurations.")
    parser.add_argument("--output", type=str, default="configs/sweep_1m.jsonl", help="Output path for JSONL file")
    parser.add_argument("--count", type=int, default=1000000, help="Number of configurations to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for generation")
    
    args = parser.parse_args()
    
    # For a quick test, we might want to generate fewer configs
    # But the requirement is 1M.
    generate_sweep(args.output, args.count, args.seed)
