import { runDeerFlowRunEventsLifecycle } from "../examples/deerflow-run-events-lifecycle.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { createDeerFlowAdapter } from "../src/adapters/deerflow-adapter.js";
import { readDeerFlowRunEventsJsonl, transformDeerFlowRunEvents } from "../src/adapters/deerflow-run-events.js";
import { createJsonFileStorage } from "../src/storage/json-storage.js";
import { replayTimeline } from "../src/replay/replay.js";

const summary = runDeerFlowRunEventsLifecycle();
const checks = [
  ["DeerFlow JSONL records parsed", summary.recordCount === 9],
  ["RunEventStore records transformed", summary.transformedEventCount >= 9],
  ["GroupFlow finding generated", summary.findingCount >= 1],
  ["GroupFlow file state generated", summary.fileCount >= 1],
  ["GroupFlow artifact listed", summary.artifactCount >= 1],
  ["interrupted run resumes group", summary.status === "running" && summary.resumeState === "restored"],
  ["timeline records DeerFlow metadata", summary.metadataEventCount >= 5],
  ["timeline contains run activity", summary.timelineCount >= 9],
  ...realRunFixtureChecks()
];

let failures = 0;

for (const [name, passed] of checks) {
  if (passed) console.log(`PASS ${name}`);
  else {
    failures += 1;
    console.error(`FAIL ${name}`);
  }
}

if (failures > 0) {
  console.error(JSON.stringify(summary, null, 2));
  process.exitCode = 1;
}

function realRunFixtureChecks() {
  const fixturePath = new URL("../src/fixtures/deerflow-real-run-events.jsonl", import.meta.url);
  const records = readDeerFlowRunEventsJsonl(fs.readFileSync(fixturePath, "utf8"));
  const events = transformDeerFlowRunEvents(records, {
    objective: "Validate real DeerFlow RunEventStore lifecycle and error records."
  });

  const runtime = createGroupMemoryRuntime();
  const adapter = createDeerFlowAdapter(runtime);
  for (const event of events) adapter.handleEvent(event);

  const state = runtime.snapshot();
  const groupId = "groupflow_real_run_fixture";
  const group = state.groups[groupId];
  const storage = createJsonFileStorage({ baseDir: path.join(os.tmpdir(), "groupflow-deerflow-events-validation") });
  storage.save(state);
  storage.writeCheckpoint(groupId, {
    at: "2026-05-28T04:35:45.000Z",
    reason: "Real DeerFlow JSONL fixture validation",
    state: group
  });

  const timeline = group?.timeline || [];
  const runEndedEvents = timeline.filter((event) => event.title === "DeerFlow run ended");
  const workspaceEvents = timeline.filter((event) => event.title === "DeerFlow workspace recorded");
  const errorEvents = timeline.filter((event) => event.title === "DeerFlow run error");
  const replay = replayTimeline(state, groupId);

  return [
    ["real DeerFlow JSONL fixture parsed", records.length === 10],
    ["real DeerFlow fixture transformed", events.length >= 6],
    ["real DeerFlow fixture creates group", Boolean(group)],
    ["real DeerFlow fixture keeps repeated run.end quiet", runEndedEvents.length === 1],
    ["real DeerFlow fixture records workspace metadata", workspaceEvents.length === 1 && Boolean(workspaceEvents[0].metadata?.threadData?.workspace_path)],
    ["real DeerFlow fixture records error timeline", errorEvents.length === 1 && /LLM request error/.test(errorEvents[0].detail)],
    ["real DeerFlow fixture preserves metadata", timeline.filter((event) => event.metadata?.deerflowRunId).length >= 4],
    ["real DeerFlow fixture tolerates no file ledger", group.files.length === 0],
    ["real DeerFlow fixture replay available", replay.length === timeline.length],
    ["real DeerFlow fixture checkpoint written", storage.listCheckpoints(groupId).length >= 1]
  ];
}
