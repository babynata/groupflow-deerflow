export function createGroupFlowToolServer(runtime) {
  const handlers = {
    create_project: (input) => runtime.createProject(input.project),
    create_group: (input) => runtime.createGroup(input.group),
    register_agent: (input) => runtime.registerAgent(input.groupId, input.agent),
    get_group_context: (input) => runtime.getGroupContext(input.groupId, input.options || {}),
    append_finding: (input) => runtime.appendFinding(input.groupId, input.finding),
    record_decision: (input) => runtime.recordDecision(input.groupId, input.decision),
    update_file_state: (input) => runtime.updateFileState(input.groupId, input.fileState),
    update_agent_state: (input) => runtime.updateAgentState(input.groupId, input.agentId, input.patch),
    append_timeline_event: (input) => runtime.appendTimelineEvent(input.groupId, input.event),
    summarize_group: (input) => runtime.summarizeGroup(input.groupId),
    pause_group: (input) => runtime.pauseGroup(input.groupId, input.reason),
    resume_group: (input) => runtime.resumeGroup(input.groupId),
    list_group_artifacts: (input) => runtime.listArtifacts(input.groupId)
  };

  return {
    listTools,
    callTool
  };

  function listTools() {
    return toolDefinitions.map((tool) => ({ ...tool }));
  }

  function callTool(name, input = {}) {
    const handler = handlers[name];
    if (!handler) {
      throw new Error(`Unknown GroupFlow tool: ${name}`);
    }

    return {
      tool: name,
      ok: true,
      result: handler(input)
    };
  }
}

export const toolDefinitions = [
  {
    name: "create_project",
    description: "Create or replace a GroupFlow project."
  },
  {
    name: "create_group",
    description: "Create or replace a group-scoped DeerFlow task workspace."
  },
  {
    name: "register_agent",
    description: "Register or update a DeerFlow sub-agent inside a group."
  },
  {
    name: "get_group_context",
    description: "Return scoped group context before a sub-agent run."
  },
  {
    name: "append_finding",
    description: "Append a structured finding to Group Memory."
  },
  {
    name: "record_decision",
    description: "Record a group-level decision."
  },
  {
    name: "update_file_state",
    description: "Create or update a File State Ledger entry."
  },
  {
    name: "update_agent_state",
    description: "Update a registered sub-agent state."
  },
  {
    name: "append_timeline_event",
    description: "Append an explicit group timeline event."
  },
  {
    name: "summarize_group",
    description: "Return a compact resumable group summary."
  },
  {
    name: "pause_group",
    description: "Mark a group as paused while preserving state."
  },
  {
    name: "resume_group",
    description: "Restore a group to running state."
  },
  {
    name: "list_group_artifacts",
    description: "List generated or modified group artifacts."
  }
];

