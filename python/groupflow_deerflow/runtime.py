from __future__ import annotations

import copy
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def empty_state() -> dict[str, Any]:
    return {
        "projects": {},
        "groups": {},
    }


def load_state(path: str | Path) -> dict[str, Any]:
    state_path = Path(path)
    if not state_path.exists():
        return empty_state()
    return json.loads(state_path.read_text(encoding="utf-8"))


def save_state(path: str | Path, state: dict[str, Any]) -> None:
    state_path = Path(path)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def call_tool(state: dict[str, Any], tool_name: str, payload: dict[str, Any] | None = None) -> Any:
    payload = payload or {}
    handlers = {
        "create_project": create_project,
        "create_group": create_group,
        "register_agent": register_agent,
        "get_group_context": get_group_context,
        "append_finding": append_finding,
        "record_decision": record_decision,
        "update_file_state": update_file_state,
        "append_timeline_event": append_timeline_event,
        "summarize_group": summarize_group,
        "pause_group": pause_group,
        "resume_group": resume_group,
        "list_group_artifacts": list_group_artifacts,
    }
    if tool_name not in handlers:
        raise KeyError(f"Unknown GroupFlow tool: {tool_name}")
    return handlers[tool_name](state, payload)


def list_tools() -> list[dict[str, str]]:
    return [
        {"name": "create_project", "description": "Create or replace a GroupFlow project."},
        {"name": "create_group", "description": "Create or replace a group-scoped DeerFlow task workspace."},
        {"name": "register_agent", "description": "Register or update a DeerFlow sub-agent inside a group."},
        {"name": "get_group_context", "description": "Return scoped group context before a DeerFlow sub-agent runs."},
        {"name": "append_finding", "description": "Append a structured finding to Group Memory."},
        {"name": "record_decision", "description": "Record a group-level decision."},
        {"name": "update_file_state", "description": "Create or update a File State Ledger entry."},
        {"name": "append_timeline_event", "description": "Append an explicit group timeline event."},
        {"name": "summarize_group", "description": "Return a compact resumable group summary."},
        {"name": "pause_group", "description": "Mark a group as paused while preserving state."},
        {"name": "resume_group", "description": "Restore a group to running state."},
        {"name": "list_group_artifacts", "description": "List generated or modified group artifacts."},
    ]


def create_project(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    project = payload.get("project") or payload
    project_id = require(project, "id")
    state["projects"][project_id] = {
        "id": project_id,
        "name": project.get("name", project_id),
        "summary": project.get("summary", ""),
        "groupIds": project.get("groupIds", []),
        "createdAt": project.get("createdAt") or now_iso(),
    }
    return state["projects"][project_id]


def create_group(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = payload.get("group") or payload
    group_id = require(group, "id")
    project_id = require(group, "projectId")
    if project_id not in state["projects"]:
        create_project(state, {"id": project_id, "name": project_id})
    state["groups"][group_id] = {
        "id": group_id,
        "projectId": project_id,
        "title": group.get("title", group_id),
        "objective": group.get("objective", ""),
        "status": group.get("status", "ready"),
        "resumeState": group.get("resumeState", "fresh"),
        "memory": {
            "findings": [],
            "decisions": [],
            "openQuestions": [],
            "summary": "",
        },
        "files": [],
        "agents": {},
        "timeline": [],
        "createdAt": group.get("createdAt") or now_iso(),
    }
    project_groups = state["projects"][project_id].setdefault("groupIds", [])
    if group_id not in project_groups:
        project_groups.append(group_id)
    for agent in group.get("agents", []):
        register_agent(state, {"groupId": group_id, "agent": agent})
    append_timeline(state, group_id, {"title": "Group created", "detail": "GroupFlow group was created.", "actor": "groupflow"})
    return state["groups"][group_id]


def register_agent(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    agent = payload.get("agent") or {}
    agent_id = require(agent, "id")
    group["agents"][agent_id] = {
        "id": agent_id,
        "name": agent.get("name", agent_id),
        "status": agent.get("status", "ready"),
        "focus": agent.get("focus", ""),
        "context": agent.get("context", 0),
    }
    append_timeline(state, group["id"], {"title": "Agent registered", "detail": f"{agent_id} joined the group.", "actor": agent_id})
    return group["agents"][agent_id]


def get_group_context(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    options = payload.get("options") or {}
    agent_id = options.get("forAgentId")
    return {
        "groupId": group["id"],
        "objective": group["objective"],
        "status": group["status"],
        "resumeState": group.get("resumeState", "fresh"),
        "summary": summarize_group_text(group),
        "memory": copy.deepcopy(group["memory"]),
        "files": copy.deepcopy(group["files"]),
        "agent": copy.deepcopy(group["agents"].get(agent_id)) if agent_id else None,
    }


def append_finding(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    finding = payload.get("finding") or {}
    entry = {
        "agentId": finding.get("agentId", "deerflow"),
        "content": require(finding, "content"),
        "source": finding.get("source", "deerflow"),
        "at": finding.get("at") or now_iso(),
        "metadata": finding.get("metadata", {}),
    }
    group["memory"]["findings"].append(entry)
    group["memory"]["summary"] = summarize_group_text(group)
    append_timeline(state, group["id"], {"title": "Finding appended", "detail": entry["content"], "actor": entry["agentId"], "at": entry["at"], "metadata": entry["metadata"]})
    return entry


def record_decision(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    decision = payload.get("decision") or {}
    entry = {
        "agentId": decision.get("agentId", "deerflow"),
        "content": require(decision, "content"),
        "reason": decision.get("reason", ""),
        "at": decision.get("at") or now_iso(),
        "metadata": decision.get("metadata", {}),
    }
    group["memory"]["decisions"].append(entry)
    group["memory"]["summary"] = summarize_group_text(group)
    append_timeline(state, group["id"], {"title": "Decision recorded", "detail": entry["content"], "actor": entry["agentId"], "at": entry["at"], "metadata": entry["metadata"]})
    return entry


def update_file_state(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    file_state = payload.get("fileState") or payload.get("file") or {}
    file_path = require(file_state, "path")
    entry = {
        "path": file_path,
        "role": file_state.get("role", "artifact"),
        "status": file_state.get("status", "modified"),
        "summary": file_state.get("summary", ""),
        "ownerAgentId": file_state.get("ownerAgentId") or file_state.get("agentId") or "deerflow",
        "metadata": file_state.get("metadata", {}),
        "updatedAt": file_state.get("updatedAt") or now_iso(),
    }
    existing = next((item for item in group["files"] if item["path"] == file_path), None)
    if existing:
        existing.update(entry)
        result = existing
    else:
        group["files"].append(entry)
        result = entry
    append_timeline(state, group["id"], {"title": "File state updated", "detail": file_path, "actor": result["ownerAgentId"], "at": result["updatedAt"], "metadata": result["metadata"]})
    return result


def append_timeline_event(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    return append_timeline(state, payload.get("groupId"), payload.get("event") or {})


def summarize_group(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    return {"groupId": group["id"], "summary": summarize_group_text(group)}


def pause_group(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    group["status"] = "paused"
    group["resumeState"] = "paused"
    append_timeline(state, group["id"], {"title": "Group paused", "detail": payload.get("reason", "Group paused."), "actor": "deerflow"})
    return group


def resume_group(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, payload.get("groupId"))
    group["status"] = "running"
    group["resumeState"] = "restored"
    append_timeline(state, group["id"], {"title": "Group resumed", "detail": "Group resumed from GroupFlow state.", "actor": "deerflow"})
    return group


def list_group_artifacts(state: dict[str, Any], payload: dict[str, Any]) -> list[dict[str, Any]]:
    group = require_group(state, payload.get("groupId"))
    return [file for file in group["files"] if file.get("role") == "artifact"]


def append_timeline(state: dict[str, Any], group_id: str | None, event: dict[str, Any]) -> dict[str, Any]:
    group = require_group(state, group_id)
    entry = {
        "title": event.get("title", "Timeline event"),
        "detail": event.get("detail", ""),
        "actor": event.get("actor", "groupflow"),
        "at": event.get("at") or now_iso(),
        "metadata": event.get("metadata", {}),
    }
    group["timeline"].append(entry)
    return entry


def summarize_group_text(group: dict[str, Any]) -> str:
    findings = [item["content"] for item in group["memory"]["findings"][-3:]]
    decisions = [item["content"] for item in group["memory"]["decisions"][-3:]]
    parts = [group.get("objective", "")]
    if findings:
        parts.append("Findings: " + " | ".join(findings))
    if decisions:
        parts.append("Decisions: " + " | ".join(decisions))
    return "\n".join(part for part in parts if part)


def require_group(state: dict[str, Any], group_id: str | None) -> dict[str, Any]:
    if not group_id or group_id not in state["groups"]:
        raise KeyError(f"Unknown group: {group_id}")
    return state["groups"][group_id]


def require(payload: dict[str, Any], key: str) -> Any:
    value = payload.get(key)
    if value in (None, ""):
        raise ValueError(f"Missing required field: {key}")
    return value


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
