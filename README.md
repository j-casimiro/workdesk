# Workdesk

Workdesk is a local developer dashboard and persistent context layer for Codex. It keeps ticket requirements, investigation findings, decisions, checkpoints, test results, and next actions available across new AI conversations.

## Current capabilities

- Local ticket dashboard with workflow stages
- NestJS API backed by SQLite
- Persistent ticket notes and session checkpoints
- Context package optimized for new Codex sessions
- `workdesk` CLI for manual or agent-driven updates
- Local MCP server exposing structured Workdesk tools to Codex

## Stack

- React, Vite, and TypeScript
- NestJS, TypeORM, and SQLite
- pnpm workspace
- Model Context Protocol SDK

## Start locally

```bash
pnpm install
pnpm build
pnpm dev
```

Open `http://localhost:5173`. The API runs at `http://127.0.0.1:4310`.

## CLI examples

```bash
pnpm workdesk ticket:list
pnpm workdesk ticket:create MVP-123 "Fix assigned inspector persistence"
pnpm workdesk ticket:stage MVP-123 investigating
pnpm workdesk checkpoint MVP-123 --current "Root cause confirmed" --next "Implement focused fix"
pnpm workdesk context MVP-123
```

## Connect the MCP server to Codex

Build the workspace, then register the local stdio server using your absolute project path:

```bash
pnpm build
codex mcp add workdesk -- node /absolute/path/to/workdesk/packages/mcp/dist/index.js
```

Run `/mcp` in Codex to verify that `workdesk` is active. Start the API before using the MCP tools.

## Data and credentials

The SQLite database is stored under `data/` and ignored by Git. Workdesk does not store OpenAI, Jira, Slack, or GitHub credentials.
