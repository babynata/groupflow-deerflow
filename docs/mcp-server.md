# MCP-style Tool Server

GroupFlow exposes a dependency-free MCP-style tool surface for host runtimes that want to use Group Memory without importing private implementation details.

This is not an official MCP SDK implementation. It is a stable tool registry and executor that mirrors the Core Runtime API. The Python sidecar also exposes the same tool shape over HTTP through `POST /tools/{tool_name}`.

## Python HTTP Sidecar

```bash
PYTHONPATH=python python3 -m groupflow_deerflow server \
  --state .groupflow/state.json \
  --port 8765
```

Useful endpoints:

- `GET /health`
- `GET /tools`
- `GET /state`
- `POST /tools/{tool_name}`

Example:

```bash
curl -X POST http://127.0.0.1:8765/tools/append_finding \
  -H "Content-Type: application/json" \
  -d '{"groupId":"group","finding":{"agentId":"researcher","content":"Finding"}}'
```

## Usage

```js
import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { createGroupFlowToolServer } from "../src/mcp/tool-server.js";

const runtime = createGroupMemoryRuntime();
const tools = createGroupFlowToolServer(runtime);

tools.callTool("create_project", {
  project: { id: "project", name: "Project" }
});
```

## Tools

- `create_project`
- `create_group`
- `register_agent`
- `get_group_context`
- `append_finding`
- `record_decision`
- `update_file_state`
- `update_agent_state`
- `append_timeline_event`
- `summarize_group`
- `pause_group`
- `resume_group`
- `list_group_artifacts`

## Host Lifecycle

```text
create_project
create_group
register_agent
get_group_context before sub-agent execution
append_finding / record_decision / update_file_state after sub-agent execution
pause_group or resume_group as the host run changes state
list_group_artifacts for produced outputs
```

See `examples/mcp-tool-lifecycle.js` for a runnable reference.
