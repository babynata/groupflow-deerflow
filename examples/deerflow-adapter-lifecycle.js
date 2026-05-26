import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { createDeerFlowAdapter } from "../src/adapters/deerflow-adapter.js";

export function runDeerFlowAdapterLifecycle() {
  const runtime = createGroupMemoryRuntime();
  const adapter = createDeerFlowAdapter(runtime);

  adapter.handleEvent({
    type: "task_created",
    projectId: "adapter-project",
    projectName: "Adapter Project",
    groupId: "adapter-group",
    groupTitle: "Adapter Group",
    objective: "Validate DeerFlow host events against GroupFlow runtime state."
  });

  runtime.registerAgent("adapter-group", {
    id: "researcher",
    name: "Researcher",
    status: "ready",
    focus: "Produce findings.",
    context: 25
  });

  const beforeRun = adapter.handleEvent({
    type: "agent_started",
    groupId: "adapter-group",
    agentId: "researcher"
  });

  adapter.handleEvent({
    type: "tool_called",
    groupId: "adapter-group",
    agentId: "researcher",
    toolName: "search",
    detail: "Researcher searched for DeerFlow memory pain points."
  });

  adapter.handleEvent({
    type: "file_read",
    groupId: "adapter-group",
    agentId: "researcher",
    path: "docs/vision.md",
    summary: "Read product context."
  });

  adapter.handleEvent({
    type: "subagent_result",
    groupId: "adapter-group",
    agentId: "researcher",
    result: {
      finding: "DeerFlow host events can be mapped into GroupFlow state without private internals.",
      decision: "The first adapter should remain event-based.",
      files: [
        {
          path: "reports/adapter-output.md",
          role: "artifact",
          status: "generated",
          summary: "Adapter lifecycle output."
        }
      ]
    }
  });

  adapter.handleEvent({
    type: "run_paused",
    groupId: "adapter-group",
    reason: "Host requested checkpoint."
  });

  const paused = runtime.getGroupContext("adapter-group", { forAgentId: "researcher" });

  adapter.handleEvent({
    type: "run_resumed",
    groupId: "adapter-group"
  });

  const finalContext = runtime.getGroupContext("adapter-group", { forAgentId: "researcher" });
  const artifacts = runtime.listArtifacts("adapter-group");

  return {
    beforeRunAgentStatus: beforeRun.agent.status,
    pausedStatus: paused.status,
    finalStatus: finalContext.status,
    findingCount: finalContext.memory.findings.length,
    decisionCount: finalContext.memory.decisions.length,
    fileCount: finalContext.files.length,
    artifactCount: artifacts.length,
    timelineCount: runtime.snapshot().groups["adapter-group"].timeline.length
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runDeerFlowAdapterLifecycle(), null, 2));
}

