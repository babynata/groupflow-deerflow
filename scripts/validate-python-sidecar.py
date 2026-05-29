from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib import request

ROOT = Path(__file__).resolve().parents[1]
PYTHON_DIR = ROOT / "python"
sys.path.insert(0, str(PYTHON_DIR))

from groupflow_deerflow.client import GroupFlowClient


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
    server_result = run_server_lifecycle(base / "server-state.json")

    checks = [
        ("Python sidecar lifecycle summary written", lifecycle_summary["recordCount"] == 10),
        ("Python sidecar lifecycle records error", lifecycle_summary["errorCount"] == 1),
        ("Python sidecar lifecycle does not invent file ledger", len(lifecycle_files) == 0),
        ("Python sidecar lifecycle timeline metadata preserved", any(event.get("metadata", {}).get("deerflowRunId") for event in lifecycle_timeline)),
        ("Python sidecar artifact summary written", artifact_summary["recordCount"] == 9),
        ("Python sidecar artifact writes file ledger", any(file["path"] == "/mnt/user-data/outputs/groupflow-artifact-check.md" for file in artifact_files)),
        ("Python sidecar artifact lists artifact", any(file["path"] == "/mnt/user-data/outputs/groupflow-artifact-check.md" for file in artifact_artifacts)),
        ("Python sidecar artifact checkpoint shape represented", artifact_summary["artifactCount"] == 1),
        ("Python sidecar server health responds", server_result["health"]),
        ("Python sidecar server lists tools", server_result["toolCount"] >= 10),
        ("Python sidecar server returns before-run context", "runtime group state" in server_result["contextSummary"]),
        ("Python sidecar server records finding", server_result["findingCount"] == 1),
        ("Python sidecar server records decision", server_result["decisionCount"] == 1),
        ("Python sidecar server records file ledger", server_result["fileCount"] == 1),
        ("Python sidecar server lists artifacts", server_result["artifactCount"] == 1),
    ]

    failures = 0
    for name, passed in checks:
        if passed:
            print(f"PASS {name}")
        else:
            failures += 1
            print(f"FAIL {name}", file=sys.stderr)
    return 1 if failures else 0


def run_server_lifecycle(state_path: Path) -> dict:
    env = {**os.environ, "PYTHONPATH": str(PYTHON_DIR)}
    command = [
        sys.executable,
        "-m",
        "groupflow_deerflow",
        "server",
        "--state",
        str(state_path),
        "--port",
        "0",
    ]
    process = subprocess.Popen(command, cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        base_url = wait_for_server_url(process)
        client = GroupFlowClient(base_url)
        with request.urlopen(f"{base_url}/health", timeout=10) as response:
            health = json.loads(response.read().decode("utf-8"))["ok"]

        tools = client.list_tools()
        client.call_tool("create_project", {"project": {"id": "project", "name": "Project"}})
        client.call_tool("create_group", {
            "group": {
                "id": "group",
                "projectId": "project",
                "objective": "Validate runtime group state.",
            }
        })
        client.call_tool("register_agent", {
            "groupId": "group",
            "agent": {"id": "researcher", "name": "Researcher", "status": "ready"},
        })
        context = client.call_tool("get_group_context", {
            "groupId": "group",
            "options": {"forAgentId": "researcher"},
        })
        client.call_tool("append_finding", {
            "groupId": "group",
            "finding": {"agentId": "researcher", "content": "Runtime finding"},
        })
        client.call_tool("record_decision", {
            "groupId": "group",
            "decision": {"agentId": "researcher", "content": "Runtime decision"},
        })
        client.call_tool("update_file_state", {
            "groupId": "group",
            "fileState": {
                "path": "/mnt/user-data/outputs/runtime-artifact.md",
                "role": "artifact",
                "status": "modified",
                "ownerAgentId": "researcher",
            },
        })
        client.call_tool("append_timeline_event", {
            "groupId": "group",
            "event": {"title": "Runtime validation", "detail": "HTTP tool sidecar updated state.", "actor": "validator"},
        })
        artifacts = client.call_tool("list_group_artifacts", {"groupId": "group"})
        state = client.get_state()
        group = state["groups"]["group"]
        return {
            "health": health,
            "toolCount": len(tools),
            "contextSummary": context["summary"],
            "findingCount": len(group["memory"]["findings"]),
            "decisionCount": len(group["memory"]["decisions"]),
            "fileCount": len(group["files"]),
            "artifactCount": len(artifacts),
        }
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


def wait_for_server_url(process: subprocess.Popen) -> str:
    deadline = time.time() + 10
    while time.time() < deadline:
        line = process.stdout.readline() if process.stdout else ""
        if "GroupFlow sidecar server running at" in line:
            return line.strip().split(" at ", 1)[1]
        if process.poll() is not None:
            stderr = process.stderr.read() if process.stderr else ""
            raise RuntimeError(f"server exited early: {stderr}")
    raise TimeoutError("Timed out waiting for GroupFlow sidecar server.")


if __name__ == "__main__":
    raise SystemExit(main())
