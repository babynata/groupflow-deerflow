# Known Limitations

GroupFlow V1.0 is production-ready as a local runtime and integration contract, not as a hosted multi-user service.

## Runtime

- State is in memory unless explicitly saved through JSON storage.
- There is no concurrency control for simultaneous writers.
- There is no schema migration layer.
- Runtime validation is intentionally lightweight.

## MCP-style Tools

- The tool server is dependency-free and protocol-shaped.
- It does not claim official MCP SDK transport compatibility.
- Tool inputs are trusted host inputs in V1.0.

## DeerFlow Adapter

- The adapter validates event mapping, not a live DeerFlow repository integration.
- Host events are expected to be normalized before reaching GroupFlow.
- File state is metadata supplied by the host, not a filesystem scan.

## Workspace

- The workspace is a static local interface.
- It does not include multi-project persistence controls yet.
- It does not include authentication, sharing, or deployment features.

## Storage and Replay

- JSON storage is suitable for local evaluation and adapter-level validation.
- Checkpoints are written as files without locking.
- Replay is timeline-based and does not reconstruct every intermediate object mutation.

