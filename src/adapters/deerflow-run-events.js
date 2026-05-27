export function readDeerFlowRunEventsJsonl(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid DeerFlow RunEventStore JSONL at line ${index + 1}: ${error.message}`);
      }
    });
}

export function transformDeerFlowRunEvents(records, options = {}) {
  const events = [];
  const sourceRecords = [...records].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  const first = sourceRecords[0] || {};
  const ids = resolveIds(first, options);
  const seenAgents = new Set();
  let groupCreated = false;
  let interrupted = false;

  ensureGroup();
  ensureAgent(ids.leadAgentId, "DeerFlow Lead Agent", "Coordinate the DeerFlow graph run.");

  for (const record of sourceRecords) {
    const metadata = sourceMetadata(record);

    if (record.event_type === "run.start") {
      if (interrupted) {
        events.push({
          type: "run_resumed",
          groupId: ids.groupId,
          metadata
        });
        interrupted = false;
      }
      events.push({
        type: "agent_started",
        groupId: ids.groupId,
        agentId: ids.leadAgentId,
        metadata
      });
      continue;
    }

    if (record.event_type === "run.end") {
      if (record.metadata?.status === "interrupted" || record.content?.status === "interrupted") {
        interrupted = true;
        events.push({
          type: "run_paused",
          groupId: ids.groupId,
          reason: "DeerFlow run status became interrupted.",
          metadata
        });
        continue;
      }
      events.push({
        type: "timeline_event",
        groupId: ids.groupId,
        title: "DeerFlow run ended",
        detail: "DeerFlow RunEventStore recorded a completed run.",
        actor: "deerflow",
        at: record.created_at,
        metadata
      });
      continue;
    }

    if (record.event_type === "run.error" || record.event_type === "llm.error") {
      events.push({
        type: "timeline_event",
        groupId: ids.groupId,
        title: "DeerFlow run error",
        detail: textFromContent(record.content) || "DeerFlow RunEventStore recorded an error.",
        actor: "deerflow",
        at: record.created_at,
        metadata
      });
      continue;
    }

    if (record.event_type === "llm.human.input") {
      events.push({
        type: "timeline_event",
        groupId: ids.groupId,
        title: "DeerFlow user input recorded",
        detail: truncate(textFromContent(record.content), 240),
        actor: "deerflow",
        at: record.created_at,
        metadata
      });
      continue;
    }

    if (record.event_type === "llm.ai.response") {
      const caller = record.metadata?.caller || ids.leadAgentId;
      const agentId = normalizeAgentId(caller);
      ensureAgent(agentId, agentNameFromCaller(caller), `Mapped from DeerFlow caller ${caller}.`);
      for (const call of extractToolCalls(record.content)) {
        events.push({
          type: "tool_called",
          groupId: ids.groupId,
          agentId,
          toolName: call.name,
          detail: `${agentId} called ${call.name}.`,
          at: record.created_at,
          metadata: { ...metadata, toolCallId: call.id || null, toolArgs: call.args || {} }
        });
        appendFileEventsFromToolCall(call, agentId, record, metadata);
      }

      const text = textFromContent(record.content);
      if (caller.startsWith("subagent:") && text) {
        events.push({
          type: "subagent_result",
          groupId: ids.groupId,
          agentId,
          result: {
            finding: truncate(text, 500),
            status: "ready",
            at: record.created_at,
            metadata
          }
        });
      } else if (text) {
        events.push({
          type: "timeline_event",
          groupId: ids.groupId,
          title: "DeerFlow assistant response",
          detail: truncate(text, 300),
          actor: agentId,
          at: record.created_at,
          metadata
        });
      }
      continue;
    }

    if (record.event_type === "llm.tool.result") {
      const toolName = toolNameFromRecord(record);
      const agentId = toolName === "task" ? "subagent_task" : ids.leadAgentId;
      if (toolName === "task") {
        ensureAgent(agentId, "DeerFlow Task Subagent", "Result returned through DeerFlow task tool.");
        events.push({
          type: "subagent_result",
          groupId: ids.groupId,
          agentId,
          result: {
            finding: truncate(textFromContent(record.content), 500),
            files: [],
            status: "ready",
            at: record.created_at,
            metadata
          }
        });
      } else {
        events.push({
          type: "timeline_event",
          groupId: ids.groupId,
          title: "DeerFlow tool result recorded",
          detail: truncate(textFromContent(record.content), 300),
          actor: agentId,
          at: record.created_at,
          metadata: { ...metadata, toolName }
        });
      }

      for (const filePath of artifactPathsFromRecord(record)) {
        events.push({
          type: "file_written",
          groupId: ids.groupId,
          agentId,
          path: filePath,
          role: "artifact",
          status: "generated",
          summary: `Artifact surfaced by DeerFlow ${toolName || "tool"} result.`,
          at: record.created_at,
          metadata
        });
      }
    }

    if (record.metadata?.status === "interrupted") {
      interrupted = true;
      events.push({
        type: "run_paused",
        groupId: ids.groupId,
        reason: "DeerFlow run status became interrupted.",
        metadata
      });
    }
  }

  return events;

  function ensureGroup() {
    if (groupCreated) return;
    events.push({
      type: "task_created",
      projectId: ids.projectId,
      projectName: ids.projectName,
      projectSummary: "Project mapped from DeerFlow RunEventStore records.",
      groupId: ids.groupId,
      groupTitle: ids.groupTitle,
      objective: ids.objective
    });
    groupCreated = true;
  }

  function ensureAgent(id, name, focus) {
    if (seenAgents.has(id)) return;
    seenAgents.add(id);
    events.push({
      type: "agent_registered",
      groupId: ids.groupId,
      agent: {
        id,
        name,
        status: "ready",
        focus,
        context: 0
      }
    });
  }

  function appendFileEventsFromToolCall(call, agentId, record, metadata) {
    const paths = pathsFromToolCall(call);
    const mode = classifyToolCall(call.name);
    for (const filePath of paths) {
      events.push({
        type: mode === "read" ? "file_read" : "file_written",
        groupId: ids.groupId,
        agentId,
        path: filePath,
        role: mode === "read" ? "source" : "artifact",
        status: mode === "read" ? "read" : "modified",
        summary: `Mapped from DeerFlow ${call.name} tool call.`,
        at: record.created_at,
        metadata
      });
    }
  }
}

function resolveIds(record, options) {
  const threadId = options.threadId || record.thread_id || "deerflow-thread";
  const runId = options.runId || record.run_id || "deerflow-run";
  const groupId = options.groupId || safeId(threadId);
  const projectId = options.projectId || `deerflow_${safeId(threadId)}`;
  return {
    threadId,
    runId,
    groupId,
    projectId,
    projectName: options.projectName || `DeerFlow Thread ${threadId}`,
    groupTitle: options.groupTitle || `DeerFlow Run ${runId}`,
    objective: options.objective || "Record DeerFlow RunEventStore events as shared GroupFlow state.",
    leadAgentId: options.leadAgentId || "lead_agent"
  };
}

function sourceMetadata(record) {
  return {
    deerflowThreadId: record.thread_id || null,
    deerflowRunId: record.run_id || null,
    deerflowSeq: record.seq || null,
    deerflowEventType: record.event_type || null,
    deerflowCreatedAt: record.created_at || null
  };
}

function extractToolCalls(content) {
  const calls = content?.tool_calls || content?.additional_kwargs?.tool_calls || [];
  return calls
    .map((call) => ({
      name: call.name || call.function?.name,
      args: call.args || parseJson(call.function?.arguments) || {},
      id: call.id || call.call_id || null
    }))
    .filter((call) => call.name);
}

function toolNameFromRecord(record) {
  return record.content?.name || record.metadata?.tool_name || record.metadata?.toolName || "";
}

function artifactPathsFromRecord(record) {
  const direct = [
    ...(record.content?.artifacts || []),
    ...(record.metadata?.artifacts || []),
    ...(record.content?.filepaths || []),
    ...(record.metadata?.filepaths || [])
  ];
  return unique([...direct, ...extractPaths(textFromContent(record.content))]);
}

function pathsFromToolCall(call) {
  const args = call.args || {};
  return unique([
    args.path,
    args.filepath,
    ...(Array.isArray(args.paths) ? args.paths : []),
    ...(Array.isArray(args.filepaths) ? args.filepaths : [])
  ].filter((item) => typeof item === "string" && item.trim()));
}

function classifyToolCall(name) {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("read") || normalized.includes("view")) return "read";
  return "write";
}

function textFromContent(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (typeof content.content === "string") return content.content;
  if (Array.isArray(content.content)) {
    return content.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  if (typeof content.text === "string") return content.text;
  return "";
}

function extractPaths(text) {
  if (!text) return [];
  return unique(text.match(/(?:\/mnt\/user-data\/outputs\/|outputs\/|docs\/|reports\/)[^\s'",)]+/g) || []);
}

function normalizeAgentId(caller) {
  return String(caller || "lead_agent").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "lead_agent";
}

function agentNameFromCaller(caller) {
  if (String(caller).startsWith("subagent:")) return `DeerFlow Subagent ${String(caller).slice("subagent:".length)}`;
  if (caller === "lead_agent") return "DeerFlow Lead Agent";
  return `DeerFlow ${caller}`;
}

function safeId(value) {
  return String(value).replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "deerflow";
}

function parseJson(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function truncate(value, max) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
