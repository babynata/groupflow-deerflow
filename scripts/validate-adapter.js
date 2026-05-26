import { runDeerFlowAdapterLifecycle } from "../examples/deerflow-adapter-lifecycle.js";

const summary = runDeerFlowAdapterLifecycle();
const checks = [
  ["agent start returns running scoped context", summary.beforeRunAgentStatus === "running"],
  ["pause event maps to paused group", summary.pausedStatus === "paused"],
  ["resume event maps to running group", summary.finalStatus === "running"],
  ["sub-agent finding recorded", summary.findingCount === 1],
  ["sub-agent decision recorded", summary.decisionCount === 1],
  ["file read and write recorded", summary.fileCount === 2],
  ["artifact listed", summary.artifactCount === 1],
  ["timeline records host events", summary.timelineCount >= 10]
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

