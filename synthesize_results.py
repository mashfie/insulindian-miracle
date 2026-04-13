import argparse
import json

from python.cohort_pipeline import synthesize_frontend_outputs


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthesize cohort parquet outputs into frontend evidence files.")
    parser.add_argument(
        "--cohort",
        action="append",
        choices=["legacy_1m", "historical_90k", "stress_500k"],
        help="Restrict synthesis to one or more cohorts.",
    )
    args = parser.parse_args()

    payload = synthesize_frontend_outputs(args.cohort)
    print(json.dumps(payload["landing"]["headline_totals"], indent=2))


if __name__ == "__main__":
    main()
