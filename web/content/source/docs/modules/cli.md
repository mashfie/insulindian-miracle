---
tags: [module, python, cli]
type: module
related:
  - "[[sim]]"
  - "[[analysis]]"
  - "[[research]]"
  - "[[architecture-overview]]"
---

# cli.py

`src/insulindian_miracle/cli.py` — 141 lines. Command-line interface via argparse.

## Commands

```
insulindian-miracle
├── research
│   ├── fetch        --manifest --cache
│   └── synthesize   --manifest --out
└── sim
    ├── run          --config --scenario --policy --output
    ├── sweep        --config --scenario --policies --runs --output
    ├── benchmark    --seed --scenario --output
    ├── experiment   --config --scenario --policies --runs --output
    ├── hypotheses   --config --policies --runs --include-experiments --output
    └── scenarios    (no arguments — lists available scenarios)
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `build_parser()` | Constructs the argparse hierarchy |
| `main(argv)` | Dispatches to the appropriate runner |
| `_load_config(path)` | Load `SimulationConfig` from JSON or use defaults |

## Entry Point

Registered in `pyproject.toml`:

```toml
[project.scripts]
insulindian-miracle = "insulindian_miracle.cli:main"
```

Also callable via `python -m insulindian_miracle` (`__main__.py` calls `main()`).

## Output

All commands output JSON to stdout by default. Use `--output path` to write to a file instead. Results are written via `write_json()` from [[sim]].
