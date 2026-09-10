# Workdesk architecture

## Responsibilities

- **Dashboard:** shows current work, progress, findings, and next actions.
- **API:** owns workflow rules and all SQLite writes.
- **CLI:** lets Jehu or Codex update Workdesk through terminal commands.
- **MCP server:** gives Codex structured tools for reading and updating Workdesk.
- **Codex CLI:** reads external tools and repositories, performs development work, and saves durable context back to Workdesk.

## Context strategy

Workdesk returns concise context first and allows deeper retrieval when needed. A standard context package contains the ticket objective, current stage, latest notes, decisions, checkpoint, validation, blockers, and next actions. Full history stays in SQLite instead of being loaded into every model conversation.

## Workflow

`Inbox -> Understanding -> Investigating -> Implementing -> Testing -> Ready for review -> In review -> Done`

`Blocked` may be used from any active stage. Workdesk's local stage is independent of the current Jira status.

## Integration boundary

Codex connects separately to Jira, Slack, and GitHub. Workdesk stores durable summaries, identifiers, URLs, timestamps, and user-approved decisions. It does not duplicate company repositories or store external-service credentials.
