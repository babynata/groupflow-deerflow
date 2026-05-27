export function createGroupMemoryRuntime(seed = {}) {
  const state = clone({
    projects: {},
    groups: {},
    ...seed
  });

  return {
    snapshot,
    createProject,
    createGroup,
    registerAgent,
    getGroupContext,
    appendFinding,
    recordDecision,
    updateFileState,
    appendTimelineEvent,
    updateAgentState,
    summarizeGroup,
    pauseGroup,
    resumeGroup,
    listArtifacts
  };

  function snapshot() {
    return clone(state);
  }

  function createProject(project) {
    requireField(project, "id", "createProject");
    state.projects[project.id] = {
      id: project.id,
      name: project.name || project.id,
      summary: project.summary || "",
      memory: project.memory || {},
      groupIds: project.groupIds || []
    };
    return state.projects[project.id];
  }

  function createGroup(group) {
    requireField(group, "id", "createGroup");
    requireField(group, "projectId", "createGroup");

    state.groups[group.id] = {
      id: group.id,
      projectId: group.projectId,
      title: group.title || group.id,
      status: group.status || "ready",
      resumeState: group.resumeState || "available",
      objective: group.objective || "",
      memoryHealth: group.memoryHealth || "ready",
      memory: normalizeMemory(group.memory),
      agents: group.agents || [],
      files: group.files || [],
      timeline: group.timeline || []
    };

    const project = state.projects[group.projectId];
    if (project && !project.groupIds.includes(group.id)) {
      project.groupIds.push(group.id);
    }

    return state.groups[group.id];
  }

  function registerAgent(groupId, agent) {
    const group = requireGroup(groupId);
    requireField(agent, "id", "registerAgent");
    const existing = group.agents.find((item) => item.id === agent.id);
    if (existing) Object.assign(existing, agent);
    else group.agents.push(agent);
    appendTimelineEvent(groupId, {
      title: "Agent registered",
      detail: `${agent.name || agent.id} joined the DeerFlow group.`,
      actor: agent.id
    });
    return group.agents;
  }

  function getGroupContext(groupId, options = {}) {
    const group = requireGroup(groupId);
    const agent = group.agents.find((item) => item.id === options.forAgentId) || null;
    return {
      groupId,
      objective: group.objective,
      status: group.status,
      resumeState: group.resumeState,
      memoryHealth: group.memoryHealth,
      summary: summarizeGroup(groupId),
      memory: clone(group.memory),
      files: clone(group.files),
      agent: clone(agent)
    };
  }

  function appendFinding(groupId, finding) {
    const group = requireGroup(groupId);
    const entry = normalizeEntry(finding);
    group.memory.findings.push(entry);
    appendTimelineEvent(groupId, {
      title: "Finding appended",
      detail: entry.content,
      actor: entry.agentId || "groupflow",
      metadata: entry.metadata
    });
    return group.memory.findings;
  }

  function recordDecision(groupId, decision) {
    const group = requireGroup(groupId);
    const entry = normalizeEntry(decision);
    group.memory.decisions.push(entry);
    appendTimelineEvent(groupId, {
      title: "Decision recorded",
      detail: entry.content,
      actor: entry.agentId || "groupflow",
      metadata: entry.metadata
    });
    return group.memory.decisions;
  }

  function updateFileState(groupId, fileState) {
    const group = requireGroup(groupId);
    requireField(fileState, "path", "updateFileState");
    const existing = group.files.find((item) => item.path === fileState.path);
    if (existing) Object.assign(existing, fileState);
    else group.files.push(fileState);
    appendTimelineEvent(groupId, {
      title: "File state updated",
      detail: `${fileState.path} marked as ${fileState.status || "tracked"}.`,
      actor: fileState.ownerAgentId || "groupflow",
      metadata: fileState.metadata
    });
    return group.files;
  }

  function appendTimelineEvent(groupId, event) {
    const group = requireGroup(groupId);
    group.timeline.push({
      id: event.id || makeId("evt"),
      title: event.title || "Timeline event",
      detail: event.detail || "",
      actor: event.actor || "groupflow",
      at: event.at || new Date().toISOString(),
      metadata: event.metadata || {}
    });
    return group.timeline;
  }

  function updateAgentState(groupId, agentId, patch) {
    const group = requireGroup(groupId);
    const agent = group.agents.find((item) => item.id === agentId);
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }
    Object.assign(agent, patch);
    appendTimelineEvent(groupId, {
      title: "Agent state updated",
      detail: `${agent.name || agent.id} state changed to ${agent.status || "updated"}.`,
      actor: agent.id,
      metadata: patch.metadata
    });
    return agent;
  }

  function summarizeGroup(groupId) {
    const group = requireGroup(groupId);
    const decisions = group.memory.decisions.slice(-3).map(readEntry).join(" ");
    const findings = group.memory.findings.slice(-3).map(readEntry).join(" ");
    const questions = group.memory.openQuestions.slice(-2).map(readEntry).join(" ");
    return [group.objective, decisions, findings, questions].filter(Boolean).join(" ");
  }

  function pauseGroup(groupId, reason = "Paused by host runtime.") {
    const group = requireGroup(groupId);
    group.status = "paused";
    group.resumeState = "available";
    appendTimelineEvent(groupId, {
      title: "Group paused",
      detail: reason
    });
    return group;
  }

  function resumeGroup(groupId) {
    const group = requireGroup(groupId);
    group.status = "running";
    group.resumeState = "restored";
    group.memoryHealth = "synced";
    appendTimelineEvent(groupId, {
      title: "Group resumed",
      detail: "Group Memory, File State Ledger, and open questions were restored together."
    });
    return group;
  }

  function listArtifacts(groupId) {
    const group = requireGroup(groupId);
    return clone(
      group.files.filter((file) => {
        return file.role === "artifact" || file.status === "generated" || file.status === "modified";
      })
    );
  }

  function requireGroup(groupId) {
    const group = state.groups[groupId];
    if (!group) throw new Error(`Unknown group: ${groupId}`);
    return group;
  }
}

const memorySections = ["objective", "constraints", "decisions", "findings", "openQuestions"];

function normalizeMemory(memory = {}) {
  return memorySections.reduce((result, section) => {
    result[section] = memory[section] || [];
    return result;
  }, {});
}

function normalizeEntry(entry) {
  if (typeof entry === "string") return { content: entry };
  return entry;
}

function readEntry(entry) {
  return typeof entry === "string" ? entry : entry.content;
}

function requireField(value, field, caller) {
  if (!value || !value[field]) throw new Error(`${caller} requires ${field}`);
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
