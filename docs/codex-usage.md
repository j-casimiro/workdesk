# Using Workdesk with Codex

This guide explains how Codex should use Workdesk before, during, and after development work. Workdesk is the durable memory layer; Codex remains the operator that reads repositories, edits code, runs checks, and records useful context.

## How the pieces work together

```text
You give Codex a ticket key
        ↓
Codex loads the ticket through the Workdesk MCP server
        ↓
Codex verifies the saved checkpoint against the real Git repository
        ↓
Codex investigates, implements, and tests the ticket
        ↓
Codex saves findings, decisions, test results, and a checkpoint
        ↓
The next Codex conversation resumes from that checkpoint
```

The Workdesk API must be running whenever Codex uses either the MCP tools or the Workdesk CLI. The dashboard is optional.

## One-time setup

From the Workdesk repository:

```bash
cd /Users/jehu/Documents/Github/workdesk
pnpm install
pnpm build
```

Register the compiled Workdesk MCP server with Codex:

```bash
codex mcp add workdesk -- \
  node /Users/jehu/Documents/Github/workdesk/packages/mcp/dist/index.js
```

Verify the registration:

```bash
codex mcp list
codex mcp get workdesk
```

You can also run `/mcp` inside an interactive Codex session to inspect the available MCP servers.

If the API uses a different address, recreate the registration with an environment variable:

```bash
codex mcp remove workdesk

codex mcp add workdesk \
  --env WORKDESK_API_URL=http://127.0.0.1:4310 \
  -- node /Users/jehu/Documents/Github/workdesk/packages/mcp/dist/index.js
```

Rebuild Workdesk after changing the MCP or shared package so Codex launches the latest compiled server:

```bash
pnpm build
```

## Start Workdesk each day

Start only the API when Codex is the main interface:

```bash
cd /Users/jehu/Documents/Github/workdesk
pnpm dev:api
```

Start the API and dashboard together when you also want the morning dashboard:

```bash
cd /Users/jehu/Documents/Github/workdesk
pnpm dev
```

The local addresses are:

- Dashboard: `http://localhost:5173`
- API: `http://127.0.0.1:4310`

Keep this process running while Codex works.

## Resume a ticket in Codex

Start Codex from the repository where the ticket will be implemented:

```bash
cd /path/to/company-repository
codex
```

Then give Codex the ticket key and tell it to use Workdesk:

```text
Continue MVP-123 using Workdesk. Load standard context, verify the saved
branch and current Git state, report any mismatch, then continue from the
recorded next action.
```

The expected sequence is:

1. Call `initialize_context` with `ticketKey: MVP-123` and `detailLevel: standard`.
2. Read the latest checkpoint and recent durable notes.
3. Inspect the actual Git branch, commit, and working tree in the target repository.
4. Report differences between saved context and current Git state.
5. Continue from the checkpoint's `nextActions`.

Inside the Workdesk repository, its `AGENTS.md` already tells Codex to follow this sequence when a ticket key is provided. In another repository, use the explicit prompt above or add equivalent instructions to that repository's `AGENTS.md`.

## Start a new ticket

You can ask Codex to create and focus a Workdesk record:

```text
Create Workdesk ticket MVP-123 titled "Fix assigned inspector persistence",
set its repository path to /path/to/company-repository, make it active, and
set its local stage to Understanding.
```

Codex should call these MCP tools:

1. `create_ticket`
2. `set_active_ticket`
3. `update_ticket_stage`

The equivalent terminal commands are:

```bash
pnpm workdesk ticket:create MVP-123 \
  "Fix assigned inspector persistence" \
  --url "https://example.atlassian.net/browse/MVP-123" \
  --repo "/path/to/company-repository"

pnpm workdesk ticket:focus MVP-123
pnpm workdesk ticket:stage MVP-123 understanding
```

Creating a Workdesk ticket does not create or update a Jira ticket.

## What Codex should save while working

Codex should save short, durable conclusions rather than transcripts or source-code copies.

### Findings

Use a finding for a confirmed technical fact:

```text
Save this as a Workdesk finding for MVP-123: The controller receives
assignedInspectorId, but the service does not persist it.
```

CLI equivalent:

```bash
pnpm workdesk note MVP-123 finding \
  "The controller receives assignedInspectorId, but the service does not persist it."
```

### Decisions

Use a decision for an agreed implementation direction:

```text
Save this decision for MVP-123: Follow the existing technician assignment
implementation and keep controller behavior unchanged.
```

CLI equivalent:

```bash
pnpm workdesk note MVP-123 decision \
  "Follow the existing technician assignment implementation and keep controller behavior unchanged."
```

### Questions and blockers

```bash
pnpm workdesk note MVP-123 question \
  "Should reassignment notify the previous inspector?"

pnpm workdesk note MVP-123 blocker \
  "The required test fixture is unavailable in the local environment."
```

### Test results

Record the exact check and result:

```bash
pnpm workdesk note MVP-123 test_result \
  "Focused assignment service test passed: 8 tests, 0 failures."
```

### Personal notes

Use `personal_note` for information that is useful later but is not a confirmed finding or decision:

```bash
pnpm workdesk note MVP-123 personal_note \
  "Revisit naming with the team lead before opening the PR." \
  --source "jehu"
```

Supported note types are:

```text
personal_note
question
finding
decision
blocker
test_result
```

## Update the local workflow stage

Ask Codex naturally:

```text
Move MVP-123 to Testing in Workdesk. Do not change Jira.
```

CLI equivalent:

```bash
pnpm workdesk ticket:stage MVP-123 testing
```

Valid stages are:

```text
inbox
understanding
investigating
implementing
testing
ready_for_review
in_review
done
blocked
```

The Workdesk stage is local and independent from Jira status.

## Save a checkpoint

A checkpoint is the handoff package for the next Codex conversation. Create one after investigation, implementation, testing, review, or before ending a session.

Prompt Codex with:

```text
Create a complete Workdesk checkpoint for MVP-123. Summarize completed work,
the current state, the next concrete actions, blockers, and open questions.
Read the current Git branch, commit, changed files, and validation results from
the repository. Do not store source code or secrets.
```

CLI equivalent:

```bash
pnpm workdesk checkpoint MVP-123 \
  --completed "Updated the assignment service and added a regression test" \
  --current "Implementation is complete and the focused test passes" \
  --next "Run the full backend test suite and review the diff" \
  --blockers "" \
  --questions "Confirm whether reassignment should emit an event" \
  --branch "fix/MVP-123-assigned-inspector" \
  --commit "abc1234" \
  --files "src/assignment.service.ts, test/assignment.service.spec.ts" \
  --validation "Focused unit test passed: 8 tests, 0 failures"
```

`--current` and `--next` are required. The other checkpoint options are optional.

## Read context manually

List all saved tickets:

```bash
pnpm workdesk ticket:list
```

Load the normal context package:

```bash
pnpm workdesk context MVP-123 --level standard
```

Choose the smallest useful context level:

```bash
pnpm workdesk context MVP-123 --level brief
pnpm workdesk context MVP-123 --level standard
pnpm workdesk context MVP-123 --level full
```

- `brief`: identity, stage, latest checkpoint, and three recent notes.
- `standard`: ticket details, latest checkpoint, and ten recent notes. Use this when resuming work.
- `full`: complete notes and checkpoint history. Use only when older context is needed.

## MCP tool reference

Codex normally calls these tools itself. You do not type them as shell commands.

| MCP tool | When Codex should use it |
| --- | --- |
| `list_tickets` | Find saved work or identify the active ticket. |
| `initialize_context` | Start or resume work with brief, standard, or full context. |
| `create_ticket` | Create the local record for a new ticket. |
| `set_active_ticket` | Make a ticket the focus shown on the dashboard. |
| `update_ticket_stage` | Update Workdesk's local stage without changing Jira. |
| `save_ticket_note` | Persist a finding, decision, question, blocker, test result, or personal note. |
| `save_checkpoint` | Preserve a complete handoff for the next session. |

## Recommended daily routine

### Morning

```bash
cd /Users/jehu/Documents/Github/workdesk
pnpm dev
```

In another terminal:

```bash
cd /path/to/company-repository
codex
```

Then prompt:

```text
Continue MVP-123 using Workdesk.
```

### During the ticket

Tell Codex when a conclusion should become durable:

```text
Save that root cause as a finding in Workdesk.
Save this implementation choice as a decision.
Record the focused test result in Workdesk.
Move the local stage to Testing.
```

Codex should also save these items proactively when they are concrete and useful for a later session.

### Before stopping

```text
Checkpoint MVP-123 in Workdesk with the current Git state and everything the
next conversation needs to continue safely.
```

The next conversation can then begin with only:

```text
Continue MVP-123 using Workdesk.
```

## Safety and data boundaries

Store:

- durable summaries;
- ticket keys and external URLs;
- technical findings and decisions;
- blockers and open questions;
- test results;
- branch, commit, changed-file paths, and next actions.

Do not store:

- credentials, access tokens, or environment values;
- secrets copied from logs or configuration;
- complete source files or repository snapshots;
- entire Jira or Slack conversations;
- unreviewed guesses presented as confirmed findings.

External Jira, Slack, and GitHub messages should remain drafts unless you explicitly ask Codex to post them.

## Troubleshooting

### Codex cannot see the Workdesk tools

```bash
codex mcp list
codex mcp get workdesk
```

If the server is missing or points to the wrong path:

```bash
codex mcp remove workdesk
codex mcp add workdesk -- \
  node /Users/jehu/Documents/Github/workdesk/packages/mcp/dist/index.js
```

### The tool reports that the API is unavailable

Start the API and leave it running:

```bash
cd /Users/jehu/Documents/Github/workdesk
pnpm dev:api
```

### Codex is using stale MCP code

Rebuild Workdesk, then begin a new Codex session so the stdio MCP process starts from the new output:

```bash
cd /Users/jehu/Documents/Github/workdesk
pnpm build
```

### A ticket cannot be loaded

Confirm that it exists and that its key is correct:

```bash
pnpm workdesk ticket:list
pnpm workdesk context MVP-123 --level standard
```

### Saved branch and repository state disagree

The Git repository is the stronger source of truth. Codex should report the mismatch, use the actual repository state, and write a corrected checkpoint after the state is understood.

## Further reading

- [Workdesk architecture](architecture.md)
- [OpenAI Codex use cases](https://developers.openai.com/codex/use-cases)

