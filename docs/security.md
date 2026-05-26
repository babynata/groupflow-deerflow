# Security Boundary Notes

GroupFlow is a state layer for DeerFlow-style multi-agent work. It should be treated as a trusted local component unless deployed behind an authenticated host.

## Current Boundary

- GroupFlow stores project, group, agent, memory, file, artifact, and timeline state.
- GroupFlow does not execute arbitrary tools.
- GroupFlow does not call external networks.
- GroupFlow does not inspect the local filesystem except through explicit JSON storage paths.
- File State Ledger entries are metadata supplied by the host runtime.

## Host Responsibilities

The host runtime is responsible for:

- authenticating users
- authorizing project and group access
- deciding which files agents may read or write
- redacting sensitive data before writing memory
- deciding which tool events become timeline events
- choosing a safe storage directory

## Data Sensitivity

Group Memory may contain:

- user requirements
- intermediate findings
- decisions
- file summaries
- artifact metadata
- tool call summaries

Hosts should avoid writing secrets, credentials, raw private data, or confidential source excerpts into Group Memory unless the storage backend is secured.

## V1.0 Non-Goals

- multi-user authentication
- encryption at rest
- permissioned project sharing
- remote database hardening
- official MCP transport security

These belong in deployment-specific integrations after the local runtime contract is stable.

