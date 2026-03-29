from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import json
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen


USER_AGENT = "insulindian-miracle/0.1 (+research-fetch)"


@dataclass(slots=True)
class FetchReport:
    fetched: int = 0
    skipped: int = 0
    failed: int = 0

    def to_dict(self) -> dict[str, int]:
        return {"fetched": self.fetched, "skipped": self.skipped, "failed": self.failed}


def load_manifest(path: str | Path) -> dict[str, Any]:
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_manifest(path: str | Path, manifest: dict[str, Any]) -> None:
    with Path(path).open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")


def _infer_suffix(url: str, content_type: str | None) -> str:
    parsed = urlparse(url)
    suffix = Path(parsed.path).suffix.lower()
    if suffix:
        return suffix
    if content_type and "pdf" in content_type.lower():
        return ".pdf"
    return ".bin"


def fetch_papers(manifest_path: str | Path, cache_dir: str | Path) -> FetchReport:
    manifest = load_manifest(manifest_path)
    cache_root = Path(cache_dir)
    cache_root.mkdir(parents=True, exist_ok=True)
    report = FetchReport()

    for entry in manifest.get("entries", []):
        download_url = entry.get("download_url")
        if not entry.get("open_access") or not download_url:
            report.skipped += 1
            continue

        suffix = _infer_suffix(download_url, None)
        target = cache_root / f"{entry['id']}{suffix}"
        if target.exists():
            entry["local_cache_path"] = str(target)
            entry["last_error"] = None
            report.skipped += 1
            continue

        try:
            request = Request(download_url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=30) as response:  # noqa: S310 - curated URLs from manifest
                payload = response.read()
                suffix = _infer_suffix(download_url, response.headers.get("content-type"))
            target = cache_root / f"{entry['id']}{suffix}"
            target.write_bytes(payload)
            entry["local_cache_path"] = str(target)
            entry["fetched_at"] = datetime.now(UTC).isoformat()
            entry["last_error"] = None
            report.fetched += 1
        except Exception as exc:
            entry["last_error"] = str(exc)
            report.failed += 1

    save_manifest(manifest_path, manifest)
    return report


def synthesize_theory(manifest_path: str | Path, output_path: str | Path) -> str:
    manifest = load_manifest(manifest_path)
    entries = manifest.get("entries", [])
    categories: dict[str, list[dict[str, Any]]] = {}
    for entry in entries:
        categories.setdefault(entry["category"], []).append(entry)

    lines = [
        "# Corpus Synthesis",
        "",
        "This file is generated from `research/index.json` and groups the tracked literature",
        "by the implementation layer it informs.",
        "",
    ]

    for category in sorted(categories):
        lines.append(f"## {category.replace('-', ' ').title()}")
        lines.append("")
        for entry in sorted(categories[category], key=lambda item: (item["tier"], item["year"])):
            access = "open" if entry.get("open_access") else "metadata-only"
            line = f"- `{entry['id']}` ({entry['year']}, {access}): {entry['title']}. {entry['notes']}"
            lines.append(line)
        lines.append("")

    content = "\n".join(lines).rstrip() + "\n"
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    return content
