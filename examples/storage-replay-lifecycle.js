import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { createJsonFileStorage } from "../src/storage/json-storage.js";
import { replayTimeline, getMemoryVersions, getFileStateVersions } from "../src/replay/replay.js";

export function runStorageReplayLifecycle() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "groupflow-state-"));
  const storage = createJsonFileStorage({ baseDir });
  const runtime = createGroupMemoryRuntime();

  runtime.createProject({ id: "storage-project", name: "Storage Project" });
  runtime.createGroup({
    id: "storage-group",
    projectId: "storage-project",
    objective: "Validate persistence, checkpoint, and replay."
  });
  runtime.registerAgent("storage-group", {
    id: "writer",
    name: "Writer",
    status: "ready",
    focus: "Produce persisted group state.",
    context: 10
  });
  runtime.appendFinding("storage-group", {
    agentId: "writer",
    content: "JSON storage can persist GroupFlow runtime state.",
    source: "storage_run"
  });
  runtime.recordDecision("storage-group", {
    agentId: "writer",
    content: "Checkpoint files should preserve group memory and file state.",
    reason: "Recovery needs a durable restore point."
  });
  runtime.updateFileState("storage-group", {
    path: "reports/storage-output.md",
    role: "artifact",
    status: "modified",
    ownerAgentId: "writer",
    summary: "Persisted output."
  });
  runtime.pauseGroup("storage-group", "Checkpoint before recovery validation.");
  runtime.resumeGroup("storage-group");

  const snapshot = runtime.snapshot();
  storage.save(snapshot);
  storage.writeCheckpoint("storage-group", {
    label: "after-writer-output",
    state: snapshot.groups["storage-group"]
  });

  const loaded = storage.load();
  const checkpoints = storage.listCheckpoints("storage-group");
  const replay = replayTimeline(loaded, "storage-group");
  const memoryVersions = getMemoryVersions(loaded, "storage-group");
  const fileVersions = getFileStateVersions(loaded, "storage-group");

  return {
    baseDir,
    loadedProjectCount: Object.keys(loaded.projects).length,
    loadedGroupCount: Object.keys(loaded.groups).length,
    checkpointCount: checkpoints.length,
    replayCount: replay.length,
    memoryVersionCount: memoryVersions.length,
    fileVersionCount: fileVersions.length,
    restoredFinding: loaded.groups["storage-group"].memory.findings[0].content
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runStorageReplayLifecycle(), null, 2));
}
