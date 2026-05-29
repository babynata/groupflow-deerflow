from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


def ingest_run_events(run_path: str | Path, out_dir: str | Path) -> dict[str, Any]:
    records = read_jsonl(run_path)
    state = build_state(records)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    timeline = state["timeline"]
    files = state["files"]
    artifacts = [file for file in files if file.get("role") == "artifact"]
    summary = {
        "source": str(run_path),
        "outputDir": str(out),
        "threadId": state["threadId"],
        "runId": state["runId"],
        "recordCount": len(records),
        "timelineCount": len(timeline),
        "fileCount": len(files),
        "artifactCount": len(artifacts),
        "errorCount": len([event for event in timeline if event["title"] == "DeerFlow run error"]),
    }

    write_json(out / "state.json", state)
    write_json(out / "timeline.json", timeline)
    write_json(out / "file-ledger.json", files)
    write_json(out / "artifacts.json", artifacts)
    write_json(out / "summary.json", summary)
    return summary


def read_jsonl(path: str | Path) -> list[dict[str, Any]]:
    records = []
    for index, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid DeerFlow RunEventStore JSONL at line {index}: {error}") from error
    return sorted(records, key=lambda record: record.get("seq") or 0)


def build_state(records: list[dict[str, Any]]) -> dict[str, Any]:
    first = records[0] if records else {}
    thread_id = first.get("thread_id") or "deerflow-thread"
    run_id = first.get("run_id") or "deerflow-run"
    state: dict[str, Any] = {
        "project": {
            "id": f"deerflow_{safe_id(thread_id)}",
            "name": f"DeerFlow Thread {thread_id}",
        },
        "group": {
            "id": safe_id(thread_id),
            "title": f"DeerFlow Run {run_id}",
            "objective": "Record DeerFlow RunEventStore events as shared GroupFlow state.",
            "status": "ready",
        },
        "threadId": thread_id,
        "runId": run_id,
        "timeline": [],
        "files": [],
        "agents": {
            "lead_agent": {
                "id": "lead_agent",
                "name": "DeerFlow Lead Agent",
                "status": "ready",
                "focus": "Coordinate the DeerFlow graph run.",
            }
        },
        "workspace": None,
    }
    seen_run_end: set[str] = set()
    seen_workspace: set[str] = set()
    seen_files: set[str] = set()

    for record in records:
        event_type = record.get("event_type")
        metadata = source_metadata(record)

        if event_type == "run.start":
            state["agents"]["lead_agent"]["status"] = "running"
            append_timeline(state, "DeerFlow run started", "DeerFlow RunEventStore recorded a run start.", "lead_agent", record, metadata)
            continue

        if event_type == "run.end":
            append_workspace(state, record, metadata, seen_workspace)
            append_artifacts_from_record(state, record, metadata, seen_files)
            content = record.get("content") if isinstance(record.get("content"), dict) else {}
            status = (record.get("metadata") or {}).get("status") or content.get("status") or "completed"
            key = f"{record.get('run_id') or run_id}:{status}"
            if key in seen_run_end:
                continue
            seen_run_end.add(key)
            append_timeline(state, "DeerFlow run ended", "DeerFlow RunEventStore recorded a completed run.", "deerflow", record, metadata)
            state["group"]["status"] = "ready"
            continue

        if event_type in ("run.error", "llm.error"):
            error_kind = "LLM request error" if event_type == "llm.error" else "run error"
            detail = text_from_content(record.get("content")) or "DeerFlow RunEventStore recorded an error."
            append_timeline(state, "DeerFlow run error", f"{error_kind}: {truncate(detail, 460)}", "deerflow", record, {**metadata, "errorKind": error_kind})
            continue

        if event_type == "llm.human.input":
            append_timeline(state, "DeerFlow user input recorded", truncate(text_from_content(record.get("content")), 240), "deerflow", record, metadata)
            continue

        if event_type == "llm.ai.response":
            caller = (record.get("metadata") or {}).get("caller") or "lead_agent"
            agent_id = normalize_agent_id(caller)
            state["agents"].setdefault(agent_id, {"id": agent_id, "name": agent_name(caller), "status": "ready", "focus": f"Mapped from DeerFlow caller {caller}."})
            for call in extract_tool_calls(record.get("content")):
                append_timeline(state, "DeerFlow tool called", f"{agent_id} called {call['name']}.", agent_id, record, {**metadata, "toolCallId": call.get("id"), "toolArgs": call.get("args") or {}})
                append_file_events_from_tool_call(state, call, agent_id, record, metadata, seen_files)
            text = text_from_content(record.get("content"))
            if text:
                append_timeline(state, "DeerFlow assistant response", truncate(text, 300), agent_id, record, metadata)
            continue

        if event_type == "llm.tool.result":
            tool_name = tool_name_from_record(record)
            append_timeline(state, "DeerFlow tool result recorded", truncate(text_from_content(record.get("content")), 300), "lead_agent", record, {**metadata, "toolName": tool_name})
            append_artifacts_from_record(state, record, metadata, seen_files)

    return state


def append_timeline(state: dict[str, Any], title: str, detail: str, actor: str, record: dict[str, Any], metadata: dict[str, Any]) -> None:
    state["timeline"].append({
        "title": title,
        "detail": detail,
        "actor": actor,
        "at": record.get("created_at"),
        "metadata": metadata,
    })


def append_workspace(state: dict[str, Any], record: dict[str, Any], metadata: dict[str, Any], seen: set[str]) -> None:
    content = record.get("content")
    thread_data = content.get("thread_data") if isinstance(content, dict) else None
    if not isinstance(thread_data, dict):
        return
    key = f"{thread_data.get('workspace_path', '')}:{thread_data.get('uploads_path', '')}:{thread_data.get('outputs_path', '')}"
    if key in seen:
        return
    seen.add(key)
    state["workspace"] = thread_data
    append_timeline(state, "DeerFlow workspace recorded", "DeerFlow RunEventStore exposed workspace, uploads, and outputs paths for this run.", "deerflow", record, {**metadata, "threadData": thread_data})


def append_file_events_from_tool_call(state: dict[str, Any], call: dict[str, Any], agent_id: str, record: dict[str, Any], metadata: dict[str, Any], seen: set[str]) -> None:
    mode = "read" if re.search(r"(read|view)", call["name"], re.IGNORECASE) else "write"
    for file_path in paths_from_tool_call(call):
        append_file(state, file_path, "source" if mode == "read" else "artifact", "read" if mode == "read" else "modified", agent_id, f"Mapped from DeerFlow {call['name']} tool call.", metadata, seen)


def append_artifacts_from_record(state: dict[str, Any], record: dict[str, Any], metadata: dict[str, Any], seen: set[str]) -> None:
    for file_path in artifact_paths_from_record(record):
        append_file(state, file_path, "artifact", "generated", "lead_agent", "Artifact surfaced by DeerFlow RunEventStore output.", metadata, seen)


def append_file(state: dict[str, Any], file_path: str, role: str, status: str, owner: str, summary: str, metadata: dict[str, Any], seen: set[str]) -> None:
    key = f"{file_path}:{role}"
    if key in seen:
        return
    seen.add(key)
    state["files"].append({
        "path": file_path,
        "role": role,
        "status": status,
        "ownerAgentId": owner,
        "summary": summary,
        "metadata": metadata,
    })


def source_metadata(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "deerflowThreadId": record.get("thread_id"),
        "deerflowRunId": record.get("run_id"),
        "deerflowSeq": record.get("seq"),
        "deerflowEventType": record.get("event_type"),
        "deerflowCreatedAt": record.get("created_at"),
    }


def extract_tool_calls(content: Any) -> list[dict[str, Any]]:
    if not isinstance(content, dict):
        return []
    calls = content.get("tool_calls") or (content.get("additional_kwargs") or {}).get("tool_calls") or []
    result = []
    for call in calls:
        function = call.get("function") or {}
        args = call.get("args")
        if args is None and isinstance(function.get("arguments"), str):
            try:
                args = json.loads(function["arguments"])
            except json.JSONDecodeError:
                args = {}
        name = call.get("name") or function.get("name")
        if name:
            result.append({"name": name, "args": args or {}, "id": call.get("id") or call.get("call_id")})
    return result


def paths_from_tool_call(call: dict[str, Any]) -> list[str]:
    args = call.get("args") or {}
    values = [args.get("path"), args.get("filepath")]
    values.extend(args.get("paths") or [])
    values.extend(args.get("filepaths") or [])
    return unique([value for value in values if isinstance(value, str) and value.strip()])


def artifact_paths_from_record(record: dict[str, Any]) -> list[str]:
    content = record.get("content") if isinstance(record.get("content"), dict) else {}
    metadata = record.get("metadata") if isinstance(record.get("metadata"), dict) else {}
    direct = []
    for source in (content, metadata):
        for key in ("artifacts", "filepaths"):
            values = source.get(key) or []
            if isinstance(values, list):
                direct.extend(values)
    return unique([*direct, *extract_paths(text_from_content(record.get("content")))])


def tool_name_from_record(record: dict[str, Any]) -> str:
    content = record.get("content") if isinstance(record.get("content"), dict) else {}
    metadata = record.get("metadata") if isinstance(record.get("metadata"), dict) else {}
    return content.get("name") or metadata.get("tool_name") or metadata.get("toolName") or ""


def text_from_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(text_from_content(item) for item in content)
    if isinstance(content, dict):
        value = content.get("content")
        if isinstance(value, str):
            return value
        if isinstance(value, list):
            return "".join(text_from_content(item) for item in value)
        if isinstance(content.get("text"), str):
            return content["text"]
    return ""


def extract_paths(text: str) -> list[str]:
    if not text:
        return []
    return unique(re.findall(r"(?:/mnt/user-data/outputs/|outputs/|docs/|reports/)[^\s'\",)]+", text))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def safe_id(value: str) -> str:
    return re.sub(r"(^_+|_+$)", "", re.sub(r"[^A-Za-z0-9_-]+", "_", str(value))) or "deerflow"


def normalize_agent_id(value: str) -> str:
    return safe_id(value) or "lead_agent"


def agent_name(caller: str) -> str:
    if caller.startswith("subagent:"):
        return f"DeerFlow Subagent {caller[len('subagent:'):]}"
    if caller == "lead_agent":
        return "DeerFlow Lead Agent"
    return f"DeerFlow {caller}"


def truncate(value: str, max_length: int) -> str:
    text = str(value or "").strip()
    if len(text) <= max_length:
        return text
    return f"{text[: max_length - 1]}..."


def unique(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result
