export function createDeerFlowAdapter(groupFlowRuntime) {
  return {
    handleEvent,
    beforeAgentRun,
    afterAgentRun,
    onFileTouched,
    onRunPaused,
    onRunResumed
  };

  function handleEvent(event) {
    switch (event.type) {
      case "task_created":
        return handleTaskCreated(event);
      case "agent_registered":
        return groupFlowRuntime.registerAgent(event.groupId, event.agent);
      case "agent_started":
        return beforeAgentRun(event);
      case "subagent_result":
        return afterAgentRun(event);
      case "timeline_event":
        return groupFlowRuntime.appendTimelineEvent(event.groupId, {
          title: event.title,
          detail: event.detail,
          actor: event.actor || "deerflow",
          at: event.at,
          metadata: event.metadata
        });
      case "tool_called":
        return groupFlowRuntime.appendTimelineEvent(event.groupId, {
          title: "DeerFlow tool called",
          detail: event.detail || `${event.agentId || "agent"} called ${event.toolName || "tool"}.`,
          actor: event.agentId || "deerflow",
          at: event.at,
          metadata: event.metadata
        });
      case "file_read":
        return onFileTouched({
          groupId: event.groupId,
          agentId: event.agentId,
          file: {
            path: event.path,
            role: event.role || "source",
            status: "read",
            summary: event.summary || "Read by DeerFlow.",
            metadata: event.metadata
          }
        });
      case "file_written":
        return onFileTouched({
          groupId: event.groupId,
          agentId: event.agentId,
          file: {
            path: event.path,
            role: event.role || "artifact",
            status: event.status || "modified",
            summary: event.summary || "Written by DeerFlow.",
            metadata: event.metadata
          }
        });
      case "run_paused":
        return onRunPaused(event);
      case "run_resumed":
        return onRunResumed(event);
      default:
        throw new Error(`Unknown DeerFlow event: ${event.type}`);
    }
  }

  function handleTaskCreated(event) {
    groupFlowRuntime.createProject({
      id: event.projectId,
      name: event.projectName || event.projectId,
      summary: event.projectSummary || ""
    });

    return groupFlowRuntime.createGroup({
      id: event.groupId,
      projectId: event.projectId,
      title: event.groupTitle || event.groupId,
      objective: event.objective || "",
      status: "ready"
    });
  }

  function beforeAgentRun({ groupId, agentId }) {
    groupFlowRuntime.updateAgentState(groupId, agentId, {
      status: "running"
    });
    return groupFlowRuntime.getGroupContext(groupId, { forAgentId: agentId });
  }

  function afterAgentRun({ groupId, agentId, result = {} }) {
    if (result.finding) {
      groupFlowRuntime.appendFinding(groupId, {
        agentId,
        content: result.finding,
        source: "deerflow_subagent_result",
        metadata: result.metadata
      });
    }

    if (result.decision) {
      groupFlowRuntime.recordDecision(groupId, {
        agentId,
        content: result.decision,
        reason: result.reason || "Recorded from DeerFlow sub-agent output.",
        metadata: result.metadata
      });
    }

    for (const file of result.files || []) {
      onFileTouched({ groupId, agentId, file });
    }

    groupFlowRuntime.updateAgentState(groupId, agentId, {
      status: result.status || "ready"
    });

    return groupFlowRuntime.appendTimelineEvent(groupId, {
      title: "DeerFlow sub-agent completed",
      detail: `${agentId} wrote structured state back to GroupFlow.`,
      actor: agentId,
      at: result.at,
      metadata: result.metadata
    });
  }

  function onFileTouched({ groupId, agentId, file }) {
    return groupFlowRuntime.updateFileState(groupId, {
      ...file,
      ownerAgentId: agentId
    });
  }

  function onRunPaused({ groupId, reason }) {
    return groupFlowRuntime.pauseGroup(groupId, reason);
  }

  function onRunResumed({ groupId }) {
    return groupFlowRuntime.resumeGroup(groupId);
  }
}
