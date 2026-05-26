# Storage, Checkpoints, and Replay

GroupFlow uses dependency-free JSON file storage through Node standard library APIs.

This keeps V1.0 easy to run while preserving a clear upgrade path to SQLite or Postgres later.

## Storage Interface

```js
const storage = createJsonFileStorage({ baseDir });

storage.save(runtime.snapshot());
const state = storage.load();
storage.writeCheckpoint(groupId, checkpoint);
const checkpoints = storage.listCheckpoints(groupId);
```

## Replay Interface

```js
replayTimeline(state, groupId);
getMemoryVersions(state, groupId);
getFileStateVersions(state, groupId);
```

## Current Guarantees

- Runtime state can be saved and loaded as JSON.
- Group checkpoints can be written and listed.
- Timeline events can be replayed in order.
- Memory and file state versions can be inspected from timeline events plus current snapshots.

## Current Limits

- JSON storage is process-local and file-based.
- There is no concurrent writer coordination.
- There is no database migration layer.
- SQLite/Postgres are intentionally deferred until after V1.0.

