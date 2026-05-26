# RFC: Group-Level Memory for DeerFlow 2.0

## Summary

GroupFlow proposes a group-level memory and file state layer for DeerFlow 2.0 long-running multi-agent work.

DeerFlow already has strong primitives for sub-agents, memory, sandbox execution, skills, and tool integration. The missing layer is a structured workspace that sits between a project and individual sub-agents. This layer should preserve shared context, decisions, file state, artifacts, and resume points for each task group.

## Problem

Long-running DeerFlow work is rarely a single isolated agent turn. It is usually a coordinated group run:

- one agent researches
- one agent plans
- one agent writes or implements
- one agent reviews
- tools read and modify files
- decisions are made across intermediate outputs

When shared state is scattered across chat history, logs, and private agent context, users cannot easily answer:

- What does this group currently know?
- Which decisions are still authoritative?
- Which files were read, modified, generated, or marked stale?
- What changed since the last checkpoint?
- What context should a resumed run receive?

This makes long-running DeerFlow work harder to inspect, recover, and reuse.

## Proposal

Introduce a GroupFlow-style external state layer for DeerFlow task groups.

```text
Project
  Long-lived workspace and project intent

Group
  One DeerFlow task unit with shared memory, files, artifacts, and timeline

Sub-agent
  Focused worker with private context and role-specific execution
```

GroupFlow does not replace DeerFlow. It adds a shared state layer that DeerFlow can call through a runtime API, MCP tools, or a thin adapter.

## Core Runtime Operations

The current runtime surface is intentionally small:

- `createProject`
- `createGroup`
- `registerAgent`
- `getGroupContext`
- `appendFinding`
- `recordDecision`
- `updateFileState`
- `updateAgentState`
- `appendTimelineEvent`
- `pauseGroup`
- `resumeGroup`
- `summarizeGroup`
- `listArtifacts`

This lets a DeerFlow host runtime use GroupFlow in a simple lifecycle:

```text
Create project and group
Register sub-agents
Read group context before an agent run
Write findings, decisions, file states, and timeline events after an agent run
Pause or resume the group
List artifacts for user inspection
```

## Integration Shape

The first integration should be low-intrusion.

Before a DeerFlow sub-agent runs:

```js
const context = groupFlow.getGroupContext(groupId, {
  forAgentId: "researcher"
});
```

After a DeerFlow sub-agent runs:

```js
groupFlow.appendFinding(groupId, finding);
groupFlow.recordDecision(groupId, decision);
groupFlow.updateFileState(groupId, fileState);
groupFlow.appendTimelineEvent(groupId, event);
```

This preserves DeerFlow as the host runtime while giving each group a durable shared memory and file ledger.

## Expected Benefits

- Users can inspect a group without reading raw logs.
- DeerFlow can resume from structured group state.
- Sub-agents can share durable findings and decisions without merging private context.
- File changes become part of task state, not just filesystem side effects.
- Project work can be organized across multiple groups.

## Non-Goals

- Replacing DeerFlow's planner or sub-agent runtime.
- Replacing sub-agent private context.
- Introducing persistence before the runtime contract is stable.
- Depending on private DeerFlow internals in the first integration.

## Open Questions

- Which DeerFlow lifecycle events should map to first-class GroupFlow timeline events?
- Should file checksums be computed by DeerFlow or passed into GroupFlow by the host?
- Should Project Memory absorb Group Memory automatically or only through user approval?
- What should the minimum MCP tool set include for a first public integration?

## Current Status

The repository currently includes:

- a working local workspace
- a Core Runtime API
- a DeerFlow lifecycle reference
- validation scripts for workspace and runtime behavior

The next step is to implement the MCP tool server and validate the integration with a real DeerFlow run.

