# Vision

GroupFlow for DeerFlow 2.0 starts from one product belief:

> DeerFlow long-running work needs a group-level memory layer, not only sub-agent private context or chat history.

DeerFlow is strongest when it can coordinate sub-agents, tools, memory, sandbox execution, skills, and MCP integrations. But when work becomes project-like, users need to understand what the group knows, what it changed, what it decided, and how it can resume.

## The Problem

In a long DeerFlow task, several things happen at once:

- sub-agents gather and transform information
- tools read and write files
- decisions are made across intermediate outputs
- partial results become artifacts
- failures and retries change the path of the work

If this state only exists in agent-local context, logs, or a chat transcript, the user cannot easily inspect or resume the run.

## The GroupFlow Model

```text
Project
  Long-lived workspace and project intent

Group
  One executable DeerFlow task unit with shared memory

Sub-agent
  Focused DeerFlow worker with private context
```

Each group owns:

- objective
- constraints
- findings
- decisions
- open questions
- file states
- artifacts
- execution timeline

## Product Promise

GroupFlow makes DeerFlow work:

- inspectable: users can see current memory, files, and decisions
- resumable: a group can continue from structured state
- project-aware: work is organized by project and group, not only by session
- adapter-friendly: DeerFlow can use it through MCP or a light adapter

