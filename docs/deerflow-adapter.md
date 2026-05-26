# DeerFlow Adapter

The DeerFlow adapter maps host runtime events into GroupFlow runtime state.

It is intentionally event-based and does not depend on DeerFlow private internals.

## Supported Events

- `task_created`
- `agent_started`
- `subagent_result`
- `tool_called`
- `file_read`
- `file_written`
- `run_paused`
- `run_resumed`

## Usage

```js
import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { createDeerFlowAdapter } from "../src/adapters/deerflow-adapter.js";

const runtime = createGroupMemoryRuntime();
const adapter = createDeerFlowAdapter(runtime);

adapter.handleEvent({
  type: "task_created",
  projectId: "project",
  groupId: "group",
  objective: "Run a DeerFlow task with shared group state."
});
```

## Mapping

```text
task_created    -> createProject / createGroup
agent_started   -> updateAgentState / getGroupContext
subagent_result -> appendFinding / recordDecision / updateFileState
tool_called     -> appendTimelineEvent
file_read       -> updateFileState
file_written    -> updateFileState
run_paused      -> pauseGroup
run_resumed     -> resumeGroup
```

See `examples/deerflow-adapter-lifecycle.js` for a runnable reference.

