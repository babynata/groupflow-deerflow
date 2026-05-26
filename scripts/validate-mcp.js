import { runMcpToolLifecycle } from "../examples/mcp-tool-lifecycle.js";

const summary = runMcpToolLifecycle();
const checks = [
  ["tool registry exposes expected tools", summary.toolCount >= 13],
  ["before-run context is scoped to agent", summary.beforeRunAgent === "researcher"],
  ["final status is running", summary.finalStatus === "running"],
  ["resume state is restored", summary.resumeState === "restored"],
  ["summary includes finding", summary.summaryIncludesFinding],
  ["artifact listed", summary.artifactCount === 1]
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

