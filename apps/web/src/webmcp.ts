import type { WorkflowStage } from '@workdesk/shared';
import { WORKFLOW_STAGES } from '@workdesk/shared';
import { api } from './api';

interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: object;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute(input: unknown): unknown | Promise<unknown>;
}

interface WebModelContext {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): void | Promise<void>;
}

declare global {
  interface Document {
    readonly modelContext?: WebModelContext;
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required.`);
  return value.trim();
}

export function registerWorkdeskWebTools(onChange: () => void) {
  const context = document.modelContext;
  if (!context?.registerTool) return () => undefined;

  const lifecycle = new AbortController();
  const register = (tool: WebMcpTool) =>
    Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(console.error);

  void register({
    name: 'workdesk_list_tickets',
    title: 'List Workdesk tickets',
    description: 'Read the current tickets visible in the local Workdesk dashboard.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => api.tickets(),
  });

  void register({
    name: 'workdesk_create_ticket',
    title: 'Create Workdesk ticket',
    description: 'Create a ticket in the same local Workdesk store used by the dashboard.',
    inputSchema: {
      type: 'object',
      properties: {
        externalKey: { type: 'string' },
        title: { type: 'string' },
      },
      required: ['externalKey', 'title'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      const record = input as Record<string, unknown>;
      const ticket = await api.createTicket({
        externalKey: requiredString(record.externalKey, 'externalKey'),
        title: requiredString(record.title, 'title'),
      });
      onChange();
      return { externalKey: ticket.externalKey, title: ticket.title, localStage: ticket.localStage };
    },
  });

  void register({
    name: 'workdesk_update_ticket_stage',
    title: 'Update Workdesk ticket stage',
    description: 'Change a ticket local workflow stage without changing its Jira status.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketKey: { type: 'string' },
        stage: { type: 'string', enum: [...WORKFLOW_STAGES] },
      },
      required: ['ticketKey', 'stage'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      const record = input as Record<string, unknown>;
      const ticketKey = requiredString(record.ticketKey, 'ticketKey');
      const stage = requiredString(record.stage, 'stage') as WorkflowStage;
      if (!WORKFLOW_STAGES.includes(stage)) throw new Error('stage is invalid.');
      const ticket = await api.updateStage(ticketKey, stage);
      onChange();
      return { externalKey: ticket.externalKey, localStage: ticket.localStage };
    },
  });

  return () => lifecycle.abort();
}
