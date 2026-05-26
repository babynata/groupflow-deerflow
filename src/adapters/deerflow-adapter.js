export function createDeerFlowAdapter(groupFlowRuntime) {
  return {
    beforeAgentRun,
    afterAgentRun,
    onFileTouched,
    onRunPaused,
    onRunResumed
  };

  function beforeAgentRun({ groupId, agentId }) {
    return groupFlowRuntime.getGroupContext(groupId, { forAgentId: agentId });
  }

  function afterAgentRun({ groupId, agentId, result }) {
    if (result.finding) {
      groupFlowRuntime.appendFinding(groupId, {
        agentId,
        content: result.finding,
        source: "deerflow_subagent_result"
      });
    }

    if (result.decision) {
      groupFlowRuntime.recordDecision(groupId, {
        agentId,
        content: result.decision,
        reason: result.reason || "Recorded from DeerFlow sub-agent output."
      });
    }

    groupFlowRuntime.appendTimelineEvent(groupId, {
      title: "DeerFlow sub-agent completed",
      detail: `${agentId} wrote structured state back to GroupFlow.`,
      actor: agentId
    });
  }

  function onFileTouched({ groupId, agentId, file }) {
    groupFlowRuntime.updateFileState(groupId, {
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

