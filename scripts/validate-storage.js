import { runStorageReplayLifecycle } from "../examples/storage-replay-lifecycle.js";

const summary = runStorageReplayLifecycle();
const checks = [
  ["state persisted project", summary.loadedProjectCount === 1],
  ["state persisted group", summary.loadedGroupCount === 1],
  ["checkpoint written", summary.checkpointCount === 1],
  ["timeline replay available", summary.replayCount >= 5],
  ["memory versions available", summary.memoryVersionCount >= 3],
  ["file state versions available", summary.fileVersionCount >= 2],
  ["finding restored", summary.restoredFinding.includes("JSON storage")]
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

