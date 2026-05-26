# GroupFlow for DeerFlow 2.0

**中文** | [English](#english)

## 项目背景

DeerFlow 2.0 已经具备长任务 Agent 系统所需的关键基础能力：sub-agents、memory、sandbox 执行、skills、MCP/tool 集成。但当 DeerFlow 被用于更真实的项目型任务时，单个 agent 的私有 context 和一次性聊天记录并不足够。

真实工作通常是一组 agent 协作完成的：Research Agent 收集信息，Product Agent 形成判断，Architect Agent 设计方案，Reviewer Agent 检查决策和文件变更。它们需要一个组级共享状态层来记录“这组 agent 当前知道什么、做过什么决定、改过哪些文件、下一步从哪里继续”。

GroupFlow 就是为 DeerFlow 2.0 设计的 Group Memory / Project Workspace 扩展层。

## 项目目的

GroupFlow 的目标是让 DeerFlow 的长周期多 Agent 工作变得：

- **可观察**：用户能看到 Group Memory、Agent 状态、文件状态和执行时间线。
- **可恢复**：任务中断后，可以从 Group Memory、File State Ledger、Checkpoint 和 Timeline Replay 恢复。
- **可复用**：一个 group 的结论、决策和产物可以服务后续 group。
- **项目化**：把 DeerFlow 从一次性 session 推向 Project / Group / Sub-agent 的工作结构。

GroupFlow 不替代 DeerFlow，也不替代 sub-agent 私有 context。它补的是 group-level shared memory、file state ledger、decision log、timeline、MCP-style tools、adapter event mapping、persistence 和 replay。

## 如何使用

### 打开本地工作台

在项目目录运行：

```bash
cd /Users/natalie/codex-workspace/groupflow-deerflow
npm run serve
```

然后打开终端输出的本地地址，默认是：

```text
http://127.0.0.1:4173
```

当前工作台包含：

- Project / Group / Sub-agent 三层结构
- Group Memory summary
- DeerFlow 风格 Agent Board
- Artifacts
- File State Ledger
- Timeline filter
- `Run next step`
- `Resume group`
- `Compact memory`
- `Refresh files`

### 运行验证

运行全量验证：

```bash
npm run validate
```

也可以单独验证：

```bash
npm run validate:workspace
npm run validate:lifecycle
npm run validate:mcp
npm run validate:adapter
npm run validate:storage
npm run validate:replay
```

### 使用 Core Runtime

```js
import { createGroupMemoryRuntime } from "./src/core/group-memory-runtime.js";

const groupFlow = createGroupMemoryRuntime();

groupFlow.createProject({ id: "project", name: "Project" });
groupFlow.createGroup({
  id: "group",
  projectId: "project",
  objective: "Run DeerFlow work with shared group state."
});

const context = groupFlow.getGroupContext("group", {
  forAgentId: "researcher"
});
```

### 使用 MCP-style Tools

```js
import { createGroupFlowToolServer } from "./src/mcp/tool-server.js";

const tools = createGroupFlowToolServer(groupFlow);

tools.callTool("append_finding", {
  groupId: "group",
  finding: {
    agentId: "researcher",
    content: "GroupFlow stores shared findings outside private agent context."
  }
});
```

### 使用 DeerFlow Adapter

GroupFlow 设计成 DeerFlow 的外接扩展层，而不是 DeerFlow fork。

```js
import { createDeerFlowAdapter } from "./src/adapters/deerflow-adapter.js";

const adapter = createDeerFlowAdapter(groupFlow);

adapter.handleEvent({
  type: "agent_started",
  groupId: "group",
  agentId: "researcher"
});
```

Adapter 支持的 host events 包括：

- `task_created`
- `agent_started`
- `subagent_result`
- `tool_called`
- `file_read`
- `file_written`
- `run_paused`
- `run_resumed`

### 使用持久化与 Replay

```js
import { createJsonFileStorage } from "./src/storage/json-storage.js";
import { replayTimeline } from "./src/replay/replay.js";

const storage = createJsonFileStorage({ baseDir: ".groupflow-state" });
storage.save(groupFlow.snapshot());

const state = storage.load();
const replay = replayTimeline(state, "group");
```

更多设计细节保留在 `docs/` 目录中。

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
- **Resumable**: interrupted work can continue from Group Memory, File State Ledger, checkpoints, and timeline replay.
- **Reusable**: findings, decisions, and artifacts from one group can support later groups.
- **Project-aware**: DeerFlow work can move from one-off sessions toward a Project / Group / Sub-agent structure.

GroupFlow does not replace DeerFlow or sub-agent private context. It adds group-level shared memory, file state ledger, decision log, timeline, MCP-style tools, adapter event mapping, persistence, and replay.

## How to Use

### Open the Local Workspace

Run this from the project directory:

```bash
cd /Users/natalie/codex-workspace/groupflow-deerflow
npm run serve
```

Then open the local URL printed by the command. The default is:

```text
http://127.0.0.1:4173
```

The current workspace includes:

- Project / Group / Sub-agent structure
- Group Memory summary
- DeerFlow-style Agent Board
- Artifacts
- File State Ledger
- Timeline filter
- `Run next step`
- `Resume group`
- `Compact memory`
- `Refresh files`

### Run Validation

Run the full validation suite:

```bash
npm run validate
```

Or validate individual layers:

```bash
npm run validate:workspace
npm run validate:lifecycle
npm run validate:mcp
npm run validate:adapter
npm run validate:storage
npm run validate:replay
```

### Use the Core Runtime

```js
import { createGroupMemoryRuntime } from "./src/core/group-memory-runtime.js";

const groupFlow = createGroupMemoryRuntime();

groupFlow.createProject({ id: "project", name: "Project" });
groupFlow.createGroup({
  id: "group",
  projectId: "project",
  objective: "Run DeerFlow work with shared group state."
});

const context = groupFlow.getGroupContext("group", {
  forAgentId: "researcher"
});
```

### Use MCP-style Tools

```js
import { createGroupFlowToolServer } from "./src/mcp/tool-server.js";

const tools = createGroupFlowToolServer(groupFlow);

tools.callTool("append_finding", {
  groupId: "group",
  finding: {
    agentId: "researcher",
    content: "GroupFlow stores shared findings outside private agent context."
  }
});
```

### Use the DeerFlow Adapter

GroupFlow is designed as an external DeerFlow extension layer, not a DeerFlow fork.

```js
import { createDeerFlowAdapter } from "./src/adapters/deerflow-adapter.js";

const adapter = createDeerFlowAdapter(groupFlow);

adapter.handleEvent({
  type: "agent_started",
  groupId: "group",
  agentId: "researcher"
});
```

Supported host events:

- `task_created`
- `agent_started`
- `subagent_result`
- `tool_called`
- `file_read`
- `file_written`
- `run_paused`
- `run_resumed`

### Use Persistence and Replay

```js
import { createJsonFileStorage } from "./src/storage/json-storage.js";
import { replayTimeline } from "./src/replay/replay.js";

const storage = createJsonFileStorage({ baseDir: ".groupflow-state" });
storage.save(groupFlow.snapshot());

const state = storage.load();
const replay = replayTimeline(state, "group");
```

Detailed design notes are kept in the `docs/` directory.

