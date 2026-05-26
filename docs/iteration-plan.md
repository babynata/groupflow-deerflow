# GroupFlow for DeerFlow 2.0 Iteration Plan

## V0.1: DeerFlow Workspace

Status: completed.

Goal: prove the product value of group-level memory for DeerFlow long-running multi-agent work.

Scope:

- Static, dependency-free workspace UI
- Project / Group / Sub-agent structure
- Group Memory panel
- DeerFlow Agent Board
- File State Ledger
- Timeline
- Simulated `Run next step`
- Simulated `Resume group`
- Simulated `Compact memory`
- Simulated `Refresh files`

Acceptance:

- Opening `index.html` shows a DeerFlow project workspace, not a chat UI.
- Switching groups updates Memory, Agents, Files, and Timeline together.
- Running the next step writes memory, changes agent state, updates a file, and appends timeline events.
- Resume shows that Group Memory and File State are restored together.

## V0.2: Core Runtime

Status: in progress.

Goal: turn the workspace model into a callable runtime.

Scope:

- `createProject`
- `createGroup`
- `registerAgent`
- `getGroupContext`
- `appendFinding`
- `recordDecision`
- `updateFileState`
- `appendTimelineEvent`
- `summarizeGroup`
- `updateAgentState`
- local JSON or in-memory storage
- `listArtifacts`

Acceptance:

- Runtime can drive the existing workspace seed data.
- Runtime returns scoped context for a specific DeerFlow sub-agent.
- Runtime records structured memory and file state without relying on chat history.

## V0.3: MCP Server

Goal: allow DeerFlow and other agent hosts to use GroupFlow through tools.

Scope:

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

Acceptance:

- MCP tool contracts map cleanly to runtime operations.
- A DeerFlow-style agent can read context and write memory through tools.

## V0.4: DeerFlow Adapter

Goal: make GroupFlow feel native to DeerFlow without forking DeerFlow.

Scope:

- map DeerFlow task runs to GroupFlow groups
- map DeerFlow sub-agents to GroupFlow agents
- convert sub-agent results into findings, decisions, artifacts, and timeline events
- convert file reads/writes into File State Ledger updates
- provide resume context back to DeerFlow

Acceptance:

- Adapter can be understood as a low-intrusion integration boundary.
- DeerFlow remains the host runtime; GroupFlow remains the shared memory and project state layer.

## V0.5: Project Workspace UI

Goal: move from first workspace surface to usable workspace.

Scope:

- Project list
- Group list
- Group detail page
- Agent board
- memory diff
- file state diff
- artifact preview
- timeline replay
- resume from checkpoint

Acceptance:

- A user can inspect a DeerFlow project across multiple groups.
- The UI makes file state, decisions, and run history visible without reading logs.

## V0.6: Persistence, Replay, and Checkpoints

Goal: support long-running work, audit, and recovery.

Scope:

- SQLite storage
- optional Postgres storage
- group checkpoints
- timeline replay
- memory versioning
- file state versioning
- run comparison
- failure recovery model

Acceptance:

- A paused or failed group can be reconstructed from persisted memory and file state.
- Replay shows why a group reached its current state.

## V1.0: DeerFlow Community Proposal

Goal: package GroupFlow as a credible DeerFlow extension and community proposal.

Scope:

- stable API
- complete README
- DeerFlow integration guide
- MCP integration guide
- examples
- tests
- security boundary notes
- RFC-style proposal

Acceptance:

- The repository is clear enough for DeerFlow users to try, critique, and contribute.
- The project can support a GitHub discussion or RFC around group-level memory for DeerFlow 2.0.
