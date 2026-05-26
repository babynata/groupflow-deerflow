import fs from "node:fs";
import path from "node:path";

export function createJsonFileStorage(options = {}) {
  const baseDir = options.baseDir || path.join(process.cwd(), ".groupflow-state");
  const statePath = path.join(baseDir, "state.json");
  const checkpointDir = path.join(baseDir, "checkpoints");

  return {
    save,
    load,
    writeCheckpoint,
    listCheckpoints
  };

  function save(state) {
    ensureDir(baseDir);
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    return { path: statePath };
  }

  function load() {
    if (!fs.existsSync(statePath)) return null;
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  }

  function writeCheckpoint(groupId, checkpoint) {
    const groupDir = path.join(checkpointDir, safeName(groupId));
    ensureDir(groupDir);
    const at = checkpoint.at || new Date().toISOString();
    const filePath = path.join(groupDir, `${safeName(at)}.json`);
    const payload = {
      groupId,
      at,
      ...checkpoint
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    return payload;
  }

  function listCheckpoints(groupId) {
    const groupDir = path.join(checkpointDir, safeName(groupId));
    if (!fs.existsSync(groupDir)) return [];
    return fs
      .readdirSync(groupDir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => JSON.parse(fs.readFileSync(path.join(groupDir, file), "utf8")));
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9_.-]/g, "_");
}

