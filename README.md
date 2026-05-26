# GroupFlow for DeerFlow 2.0

**中文** | [English](#english)

## 项目背景

DeerFlow 2.0 已经具备长任务 Agent 系统所需的关键基础能力：sub-agents、memory、sandbox 执行、skills、MCP/tool 集成。但当 DeerFlow 被用于更真实的项目型任务时，单个 agent 的私有 context 和一次性聊天记录并不足够。

真实工作通常是一组 agent 协作完成的：Research Agent 收集信息，Product Agent 形成判断，Architect Agent 设计方案，Reviewer Agent 检查决策和文件变更。它们需要一个组级共享状态层来记录“这组 agent 当前知道什么、做过什么决定、改过哪些文件、下一步从哪里继续”。

GroupFlow 就是为 DeerFlow 2.0 设计的 Group Memory / Project Workspace 扩展层。

## 项目目的

GroupFlow 的目标是让 DeerFlow 的长周期多 Agent 工作变得：

- **可观察**：用户能看到 Group Memory、Agent 状态、文件状态和执行时间线。
- **可恢复**：任务中断后，可以从 Group Memory 和 File State Ledger 恢复。
- **可复用**：一个 group 的结论、决策和产物可以服务后续 group。
- **项目化**：把 DeerFlow 从一次性 session 推向 Project / Group / Sub-agent 的工作结构。

GroupFlow 不替代 DeerFlow，也不替代 sub-agent 私有 context。它补的是 group-level shared memory、file state ledger、decision log、timeline 和 resume context。

## 如何使用

### 打开 V0.1 工作台

在项目目录运行：

```bash
cd /Users/natalie/codex-workspace/groupflow-deerflow
npm run serve
```

然后打开终端输出的本地地址，默认是：

```text
http://localhost:4173
```

当前版本是无依赖静态应用，包含：

- Project / Group / Sub-agent 三层结构
- Group Memory 面板
- DeerFlow 风格 Agent Board
- File State Ledger
- Timeline
- `Run next step`
- `Resume group`
- `Compact memory`
- `Refresh files`

### DeerFlow 接入方式

GroupFlow 设计成 DeerFlow 的外接扩展层，而不是 DeerFlow fork。

DeerFlow sub-agent 运行前读取 group context：

```js
const context = groupFlow.getGroupContext(groupId, { forAgentId: "researcher" });
```

DeerFlow sub-agent 运行后写回结构化状态：

```js
groupFlow.appendFinding(groupId, finding);
groupFlow.recordDecision(groupId, decision);
groupFlow.updateFileState(groupId, fileState);
groupFlow.appendTimelineEvent(groupId, event);
```

后续版本会通过 MCP server 和 DeerFlow adapter 暴露同一组能力。迭代计划和更详细的设计文档保留在本地 `docs/` 目录中。

---

## English

[中文](#groupflow-for-deerflow-20) | **English**

## Background

DeerFlow 2.0 already has the core primitives for long-running agent work: sub-agents, memory, sandboxed execution, skills, and MCP/tool integration. But when DeerFlow is used for real project-style work, per-agent private context and one-off chat history are not enough.

Real work usually happens across a group of agents: a Research Agent gathers signals, a Product Agent makes decisions, an Architect Agent designs the solution, and a Reviewer Agent checks decisions and file changes. They need a group-level shared state layer that records what the group knows, what it decided, which files changed, and where the run should resume.

GroupFlow is a Group Memory / Project Workspace extension layer for DeerFlow 2.0.

## Purpose

GroupFlow aims to make DeerFlow long-running multi-agent work:

- **Inspectable**: users can see Group Memory, agent state, file state, and timeline.
- **Resumable**: interrupted work can continue from Group Memory and File State Ledger.
- **Reusable**: findings, decisions, and artifacts from one group can support later groups.
- **Project-aware**: DeerFlow work can move from one-off sessions toward a Project / Group / Sub-agent structure.

GroupFlow does not replace DeerFlow or sub-agent private context. It adds group-level shared memory, file state ledger, decision log, timeline, and resume context.

## How to Use

### Open the V0.1 Workspace

Run this from the project directory:

```bash
cd /Users/natalie/codex-workspace/groupflow-deerflow
npm run serve
```

Then open the local URL printed by the command. The default is:

```text
http://localhost:4173
```

The current version is dependency-free and static. It includes:

- Project / Group / Sub-agent structure
- Group Memory panel
- DeerFlow-style Agent Board
- File State Ledger
- Timeline
- `Run next step`
- `Resume group`
- `Compact memory`
- `Refresh files`

### DeerFlow Integration

GroupFlow is designed as an external DeerFlow extension layer, not a DeerFlow fork.

Before a DeerFlow sub-agent runs, read group context:

```js
const context = groupFlow.getGroupContext(groupId, { forAgentId: "researcher" });
```

After a DeerFlow sub-agent runs, write back structured state:

```js
groupFlow.appendFinding(groupId, finding);
groupFlow.recordDecision(groupId, decision);
groupFlow.updateFileState(groupId, fileState);
groupFlow.appendTimelineEvent(groupId, event);
```

Future versions will expose the same capabilities through an MCP server and a DeerFlow adapter. Iteration plans and detailed design notes are kept locally in the `docs/` directory.
