# Public Release Checklist

Use this checklist before making the repository public.

## Required

- README explains only background, purpose, and usage.
- `npm run validate` passes.
- `npm run serve` starts the local workspace.
- Core Runtime API is documented in `docs/api.md`.
- DeerFlow lifecycle reference exists in `examples/deerflow-run-lifecycle.js`.
- RFC exists in `docs/deerflow-rfc.md`.
- License file exists.
- No temporary project wording appears in source or docs.

## Recommended

- Add a workspace screenshot or short GIF to the repository.
- Add a short issue template for DeerFlow integration feedback.
- Open the first GitHub issue for MCP server implementation.
- Open the second GitHub issue for real DeerFlow adapter validation.

## Release Positioning

Suggested repository description:

```text
Group-level memory and project workspace layer for DeerFlow 2.0 multi-agent runs.
```

Suggested first announcement angle:

```text
DeerFlow has sub-agents. GroupFlow adds the missing shared state layer: group memory, file ledger, decisions, timeline, and resume context.
```

