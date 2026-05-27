import { runDeerFlowRunEventsLifecycle } from "../examples/deerflow-run-events-lifecycle.js";

const summary = runDeerFlowRunEventsLifecycle();
const checks = [
  ["DeerFlow JSONL records parsed", summary.recordCount === 9],
  ["RunEventStore records transformed", summary.transformedEventCount >= 9],
  ["GroupFlow finding generated", summary.findingCount >= 1],
  ["GroupFlow file state generated", summary.fileCount >= 1],
  ["GroupFlow artifact listed", summary.artifactCount >= 1],
  ["interrupted run resumes group", summary.status === "running" && summary.resumeState === "restored"],
  ["timeline records DeerFlow metadata", summary.metadataEventCount >= 5],
  ["timeline contains run activity", summary.timelineCount >= 9]
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
