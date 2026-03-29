from __future__ import annotations

import json
from pathlib import Path

from insulindian_miracle.research import fetch_papers, synthesize_theory


ARTIFACT_DIR = Path("tests/runtime_artifacts")


def test_fetch_papers_downloads_open_access_entries():
    payload = b"%PDF-1.4\nfake\n"
    source = ARTIFACT_DIR / "source.pdf"
    source.write_bytes(payload)
    cache_dir = ARTIFACT_DIR / "cache"
    downloaded = cache_dir / "open-paper.pdf"
    if downloaded.exists():
        downloaded.unlink()

    manifest_path = ARTIFACT_DIR / "manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                    "entries": [
                        {
                            "id": "open-paper",
                            "open_access": True,
                            "download_url": source.resolve().as_uri(),
                        },
                    {
                        "id": "closed-paper",
                        "open_access": False,
                        "download_url": "https://example.com/closed.pdf",
                    },
                ]
            }
        ),
        encoding="utf-8",
    )

    report = fetch_papers(manifest_path, cache_dir)

    assert report.fetched == 1
    assert report.skipped == 1
    assert downloaded.read_bytes() == payload


def test_synthesize_theory_groups_entries_by_category():
    manifest_path = ARTIFACT_DIR / "synth-manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                "entries": [
                    {"id": "bandit-a", "category": "bandits", "tier": "core", "year": 2020, "open_access": True, "title": "Bandits", "notes": "Policy."},
                    {"id": "urban-a", "category": "urban-geography", "tier": "supporting", "year": 1974, "open_access": False, "title": "Cities", "notes": "Terrain."},
                ]
            }
        ),
        encoding="utf-8",
    )
    output_path = ARTIFACT_DIR / "synthesis.md"

    content = synthesize_theory(manifest_path, output_path)

    assert "## Bandits" in content
    assert "## Urban Geography" in content
    assert output_path.read_text(encoding="utf-8").startswith("# Corpus Synthesis")
