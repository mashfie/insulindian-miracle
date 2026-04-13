import argparse
import json

from python.cohort_pipeline import cohort_specs, generate_cohort_inputs, run_cohort


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate or execute cohort sweeps.")
    parser.add_argument(
        "command",
        choices=["generate", "run", "smoke"],
        help="Generate cohort inputs, execute a full cohort run, or execute a limited smoke run.",
    )
    parser.add_argument(
        "--cohort",
        choices=["legacy_1m", "historical_90k", "stress_500k", "all"],
        default="all",
        help="Target cohort.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=64,
        help="Line limit for smoke runs.",
    )
    args = parser.parse_args()

    if args.command == "generate":
        selected = None if args.cohort == "all" else [args.cohort]
        manifest = generate_cohort_inputs(selected)
        print(json.dumps(manifest, indent=2))
        return

    if args.cohort == "all":
        target_names = list(cohort_specs().keys())
    else:
        target_names = [args.cohort]

    generate_cohort_inputs(target_names)
    for cohort_name in target_names:
        run_cohort(cohort_name, limit=args.limit if args.command == "smoke" else None)


if __name__ == "__main__":
    main()
