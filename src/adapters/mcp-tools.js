export const groupFlowMcpTools = [
  {
    name: "create_project",
    description: "Create a GroupFlow project for a DeerFlow workspace."
  },
  {
    name: "create_group",
    description: "Create a group-scoped memory workspace for one DeerFlow task run."
  },
  {
    name: "get_group_context",
    description: "Return scoped group context before a DeerFlow sub-agent runs."
  },
  {
    name: "append_finding",
    description: "Append a structured finding to Group Memory."
  },
  {
    name: "record_decision",
    description: "Record a group-level decision with optional reason and actor."
  },
  {
    name: "update_file_state",
    description: "Update the File State Ledger for a source, draft, artifact, config, or stale file."
  },
  {
    name: "append_timeline_event",
    description: "Append an inspectable DeerFlow run event."
  },
  {
    name: "summarize_group",
    description: "Summarize objective, recent decisions, findings, and open questions."
  },
  {
    name: "pause_group",
    description: "Mark a group as paused while preserving resume context."
  },
  {
    name: "resume_group",
    description: "Restore a group from Group Memory and File State Ledger."
  },
  {
    name: "list_group_artifacts",
    description: "List files tracked as generated or modified DeerFlow artifacts."
  }
];

