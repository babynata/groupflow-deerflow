import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { createGroupFlowToolServer } from "../src/mcp/tool-server.js";

export function runMcpToolLifecycle() {
  const runtime = createGroupMemoryRuntime();
  const tools = createGroupFlowToolServer(runtime);

  tools.callTool("create_project", {
    project: {
      id: "mcp-project",
      name: "MCP-style GroupFlow Project",
      summary: "External host uses GroupFlow through tool calls."
    }
  });

  tools.callTool("create_group", {
    group: {
      id: "mcp-group",
      projectId: "mcp-project",
      title: "MCP Group",
      objective: "Verify a host can drive GroupFlow through tool calls."
    }
  });

  tools.callTool("register_agent", {
    groupId: "mcp-group",
    agent: {
      id: "researcher",
      name: "Researcher",
      status: "ready",
      focus: "Write findings through tools.",
      context: 18
    }
  });

  const beforeRun = tools.callTool("get_group_context", {
    groupId: "mcp-group",
    options: { forAgentId: "researcher" }
  }).result;

  tools.callTool("append_finding", {
    groupId: "mcp-group",
    finding: {
      agentId: "researcher",
      content: "External hosts can use GroupFlow without linking to runtime internals.",
      source: "tool_call"
    }
  });

  tools.callTool("record_decision", {
    groupId: "mcp-group",
    decision: {
      agentId: "researcher",
      content: "MCP-style tools should mirror the Core Runtime contract.",
      reason: "This keeps the bridge easy to reason about."
    }
  });

  tools.callTool("update_file_state", {
    groupId: "mcp-group",
    fileState: {
      path: "reports/mcp-tool-run.md",
      role: "artifact",
      status: "generated",
      ownerAgentId: "researcher",
      summary: "Tool-driven run output."
    }
  });

  tools.callTool("pause_group", {
    groupId: "mcp-group",
    reason: "Host paused for inspection."
  });
  tools.callTool("resume_group", { groupId: "mcp-group" });

  const artifacts = tools.callTool("list_group_artifacts", { groupId: "mcp-group" }).result;
  const finalContext = tools.callTool("get_group_context", {
    groupId: "mcp-group",
    options: { forAgentId: "researcher" }
  }).result;

  return {
    toolCount: tools.listTools().length,
    beforeRunAgent: beforeRun.agent.id,
    finalStatus: finalContext.status,
    resumeState: finalContext.resumeState,
    summaryIncludesFinding: finalContext.summary.includes("External hosts"),
    artifactCount: artifacts.length
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runMcpToolLifecycle(), null, 2));
}

