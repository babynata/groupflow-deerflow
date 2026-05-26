export const groupFlowSeedData = {
  projects: {
    deerflow2: {
      id: "deerflow2",
      name: "GroupFlow for DeerFlow 2.0",
      summary: "Project workspace and group memory layer for DeerFlow long-running multi-agent work.",
      groupIds: ["product-research", "deerflow-adapter", "workspace-narrative"]
    }
  },
  groups: {
    "product-research": {
      id: "product-research",
      projectId: "deerflow2",
      title: "Product Research Group",
      status: "running",
      resumeState: "available",
      objective: "Identify why DeerFlow 2.0 needs group-level memory and project workspace state.",
      memoryHealth: "synced",
      memory: {
        objective: ["Make DeerFlow long-running work inspectable, resumable, and project-aware."],
        constraints: ["Keep DeerFlow as host runtime.", "Do not replace sub-agent private context."],
        decisions: ["Use Project > Group > Sub-agent as the core product model."],
        findings: ["DeerFlow sub-agents need a shared state layer beyond chat history."],
        openQuestions: ["Which DeerFlow events should become first-class timeline events?"]
      },
      agents: [
        {
          id: "researcher",
          name: "Researcher",
          status: "running",
          focus: "Finds DeerFlow user pain points and community framing.",
          context: 76
        },
        {
          id: "product-pm",
          name: "Product PM",
          status: "running",
          focus: "Turns findings into workspace and roadmap decisions.",
          context: 63
        },
        {
          id: "critic",
          name: "Critic",
          status: "ready",
          focus: "Challenges vague memory writes and weak product claims.",
          context: 38
        }
      ],
      files: [
        {
          path: "docs/vision.md",
          role: "artifact",
          status: "modified",
          ownerAgentId: "product-pm",
          summary: "Explains why DeerFlow needs group-level memory."
        },
        {
          path: "docs/iteration-plan.md",
          role: "artifact",
          status: "generated",
          ownerAgentId: "product-pm",
          summary: "Roadmap from V0.1 workspace to DeerFlow proposal."
        }
      ],
      timeline: [
        {
          title: "Group created",
          detail: "DeerFlow product research group initialized with shared memory.",
          actor: "groupflow"
        },
        {
          title: "Finding captured",
          detail: "Project workflows need memory that is not only chat history.",
          actor: "researcher"
        }
      ]
    },
    "deerflow-adapter": {
      id: "deerflow-adapter",
      projectId: "deerflow2",
      title: "DeerFlow Adapter Group",
      status: "ready",
      resumeState: "available",
      objective: "Define how DeerFlow can call GroupFlow through MCP tools or a low-intrusion adapter.",
      memoryHealth: "ready",
      memory: {
        objective: ["Expose GroupFlow as a small runtime and tool surface."],
        constraints: ["Avoid depending on private DeerFlow internals in V0.1."],
        decisions: ["Start with MCP-style operations before deeper adapter hooks."],
        findings: ["Before-run context and after-run structured writes are enough for a first integration."],
        openQuestions: ["Should file checksums be computed by DeerFlow or passed to GroupFlow?"]
      },
      agents: [
        {
          id: "runtime-architect",
          name: "Runtime Architect",
          status: "ready",
          focus: "Defines stable runtime operations.",
          context: 52
        },
        {
          id: "mcp-builder",
          name: "MCP Builder",
          status: "ready",
          focus: "Maps runtime operations into tool contracts.",
          context: 44
        },
        {
          id: "security-reviewer",
          name: "Security Reviewer",
          status: "paused",
          focus: "Reviews memory and file permission boundaries.",
          context: 29
        }
      ],
      files: [
        {
          path: "src/adapters/deerflow-adapter.js",
          role: "source",
          status: "draft",
          ownerAgentId: "runtime-architect",
          summary: "Documents before-run and after-run adapter boundary."
        },
        {
          path: "src/adapters/mcp-tools.js",
          role: "config",
          status: "draft",
          ownerAgentId: "mcp-builder",
          summary: "Lists future MCP tool names and purposes."
        }
      ],
      timeline: [
        {
          title: "Adapter boundary selected",
          detail: "GroupFlow will remain an external extension layer.",
          actor: "runtime-architect"
        }
      ]
    },
    "workspace-narrative": {
      id: "workspace-narrative",
      projectId: "deerflow2",
      title: "Workspace Narrative Group",
      status: "paused",
      resumeState: "available",
      objective: "Make the V0.1 workspace understandable to DeerFlow community members in under one minute.",
      memoryHealth: "paused",
      memory: {
        objective: ["Show GroupFlow as a DeerFlow project workspace, not a generic agent chat."],
        constraints: ["Keep V0.1 static and dependency-free."],
        decisions: ["Lead with File State Ledger and Resume because they are concrete differentiators."],
        findings: ["A visual workspace is easier to discuss than an invisible memory API."],
        openQuestions: ["Which screenshot should become the README hero image later?"]
      },
      agents: [
        {
          id: "storyteller",
          name: "Storyteller",
          status: "paused",
          focus: "Turns the workspace into a crisp product narrative.",
          context: 41
        },
        {
          id: "ux-reviewer",
          name: "UX Reviewer",
          status: "paused",
          focus: "Checks whether the interface explains group memory visually.",
          context: 36
        }
      ],
      files: [
        {
          path: "README.md",
          role: "artifact",
          status: "modified",
          ownerAgentId: "storyteller",
          summary: "Frames GroupFlow as a DeerFlow extension."
        }
      ],
      timeline: [
        {
          title: "Narrative paused",
          detail: "Waiting for V0.1 UI to stabilize before screenshot and pitch polish.",
          actor: "storyteller"
        }
      ]
    }
  }
};
