import { runStorageReplayLifecycle } from "../examples/storage-replay-lifecycle.js";

const summary = runStorageReplayLifecycle();
const checks = [
  ["replay returns ordered timeline", summary.replayCount >= 5],
  ["memory snapshots are inspectable", summary.memoryVersionCount >= 3],
  ["file state snapshots are inspectable", summary.fileVersionCount >= 2]
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

