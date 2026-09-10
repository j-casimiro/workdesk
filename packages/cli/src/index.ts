#!/usr/bin/env node
import { Command } from 'commander';

const apiUrl = process.env.WORKDESK_API_URL ?? 'http://127.0.0.1:4310';

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? `Workdesk API returned ${response.status}.`);
  return body;
}

function print(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

const program = new Command()
  .name('workdesk')
  .description('Read and update local Workdesk context.')
  .showHelpAfterError();

program
  .command('ticket:list')
  .description('List saved tickets.')
  .action(async () => print(await request('/tickets')));

program
  .command('ticket:create')
  .argument('<key>', 'External ticket key')
  .argument('<title>', 'Ticket title')
  .option('--url <url>', 'External ticket URL', '')
  .option('--repo <path>', 'Repository path', '')
  .description('Create a ticket.')
  .action(async (key, title, options) =>
    print(
      await request('/tickets', {
        method: 'POST',
        body: JSON.stringify({ externalKey: key, title, externalUrl: options.url, repositoryPath: options.repo }),
      }),
    ),
  );

program
  .command('ticket:focus')
  .argument('<key>')
  .description('Set the active ticket.')
  .action(async (key) =>
    print(await request(`/tickets/${key}`, { method: 'PATCH', body: JSON.stringify({ isActive: true }) })),
  );

program
  .command('ticket:stage')
  .argument('<key>')
  .argument('<stage>')
  .description('Update the local workflow stage.')
  .action(async (key, stage) =>
    print(
      await request(`/tickets/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ localStage: stage }),
      }),
    ),
  );

program
  .command('note')
  .argument('<key>')
  .argument('<type>')
  .argument('<content>')
  .option('--source <source>', 'Context source', 'codex')
  .description('Save a finding, decision, blocker, question, test result, or personal note.')
  .action(async (key, type, content, options) =>
    print(
      await request(`/tickets/${key}/notes`, {
        method: 'POST',
        body: JSON.stringify({ type, content, source: options.source }),
      }),
    ),
  );

program
  .command('checkpoint')
  .argument('<key>')
  .requiredOption('--current <state>', 'Current work state')
  .requiredOption('--next <actions>', 'Next actions')
  .option('--completed <work>', 'Completed work', '')
  .option('--blockers <blockers>', 'Current blockers', '')
  .option('--questions <questions>', 'Open questions', '')
  .option('--branch <branch>', 'Git branch', '')
  .option('--commit <hash>', 'Git commit hash', '')
  .option('--files <paths>', 'Changed file paths', '')
  .option('--validation <results>', 'Validation performed', '')
  .description('Save a session checkpoint.')
  .action(async (key, options) =>
    print(
      await request(`/tickets/${key}/checkpoints`, {
        method: 'POST',
        body: JSON.stringify({
          completedWork: options.completed,
          currentState: options.current,
          nextActions: options.next,
          blockers: options.blockers,
          openQuestions: options.questions,
          branchName: options.branch,
          commitHash: options.commit,
          changedFiles: options.files,
          validation: options.validation,
        }),
      }),
    ),
  );

program
  .command('context')
  .argument('<key>')
  .option('--level <level>', 'brief, standard, or full', 'standard')
  .description('Load a token-conscious context package.')
  .action(async (key, options) => print(await request(`/tickets/${key}/context?detailLevel=${options.level}`)));

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Workdesk error: ${message}\n`);
  process.exitCode = 1;
});
