from __future__ import annotations

from dataclasses import asdict
import os
from pathlib import Path
import sys
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.append(str(SRC))

from insulindian_miracle import SimulationConfig, run_policy_comparison  # noqa: E402


class CompareRequest(BaseModel):
    seed: int = 7
    scenario: str = "baseline"
    policies: list[str] = Field(default_factory=lambda: ["gaussian-thompson"])
    horizon: int | None = None
    num_sites: int | None = None
    min_site_spacing: float | None = None
    terrain_overrides: dict[str, Any] | None = None


app = FastAPI(title="Insulindian Miracle Compare API")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("COMPARE_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allowed_origins == ["*"] else allowed_origins,
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


def _build_config(payload: CompareRequest) -> SimulationConfig:
    config = SimulationConfig()
    config.seed = payload.seed
    config.terrain.seed = payload.seed
    if payload.horizon is not None:
        config.horizon = payload.horizon
    if payload.num_sites is not None:
        config.num_sites = payload.num_sites
    if payload.min_site_spacing is not None:
        config.min_site_spacing = payload.min_site_spacing
    if not payload.terrain_overrides:
        return config

    terrain_payload = {**asdict(config.terrain), **payload.terrain_overrides}
    return SimulationConfig.from_dict(
        {
            **asdict(config),
            "terrain": terrain_payload,
        }
    )


@app.get("/")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/")
def compare(payload: CompareRequest) -> dict[str, Any]:
    try:
        config = _build_config(payload)
        return run_policy_comparison(
            config,
            policies=payload.policies,
            scenario_name=payload.scenario,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
