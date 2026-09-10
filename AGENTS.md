# Workdesk operating rules

## Session initialization

When Jehu provides a ticket key:

1. Call `initialize_context` with `detailLevel: standard`.
2. Read the latest checkpoint and its next actions.
3. Verify the saved branch and repository state against Git.
4. Report any mismatch before continuing.
5. Continue from the recorded next action.

## Working rules

1. Read the active ticket context before investigating code.
2. Save concrete findings, decisions, blockers, and test results to Workdesk.
3. Explain the proposed solution before implementation when the ticket is still under investigation.
4. Follow the architecture and patterns already present in the target repository.
5. Keep changes within the ticket scope.
6. Verify generated code and run relevant checks before marking work ready for review.
7. Treat repository state, tests, Jira, and reviewed decisions as stronger evidence than old summaries.
8. Prepare external messages and updates as drafts unless Jehu explicitly asks to post them.
9. Create a checkpoint after investigation, implementation, testing, and review.
10. Never store secrets, credentials, access tokens, environment values, or source-code copies in Workdesk.

## Checkpoint contents

Each checkpoint records:

- completed work;
- current state;
- next actions;
- blockers and open questions;
- branch and commit when available;
- changed file paths;
- validation already performed.
