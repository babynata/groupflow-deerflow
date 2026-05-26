import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";

export function runDeerFlowLifecycle() {
  const groupFlow = createGroupMemoryRuntime();

  groupFlow.createProject({
    id: "deerflow-project",
    name: "DeerFlow Group Memory Evaluation",
    summary: "Validate GroupFlow as a shared state layer for a DeerFlow long-running run."
  });

  groupFlow.createGroup({
    id: "research-group",
    projectId: "deerflow-project",
    title: "Research Group",
    status: "ready",
    objective: "Assess how DeerFlow can use GroupFlow for shared memory and file state."
  });

  groupFlow.registerAgent("research-group", {
    id: "researcher",
    name: "Researcher",
    status: "ready",
    focus: "Collect evidence and produce structured findings.",
    context: 15
  });

  groupFlow.registerAgent("research-group", {
    id: "architect",
    name: "Architect",
    status: "ready",
    focus: "Convert findings into integration decisions.",
    context: 12
  });

  groupFlow.registerAgent("research-group", {
    id: "reviewer",
    name: "Reviewer",
    status: "ready",
    focus: "Check whether the group state is resumable and auditable.",
    context: 10
  });

  const researcherContext = groupFlow.getGroupContext("research-group", {
    forAgentId: "researcher"
  });

  groupFlow.updateAgentState("research-group", "researcher", {
    status: "running",
    context: 42
  });

  groupFlow.appendFinding("research-group", {
    agentId: "researcher",
    content: "DeerFlow sub-agents need a shared group memory beyond private context.",
    source: "researcher_output"
  });

  groupFlow.updateFileState("research-group", {
    path: "reports/group-memory-research.md",
    role: "artifact",
    status: "modified",
    ownerAgentId: "researcher",
    summary: "Summarizes why DeerFlow long-running work needs group-level state."
  });

  const architectContext = groupFlow.getGroupContext("research-group", {
    forAgentId: "architect"
  });

  groupFlow.updateAgentState("research-group", "architect", {
    status: "running",
    context: 38
  });

  groupFlow.recordDecision("research-group", {
    agentId: "architect",
    content: "GroupFlow should integrate as an external runtime before any native DeerFlow change.",
    reason: "This keeps the first integration low-intrusion and easy to validate."
  });

  groupFlow.updateFileState("research-group", {
    path: "docs/deerflow-integration.md",
    role: "artifact",
    status: "modified",
    ownerAgentId: "architect",
    summary: "Documents before-run context and after-run structured writes."
  });

  groupFlow.pauseGroup("research-group", "Reviewer checkpoint requested before continuing.");

  const reviewerContext = groupFlow.getGroupContext("research-group", {
    forAgentId: "reviewer"
  });

  groupFlow.updateAgentState("research-group", "reviewer", {
    status: "running",
    context: 34
  });

  groupFlow.appendTimelineEvent("research-group", {
    title: "Reviewer checkpoint completed",
    detail: "The group can resume from objective, memory, file state, and open questions.",
    actor: "reviewer"
  });

  groupFlow.resumeGroup("research-group");

  const finalContext = groupFlow.getGroupContext("research-group", {
    forAgentId: "reviewer"
  });
  const artifacts = groupFlow.listArtifacts("research-group");
  const state = groupFlow.snapshot();
  const group = state.groups["research-group"];

  return {
    projectId: "deerflow-project",
    groupId: "research-group",
    beforeRunSummaryAvailable: researcherContext.summary.length > 0,
    architectSawFinding: architectContext.summary.includes("shared group memory"),
    reviewerSawPausedState: reviewerContext.status === "paused",
    finalStatus: finalContext.status,
    resumeState: finalContext.resumeState,
    memoryHealth: finalContext.memoryHealth,
    findingCount: group.memory.findings.length,
    decisionCount: group.memory.decisions.length,
    fileCount: group.files.length,
    artifactCount: artifacts.length,
    timelineCount: group.timeline.length,
    finalSummary: finalContext.summary
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runDeerFlowLifecycle(), null, 2));
}

