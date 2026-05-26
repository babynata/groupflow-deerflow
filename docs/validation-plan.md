# Validation Plan

This document defines what the current GroupFlow stage must prove before moving deeper into runtime, MCP, or DeerFlow adapter work.

## 1. Product Understanding

Goal: a DeerFlow user should understand the project without extra explanation.

Validate:

- README explains GroupFlow as a Group Memory / Project Workspace layer for DeerFlow 2.0.
- README states that GroupFlow does not replace DeerFlow or sub-agent private context.
- README explains why long-running DeerFlow work needs shared group state.
- The first screen uses project/workspace language, not temporary prototype language.

Pass signal:

- A reader can describe GroupFlow as the shared state layer between DeerFlow projects and sub-agents.

## 2. Workspace Model

Goal: the Project / Group / Sub-agent model should feel natural for DeerFlow work.

Validate:

- The workspace has a project-level header.
- It contains multiple DeerFlow groups.
- Each group has an objective, agents, memory, files, and timeline.
- Switching groups changes all panels together.

Pass signal:

- A user can inspect one group without reading raw logs or chat history.

## 3. Group State Loop

Goal: group state should update as agents work.

Validate:

- `Run next step` writes a finding or decision.
- `Run next step` updates at least one file state.
- `Run next step` appends timeline events.
- `Resume group` restores status, resume state, memory health, and agent state.
- `Compact memory` records a durable decision.
- `Refresh files` reconciles file ledger state.

Pass signal:

- Memory, files, agents, and timeline move together as one group state.

## 4. Runtime Boundary

Goal: the runtime API should match the future DeerFlow integration shape.

Validate:

- `getGroupContext` returns scoped context before a sub-agent run.
- `appendFinding`, `recordDecision`, `updateFileState`, and `appendTimelineEvent` can write back structured state after a sub-agent run.
- `resumeGroup` restores group-level state without replacing sub-agent private context.

Pass signal:

- DeerFlow can treat GroupFlow as an external state layer.

## 5. Integration Boundary

Goal: the adapter shape should remain low-intrusion.

Validate:

- The DeerFlow adapter maps host events into GroupFlow runtime operations.
- The MCP tool list mirrors the runtime API.
- No current file assumes a private DeerFlow class or internal path.

Pass signal:

- GroupFlow can be used through MCP or a thin adapter before any native DeerFlow change.

## Local Validation Command

Run:

```text
npm run validate
```

The command checks:

- project language does not include forbidden temporary wording
- README contains the required background, purpose, and usage sections
- runtime smoke path works
- runtime artifact listing works
- DeerFlow lifecycle reference runs end to end
- MCP-style tool lifecycle runs end to end
- DeerFlow adapter event mapping runs end to end
- JSON storage save/load works
- checkpoint and replay inspection work
- fixture group ids are consistent
- workspace actions update memory, files, agents, and timeline

## DeerFlow Lifecycle Reference

Run:

```text
npm run validate:lifecycle
```

The lifecycle reference verifies:

- project and group creation
- agent registration
- before-run `getGroupContext`
- after-run finding, decision, file state, and timeline writes
- pause and resume state
- artifact listing
- final JSON summary shape

## Full Validation

Run:

```text
npm run validate
```

The full suite includes:

- workspace behavior
- Core Runtime lifecycle
- MCP-style tool lifecycle
- DeerFlow adapter lifecycle
- JSON storage lifecycle
- replay lifecycle
