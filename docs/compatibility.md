# Compatibility Notes

GroupFlow V1.0 is dependency-free and designed to run in modern Node.js environments with ES module support.

## Runtime

- Node.js with ES modules
- No npm dependencies
- Browser workspace served by the local `scripts/serve.js` helper
- JSON storage through Node standard library APIs

## DeerFlow

GroupFlow does not depend on DeerFlow private classes, internal paths, or repository layout.

The current integration model is adapter-level:

- DeerFlow or a DeerFlow-like host emits lifecycle events.
- The adapter maps those events into GroupFlow runtime operations.
- GroupFlow returns structured state for context, replay, and inspection.

## MCP

The current MCP-style tool server is not an official MCP SDK implementation.

It provides:

- a stable tool registry
- a `callTool(name, input)` executor
- tool names that mirror the Core Runtime API

Official MCP SDK compatibility is intentionally deferred until after V1.0.

## Storage

V1.0 uses JSON file storage.

SQLite and Postgres are not part of V1.0. They can be added later behind the same storage concepts:

- `save`
- `load`
- `writeCheckpoint`
- `listCheckpoints`

