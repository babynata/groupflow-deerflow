import { createGroupMemoryRuntime } from "./src/core/group-memory-runtime.js";
import { groupFlowSeedData } from "./src/fixtures/seed-data.js";

const runtime = createGroupMemoryRuntime(groupFlowSeedData);
let state = runtime.snapshot();
let activeGroupId = "product-research";
let stepIndex = 0;

const runSteps = [
  {
    agentId: "researcher",
    finding:
      "A DeerFlow group needs a shared state layer so sub-agents do not depend on chat history for coordination.",
    file: {
      path: "docs/vision.md",
      role: "artifact",
      status: "modified",
      summary: "Updated with DeerFlow group memory positioning."
    }
  },
  {
    agentId: "product-pm",
    decision:
      "V0.1 will present Project, Group, Memory, Files, Timeline, and Resume in one static workspace.",
    file: {
      path: "docs/iteration-plan.md",
      role: "artifact",
      status: "modified",
      summary: "V0.1 acceptance criteria aligned to DeerFlow workspace."
    }
  },
  {
    agentId: "runtime-architect",
    finding:
      "The cleanest first integration is get_group_context before a sub-agent run and structured writes after the run.",
    file: {
      path: "src/adapters/deerflow-adapter.js",
      role: "source",
      status: "modified",
      summary: "Adapter boundary updated with before-run and after-run hooks."
    }
  },
  {
    agentId: "mcp-builder",
    decision:
      "MCP tools should mirror the runtime API before GroupFlow attempts a native DeerFlow PR.",
    file: {
      path: "src/adapters/mcp-tools.js",
      role: "config",
      status: "modified",
      summary: "MCP surface refined for DeerFlow tool usage."
    }
  }
];

const elements = {
  projectCount: document.querySelector("#projectCount"),
  projectList: document.querySelector("#projectList"),
  projectName: document.querySelector("#projectName"),
  projectSummary: document.querySelector("#projectSummary"),
  groupStatus: document.querySelector("#groupStatus"),
  resumeState: document.querySelector("#resumeState"),
  memoryHealth: document.querySelector("#memoryHealth"),
  groupCount: document.querySelector("#groupCount"),
  groupTabs: document.querySelector("#groupTabs"),
  activeGroupTitle: document.querySelector("#activeGroupTitle"),
  activeObjective: document.querySelector("#activeObjective"),
  memoryCount: document.querySelector("#memoryCount"),
  memorySummary: document.querySelector("#memorySummary"),
  memorySections: document.querySelector("#memorySections"),
  agentCount: document.querySelector("#agentCount"),
  agentBoard: document.querySelector("#agentBoard"),
  timelineCount: document.querySelector("#timelineCount"),
  timelineFilter: document.querySelector("#timelineFilter"),
  timeline: document.querySelector("#timeline"),
  fileCount: document.querySelector("#fileCount"),
  artifactCount: document.querySelector("#artifactCount"),
  artifactList: document.querySelector("#artifactList"),
  fileList: document.querySelector("#fileList"),
  runStepButton: document.querySelector("#runStepButton"),
  resumeButton: document.querySelector("#resumeButton"),
  compactButton: document.querySelector("#compactButton"),
  refreshFilesButton: document.querySelector("#refreshFilesButton")
};

function render() {
  state = runtime.snapshot();
  const project = state.projects.deerflow2;
  const group = state.groups[activeGroupId];
  const groups = project.groupIds.map((id) => state.groups[id]);
  const projects = Object.values(state.projects);

  elements.projectName.textContent = project.name;
  elements.projectSummary.textContent = project.summary;
  elements.projectCount.textContent = projects.length;
  elements.groupStatus.textContent = group.status;
  elements.resumeState.textContent = group.resumeState;
  elements.memoryHealth.textContent = group.memoryHealth;
  elements.groupCount.textContent = groups.length;
  elements.activeGroupTitle.textContent = group.title;
  elements.activeObjective.textContent = group.objective;

  renderProjects(projects);
  renderTabs(groups);
  renderMemory(group);
  renderAgents(group);
  renderTimeline(group);
  renderFiles(group);
  renderArtifacts(group);
}

function renderProjects(projects) {
  elements.projectList.innerHTML = projects
    .map(
      (project) => `
        <article class="project-row">
          <strong>${escapeHtml(project.name)}</strong>
          <span>${escapeHtml(project.summary || "")}</span>
          <small>${project.groupIds.length} groups</small>
        </article>
      `
    )
    .join("");
}

function renderTabs(groups) {
  elements.groupTabs.innerHTML = groups
    .map(
      (group) => `
        <button class="group-tab ${group.id === activeGroupId ? "active" : ""}" data-group-id="${group.id}" type="button">
          <strong>${escapeHtml(group.title)}</strong>
          <span>${escapeHtml(group.objective)}</span>
          <small>${group.status} · ${group.files.length} files · ${group.timeline.length} events</small>
        </button>
      `
    )
    .join("");

  elements.groupTabs.querySelectorAll(".group-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeGroupId = button.dataset.groupId;
      render();
    });
  });
}

function renderMemory(group) {
  const labels = {
    objective: "Objective",
    constraints: "Constraints",
    decisions: "Decisions",
    findings: "Findings",
    openQuestions: "Open Questions"
  };
  const entries = Object.values(group.memory).reduce((count, items) => count + items.length, 0);
  elements.memoryCount.textContent = `${entries} entries`;
  elements.memorySummary.textContent = runtime.summarizeGroup(group.id);
  elements.memorySections.innerHTML = Object.entries(group.memory)
    .map(([section, items]) => {
      const list = items.map((item) => `<li>${escapeHtml(readEntry(item))}</li>`).join("");
      return `
        <section class="memory-block">
          <h3>${labels[section] || section}</h3>
          <ul>${list}</ul>
        </section>
      `;
    })
    .join("");
}

function renderAgents(group) {
  elements.agentCount.textContent = `${group.agents.length} agents`;
  elements.agentBoard.innerHTML = group.agents
    .map(
      (agent) => `
        <article class="agent-card">
          <header>
            <strong>${escapeHtml(agent.name)}</strong>
            <span class="pill ${agent.status}">${agent.status}</span>
          </header>
          <p>${escapeHtml(agent.focus)}</p>
          <div class="meter" aria-label="${escapeHtml(agent.name)} private context">
            <span style="width: ${agent.context}%"></span>
          </div>
          <small>${agent.context}% private context loaded</small>
        </article>
      `
    )
    .join("");
}

function renderTimeline(group) {
  const filter = elements.timelineFilter.value;
  const events = group.timeline.filter((event) => {
    if (filter === "all") return true;
    if (filter === "agent") return event.actor && event.actor !== "groupflow";
    if (filter === "file") return event.title.toLowerCase().includes("file");
    if (filter === "group") return event.title.toLowerCase().includes("group");
    return true;
  });
  elements.timelineCount.textContent = `${events.length} events`;
  elements.timeline.innerHTML = events
    .map(
      (event) => `
        <li>
          <span>${escapeHtml(event.actor || "groupflow")}</span>
          <strong>${escapeHtml(event.title)}</strong>
          <p>${escapeHtml(event.detail || "")}</p>
        </li>
      `
    )
    .join("");
}

function renderFiles(group) {
  elements.fileCount.textContent = `${group.files.length} files`;
  elements.fileList.innerHTML = group.files
    .map(
      (file) => `
        <article class="file-row">
          <div>
            <strong>${escapeHtml(file.path)}</strong>
            <p>${escapeHtml(file.summary || "")}</p>
            <small>${escapeHtml(file.role || "tracked")} · ${escapeHtml(file.ownerAgentId || "groupflow")}</small>
          </div>
          <span class="file-status ${file.status}">${escapeHtml(file.status || "tracked")}</span>
        </article>
      `
    )
    .join("");
}

function renderArtifacts(group) {
  const artifacts = runtime.listArtifacts(group.id);
  elements.artifactCount.textContent = artifacts.length;
  elements.artifactList.innerHTML = artifacts
    .map(
      (file) => `
        <article class="artifact-row">
          <strong>${escapeHtml(file.path)}</strong>
          <small>${escapeHtml(file.status || "tracked")}</small>
        </article>
      `
    )
    .join("");
}

function runNextStep() {
  const group = state.groups[activeGroupId];
  const step = runSteps[stepIndex % runSteps.length];
  const agent = group.agents.find((item) => item.id === step.agentId) || group.agents[0];
  const agentId = agent?.id || "groupflow";

  if (step.finding) {
    runtime.appendFinding(activeGroupId, {
      agentId,
      content: step.finding,
      source: "v0.1_workspace_step"
    });
  }

  if (step.decision) {
    runtime.recordDecision(activeGroupId, {
      agentId,
      content: step.decision,
      reason: "V0.1 workspace step"
    });
  }

  runtime.updateFileState(activeGroupId, {
    ...step.file,
    ownerAgentId: agentId
  });
  runtime.updateAgentState(activeGroupId, agentId, {
    status: "running",
    context: Math.min((agent?.context || 50) + 7, 95)
  });
  runtime.resumeGroup(activeGroupId);
  stepIndex += 1;
  render();
}

function resumeGroup() {
  runtime.resumeGroup(activeGroupId);
  render();
}

function compactMemory() {
  runtime.recordDecision(activeGroupId, {
    agentId: "groupflow",
    content:
      "Memory compaction preserves DeerFlow group decisions and open questions as first-class state.",
    reason: "Compacted summary must remain resumable."
  });
  runtime.appendTimelineEvent(activeGroupId, {
    title: "Group Memory compacted",
    detail: "A fresh shared summary was created without replacing sub-agent private context.",
    actor: "groupflow"
  });
  render();
}

function refreshFiles() {
  const group = state.groups[activeGroupId];
  group.files.forEach((file) => {
    runtime.updateFileState(activeGroupId, {
      ...file,
      status: file.status === "stale" ? "stale" : file.status,
      summary:
        file.status === "stale"
          ? "Still stale after reconciliation; DeerFlow should ask for review."
          : file.summary
    });
  });
  runtime.appendTimelineEvent(activeGroupId, {
    title: "File State Ledger refreshed",
    detail: "Source, draft, artifact, config, and stale files were reconciled for resume context.",
    actor: "groupflow"
  });
  render();
}

function readEntry(entry) {
  return typeof entry === "string" ? entry : entry.content;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

elements.runStepButton.addEventListener("click", runNextStep);
elements.resumeButton.addEventListener("click", resumeGroup);
elements.compactButton.addEventListener("click", compactMemory);
elements.refreshFilesButton.addEventListener("click", refreshFiles);
elements.timelineFilter.addEventListener("change", render);

render();
