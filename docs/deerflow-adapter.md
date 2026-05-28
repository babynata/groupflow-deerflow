# DeerFlow Adapter

The DeerFlow adapter maps host runtime events into GroupFlow runtime state.

It is intentionally event-based and does not depend on DeerFlow private internals.

## Supported Events

- `task_created`
- `agent_registered`
- `agent_started`
- `subagent_result`
- `timeline_event`
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
agent_registered -> registerAgent
agent_started   -> updateAgentState / getGroupContext
subagent_result -> appendFinding / recordDecision / updateFileState
timeline_event  -> appendTimelineEvent
tool_called     -> appendTimelineEvent
file_read       -> updateFileState
file_written    -> updateFileState
run_paused      -> pauseGroup
run_resumed     -> resumeGroup
```

See `examples/deerflow-adapter-lifecycle.js` for a runnable reference.

## RunEventStore Transformer

GroupFlow can also consume DeerFlow `RunEventStore` / JSONL records through a transformer before calling the adapter.

```js
import {
  readDeerFlowRunEventsJsonl,
  transformDeerFlowRunEvents
} from "../src/adapters/deerflow-run-events.js";

const records = readDeerFlowRunEventsJsonl(jsonlText);
const events = transformDeerFlowRunEvents(records);

for (const event of events) {
  adapter.handleEvent(event);
}
```

Supported DeerFlow record types:

- `run.start`
- `run.end`
- `run.error`
- `llm.human.input`
- `llm.ai.response`
- `llm.tool.result`
- `llm.error`

The transformer preserves DeerFlow `thread_id`, `run_id`, `seq`, `event_type`, and `created_at` under timeline metadata. File state is conservative: GroupFlow records artifacts when DeerFlow clearly exposes file paths through tool calls, tool results, or artifacts fields.

See `examples/deerflow-run-events-lifecycle.js` for a runnable reference.

## Real RunEventStore Coverage

GroupFlow also includes a sanitized fixture based on a real DeerFlow local run. That fixture covers:

- repeated `run.end` records emitted during one run
- `run.end.content.thread_data` with workspace, uploads, and outputs paths
- `llm.human.input`
- `llm.error`
- middleware title responses through `llm.ai.response`

The transformer keeps repeated completion records quiet by writing one completed-run timeline event per run/status pair. Workspace paths are stored as timeline metadata because they describe the DeerFlow execution environment; they are not treated as generated artifacts.

Current verified behavior:

- real RunEventStore JSONL creates a GroupFlow project and group
- real lifecycle and error records become timeline events
- DeerFlow metadata is preserved on timeline events
- replay and checkpoint validation can run on the transformed state
- file ledger entries remain empty when the real DeerFlow run does not expose tool or artifact paths

The next production validation target is a successful DeerFlow run that produces real tool calls or artifacts, so File State Ledger behavior can be verified against official run output rather than only structured examples.
