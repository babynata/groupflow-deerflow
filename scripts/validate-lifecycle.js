import { runDeerFlowLifecycle } from "../examples/deerflow-run-lifecycle.js";

const summary = runDeerFlowLifecycle();
const checks = [
  ["before-run context includes summary", summary.beforeRunSummaryAvailable],
  ["architect sees researcher finding", summary.architectSawFinding],
  ["reviewer sees paused state", summary.reviewerSawPausedState],
  ["final group status is running", summary.finalStatus === "running"],
  ["resume state is restored", summary.resumeState === "restored"],
  ["memory health is synced", summary.memoryHealth === "synced"],
  ["finding recorded", summary.findingCount === 1],
  ["decision recorded", summary.decisionCount === 1],
  ["file states recorded", summary.fileCount === 2],
  ["artifacts listed", summary.artifactCount === 2],
  ["timeline events recorded", summary.timelineCount >= 10]
];

let failures = 0;

for (const [name, passed] of checks) {
  if (passed) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL ${name}`);
  }
}

if (failures > 0) {
  console.error(JSON.stringify(summary, null, 2));
  process.exitCode = 1;
}

