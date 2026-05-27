import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { createDeerFlowAdapter } from "../src/adapters/deerflow-adapter.js";
import {
  readDeerFlowRunEventsJsonl,
  transformDeerFlowRunEvents
} from "../src/adapters/deerflow-run-events.js";

const deerFlowRunEventsJsonl = [
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_1",
    event_type: "run.start",
    category: "trace",
    content: { chain: "DeerFlowGraph" },
    metadata: { caller: "lead_agent" },
    seq: 1,
    created_at: "2026-05-27T00:00:00.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_1",
    event_type: "llm.human.input",
    category: "message",
    content: { type: "human", content: "Research how GroupFlow should attach to DeerFlow." },
    metadata: { caller: "lead_agent" },
    seq: 2,
    created_at: "2026-05-27T00:00:01.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_1",
    event_type: "llm.ai.response",
    category: "message",
    content: {
      type: "ai",
      content: "",
      tool_calls: [
        {
          name: "task",
          args: { description: "Inspect run events", subagent_type: "general-purpose" },
          id: "call_task_1"
        }
      ]
    },
    metadata: { caller: "lead_agent" },
    seq: 3,
    created_at: "2026-05-27T00:00:02.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_1",
    event_type: "llm.tool.result",
    category: "message",
    content: {
      type: "tool",
      name: "task",
      content: "DeerFlow RunEventStore records are enough for GroupFlow to reconstruct shared state."
    },
    metadata: { caller: "lead_agent" },
    seq: 4,
    created_at: "2026-05-27T00:00:03.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_1",
    event_type: "llm.ai.response",
    category: "message",
    content: {
      type: "ai",
      content: "",
      tool_calls: [
        {
          name: "present_files",
          args: { filepaths: ["/mnt/user-data/outputs/groupflow-run-event-report.md"] },
          id: "call_present_1"
        }
      ]
    },
    metadata: { caller: "lead_agent" },
    seq: 5,
    created_at: "2026-05-27T00:00:04.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_1",
    event_type: "llm.tool.result",
    category: "message",
    content: {
      type: "tool",
      name: "present_files",
      content: "Successfully presented files",
      artifacts: ["/mnt/user-data/outputs/groupflow-run-event-report.md"]
    },
    metadata: { caller: "lead_agent" },
    seq: 6,
    created_at: "2026-05-27T00:00:05.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_1",
    event_type: "run.end",
    category: "outputs",
    content: { status: "interrupted" },
    metadata: { caller: "lead_agent", status: "interrupted" },
    seq: 7,
    created_at: "2026-05-27T00:00:06.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_2",
    event_type: "run.start",
    category: "trace",
    content: { chain: "DeerFlowGraph" },
    metadata: { caller: "lead_agent" },
    seq: 8,
    created_at: "2026-05-27T00:00:07.000Z"
  },
  {
    thread_id: "thread_groupflow_events",
    run_id: "run_groupflow_events_2",
    event_type: "run.end",
    category: "outputs",
    content: { status: "success" },
    metadata: { caller: "lead_agent" },
    seq: 9,
    created_at: "2026-05-27T00:00:08.000Z"
  }
]
  .map((record) => JSON.stringify(record))
  .join("\n");

export function runDeerFlowRunEventsLifecycle() {
  const records = readDeerFlowRunEventsJsonl(deerFlowRunEventsJsonl);
  const events = transformDeerFlowRunEvents(records, {
    objective: "Validate DeerFlow RunEventStore records as GroupFlow input."
  });

  const runtime = createGroupMemoryRuntime();
  const adapter = createDeerFlowAdapter(runtime);

  for (const event of events) {
    adapter.handleEvent(event);
  }

  const state = runtime.snapshot();
  const groupId = "thread_groupflow_events";
  const group = state.groups[groupId];
  const artifacts = runtime.listArtifacts(groupId);

  return {
    recordCount: records.length,
    transformedEventCount: events.length,
    groupId,
    findingCount: group.memory.findings.length,
    fileCount: group.files.length,
    artifactCount: artifacts.length,
    status: group.status,
    resumeState: group.resumeState,
    timelineCount: group.timeline.length,
    metadataEventCount: group.timeline.filter((event) => event.metadata?.deerflowRunId).length
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runDeerFlowRunEventsLifecycle(), null, 2));
}
