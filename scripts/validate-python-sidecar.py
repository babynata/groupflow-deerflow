from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PYTHON_DIR = ROOT / "python"


def run_ingest(fixture: str, out_dir: Path) -> dict:
    command = [
        sys.executable,
        "-m",
        "groupflow_deerflow",
        "ingest",
        "--run",
        str(ROOT / "src" / "fixtures" / fixture),
        "--out",
        str(out_dir),
    ]
    subprocess.run(command, check=True, cwd=ROOT, env={**os.environ, "PYTHONPATH": str(PYTHON_DIR)})
    return json.loads((out_dir / "summary.json").read_text(encoding="utf-8"))


def main() -> int:
    base = Path(tempfile.gettempdir()) / "groupflow-python-sidecar-validation"
    if base.exists():
        shutil.rmtree(base)
    base.mkdir(parents=True)

    lifecycle_dir = base / "lifecycle"
    artifact_dir = base / "artifact"
    lifecycle_summary = run_ingest("deerflow-real-run-events.jsonl", lifecycle_dir)
    artifact_summary = run_ingest("deerflow-real-artifact-run-events.jsonl", artifact_dir)

    lifecycle_files = json.loads((lifecycle_dir / "file-ledger.json").read_text(encoding="utf-8"))
    lifecycle_timeline = json.loads((lifecycle_dir / "timeline.json").read_text(encoding="utf-8"))
    artifact_files = json.loads((artifact_dir / "file-ledger.json").read_text(encoding="utf-8"))
    artifact_artifacts = json.loads((artifact_dir / "artifacts.json").read_text(encoding="utf-8"))

    checks = [
        ("Python sidecar lifecycle summary written", lifecycle_summary["recordCount"] == 10),
        ("Python sidecar lifecycle records error", lifecycle_summary["errorCount"] == 1),
        ("Python sidecar lifecycle does not invent file ledger", len(lifecycle_files) == 0),
        ("Python sidecar lifecycle timeline metadata preserved", any(event.get("metadata", {}).get("deerflowRunId") for event in lifecycle_timeline)),
        ("Python sidecar artifact summary written", artifact_summary["recordCount"] == 9),
        ("Python sidecar artifact writes file ledger", any(file["path"] == "/mnt/user-data/outputs/groupflow-artifact-check.md" for file in artifact_files)),
        ("Python sidecar artifact lists artifact", any(file["path"] == "/mnt/user-data/outputs/groupflow-artifact-check.md" for file in artifact_artifacts)),
        ("Python sidecar artifact checkpoint shape represented", artifact_summary["artifactCount"] == 1),
    ]

    failures = 0
    for name, passed in checks:
        if passed:
            print(f"PASS {name}")
        else:
            failures += 1
            print(f"FAIL {name}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
