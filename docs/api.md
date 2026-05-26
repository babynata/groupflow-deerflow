# Core Runtime API

This document describes the current GroupFlow Core Runtime surface for DeerFlow integration.

The runtime is created with:

```js
import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";

const groupFlow = createGroupMemoryRuntime(seed);
```

The runtime keeps project, group, memory, agent, file, and timeline state in memory for the current process.

## `snapshot()`

Returns a cloned copy of the current runtime state.

```js
const state = groupFlow.snapshot();
```

Use this for workspace rendering, inspection, validation, or tests. Mutating the returned object does not mutate runtime state.

## `createProject(project)`

Creates or replaces a project.

```js
groupFlow.createProject({
  id: "deerflow-project",
  name: "DeerFlow Research Workspace",
  summary: "Long-running DeerFlow task state",
  memory: {},
  groupIds: []
});
```

Required:

- `id`

Common fields:

- `name`
- `summary`
- `memory`
- `groupIds`

## `createGroup(group)`

Creates or replaces a group under a project.

```js
groupFlow.createGroup({
  id: "research-group",
  projectId: "deerflow-project",
  title: "Research Group",
  objective: "Investigate group-level memory for DeerFlow",
  agents: [],
  files: [],
  timeline: []
});
```

Required:

- `id`
- `projectId`

Common fields:

- `title`
- `status`
- `resumeState`
- `objective`
- `memoryHealth`
- `memory`
- `agents`
- `files`
- `timeline`

When the project exists, the group id is added to the project `groupIds` list.

## `registerAgent(groupId, agent)`

Registers or updates an agent inside a group.

```js
groupFlow.registerAgent("research-group", {
  id: "researcher",
  name: "Researcher",
  status: "ready",
  focus: "Collect evidence and source-backed findings",
  context: 20
});
```

Required:

- `agent.id`

The runtime records an `Agent registered` timeline event.

## `getGroupContext(groupId, options)`

Returns the context DeerFlow should provide before a sub-agent run.

```js
const context = groupFlow.getGroupContext("research-group", {
  forAgentId: "researcher"
});
```

Returns:

- `groupId`
- `objective`
- `status`
- `resumeState`
- `memoryHealth`
- `summary`
- `memory`
- `files`
- `agent`

The `agent` field is scoped to `options.forAgentId` when provided.

## `appendFinding(groupId, finding)`

Appends a structured finding to Group Memory.

```js
groupFlow.appendFinding("research-group", {
  agentId: "researcher",
  content: "DeerFlow needs shared group state for long-running work.",
  source: "subagent_result"
});
```

The runtime records a `Finding appended` timeline event.

## `recordDecision(groupId, decision)`

Records a group-level decision.

```js
groupFlow.recordDecision("research-group", {
  agentId: "architect",
  content: "GroupFlow will remain an external state layer.",
  reason: "This keeps DeerFlow integration low-intrusion."
});
```

The runtime records a `Decision recorded` timeline event.

## `updateFileState(groupId, fileState)`

Creates or updates one file entry in the File State Ledger.

```js
groupFlow.updateFileState("research-group", {
  path: "reports/group-memory.md",
  role: "artifact",
  status: "modified",
  ownerAgentId: "researcher",
  summary: "Captures the current DeerFlow group memory argument."
});
```

Required:

- `path`

Common fields:

- `role`
- `status`
- `ownerAgentId`
- `summary`
- `checksum`

The runtime records a `File state updated` timeline event.

## `updateAgentState(groupId, agentId, patch)`

Updates a registered agent.

```js
groupFlow.updateAgentState("research-group", "researcher", {
  status: "running",
  context: 48
});
```

The runtime records an `Agent state updated` timeline event.

## `appendTimelineEvent(groupId, event)`

Appends an explicit timeline event.

```js
groupFlow.appendTimelineEvent("research-group", {
  title: "Tool call completed",
  detail: "Search results were converted into Group Memory findings.",
  actor: "researcher"
});
```

Common fields:

- `id`
- `title`
- `detail`
- `actor`
- `at`

If `id` or `at` is missing, the runtime supplies one.

## `summarizeGroup(groupId)`

Returns a compact group summary built from the objective, recent decisions, recent findings, and open questions.

```js
const summary = groupFlow.summarizeGroup("research-group");
```

Use this as the first resumable context payload for DeerFlow sub-agents.

## `pauseGroup(groupId, reason)`

Marks a group as paused while preserving resumable state.

```js
groupFlow.pauseGroup("research-group", "Waiting for reviewer approval.");
```

The runtime records a `Group paused` timeline event.

## `resumeGroup(groupId)`

Marks a group as running and restores memory health.

```js
groupFlow.resumeGroup("research-group");
```

The runtime records a `Group resumed` timeline event.

## `listArtifacts(groupId)`

Returns files that currently represent generated or modified outputs.

```js
const artifacts = groupFlow.listArtifacts("research-group");
```

The current rule includes files where:

- `role` is `artifact`
- or `status` is `generated`
- or `status` is `modified`

## DeerFlow Lifecycle Pattern

The intended host flow is:

```text
createProject / createGroup
registerAgent
getGroupContext before sub-agent execution
appendFinding / recordDecision / updateFileState after sub-agent execution
pauseGroup or resumeGroup as the host run changes state
listArtifacts for produced outputs
```

See `examples/deerflow-run-lifecycle.js` for a runnable reference.

