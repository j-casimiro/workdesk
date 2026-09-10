#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

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

function result(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

const server = new McpServer({ name: 'workdesk', version: '0.1.0' });

server.registerTool(
  'list_tickets',
  { description: 'List tickets saved in the local Workdesk context store.' },
  async () => result(await request('/tickets')),
);

server.registerTool(
  'initialize_context',
  {
    description: 'Load concise durable context before starting or resuming work on a ticket.',
    inputSchema: {
      ticketKey: z.string().min(1),
      detailLevel: z.enum(['brief', 'standard', 'full']).default('standard'),
    },
  },
  async ({ ticketKey, detailLevel }) =>
    result(await request(`/tickets/${encodeURIComponent(ticketKey)}/context?detailLevel=${detailLevel}`)),
);

server.registerTool(
  'create_ticket',
  {
    description: 'Create a local Workdesk ticket record.',
    inputSchema: {
      externalKey: z.string().min(1),
      title: z.string().min(1),
      externalUrl: z.string().default(''),
      repositoryPath: z.string().default(''),
    },
  },
  async (input) =>
    result(await request('/tickets', { method: 'POST', body: JSON.stringify(input) })),
);

server.registerTool(
  'set_active_ticket',
  {
    description: 'Make one Workdesk ticket the current focus.',
    inputSchema: { ticketKey: z.string().min(1) },
  },
  async ({ ticketKey }) =>
    result(
      await request(`/tickets/${encodeURIComponent(ticketKey)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      }),
    ),
);

server.registerTool(
  'update_ticket_stage',
  {
    description: 'Update the local workflow stage without changing Jira.',
    inputSchema: {
      ticketKey: z.string().min(1),
      stage: z.enum([
        'inbox',
        'understanding',
        'investigating',
        'implementing',
        'testing',
        'ready_for_review',
        'in_review',
        'done',
        'blocked',
      ]),
    },
  },
  async ({ ticketKey, stage }) =>
    result(
      await request(`/tickets/${encodeURIComponent(ticketKey)}`, {
        method: 'PATCH',
        body: JSON.stringify({ localStage: stage }),
      }),
    ),
);

server.registerTool(
  'save_ticket_note',
  {
    description: 'Save a durable finding, decision, question, blocker, test result, or personal note.',
    inputSchema: {
      ticketKey: z.string().min(1),
      type: z.enum(['personal_note', 'question', 'finding', 'decision', 'blocker', 'test_result']),
      content: z.string().min(1),
      source: z.string().default('codex'),
    },
  },
  async ({ ticketKey, ...input }) =>
    result(
      await request(`/tickets/${encodeURIComponent(ticketKey)}/notes`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    ),
);

server.registerTool(
  'save_checkpoint',
  {
    description: 'Save the current handoff state so a new Codex conversation can continue reliably.',
    inputSchema: {
      ticketKey: z.string().min(1),
      completedWork: z.string().default(''),
      currentState: z.string().min(1),
      nextActions: z.string().min(1),
      blockers: z.string().default(''),
      openQuestions: z.string().default(''),
      branchName: z.string().default(''),
      commitHash: z.string().default(''),
      changedFiles: z.string().default(''),
      validation: z.string().default(''),
    },
  },
  async ({ ticketKey, ...input }) =>
    result(
      await request(`/tickets/${encodeURIComponent(ticketKey)}/checkpoints`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    ),
);

const transport = new StdioServerTransport();
await server.connect(transport);
