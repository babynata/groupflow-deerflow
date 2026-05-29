# DeerFlow Integration

GroupFlow should be integrated as an external extension layer, not as a fork of DeerFlow.

```text
DeerFlow
  owns planning, sub-agent execution, tools, skills, sandbox work

GroupFlow
  owns group memory, file state, timeline, decisions, resume context
```

## Python Sidecar Entry

For DeerFlow projects, the first integration path is the Python sidecar. It reads a DeerFlow RunEventStore JSONL file and writes GroupFlow state files without modifying DeerFlow source code.

```bash
PYTHONPATH=python python3 -m groupflow_deerflow ingest \
  --run .deer-flow/threads/{thread_id}/runs/{run_id}.jsonl \
  --out .groupflow
```

The sidecar writes:

- `.groupflow/state.json`
- `.groupflow/timeline.json`
- `.groupflow/file-ledger.json`
- `.groupflow/artifacts.json`
- `.groupflow/summary.json`

It is dependency-free and uses only the Python standard library.

## Runtime Flow

1. DeerFlow receives a long-running user task.
2. DeerFlow planner creates or selects a GroupFlow group.
3. Before each sub-agent run, DeerFlow asks GroupFlow for scoped context.
4. The sub-agent runs with private context plus group context.
5. After the run, DeerFlow writes structured state back to GroupFlow.
6. GroupFlow updates memory, file state, timeline, and resume summary.

## Before Agent Run

```js
const context = groupFlow.getGroupContext(groupId, {
  forAgentId: "researcher"
});
```

Returned context should include:

- objective
- relevant constraints
- recent decisions
- recent findings
- open questions
- file states
- compact group summary
- agent-specific state when available

## After Agent Run

```js
groupFlow.appendFinding(groupId, {
  agentId: "researcher",
  content: "DeerFlow users need file state tracking for long-running runs.",
  source: "subagent_result"
});

groupFlow.recordDecision(groupId, {
  agentId: "product-pm",
  content: "Group Memory will not replace sub-agent private context.",
  reason: "Private context remains useful for local reasoning."
});

groupFlow.updateFileState(groupId, {
  path: "docs/deerflow-integration.md",
  role: "artifact",
  status: "modified",
  ownerAgentId: "architect",
  summary: "Documents the adapter and MCP integration shape."
});
```

## MCP Tool Surface

GroupFlow should expose:

- `create_project`
- `create_group`
- `get_group_context`
- `append_finding`
- `record_decision`
- `update_file_state`
- `append_timeline_event`
- `summarize_group`
- `pause_group`
- `resume_group`
- `list_group_artifacts`

## Adapter Boundary

The DeerFlow adapter should translate host events into GroupFlow updates:

- `agent_started` -> timeline event
- `subagent_result` -> finding / decision / artifact
- `tool_called` -> timeline event
- `file_read` -> file state update
- `file_written` -> file state update
- `run_paused` -> pause event
- `run_resumed` -> resume event

The adapter should not depend on private DeerFlow internals in V0.1. It should document the expected boundary and keep the core runtime portable.
