import type { Ticket, TicketContext, WorkflowStage } from '@workdesk/shared';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4310';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  tickets: () => request<Ticket[]>('/tickets'),
  context: (key: string) => request<TicketContext>(`/tickets/${key}/context?detailLevel=standard`),
  createTicket: (input: { externalKey: string; title: string }) =>
    request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(input) }),
  updateStage: (key: string, localStage: WorkflowStage) =>
    request<Ticket>(`/tickets/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ localStage }),
    }),
  focus: (key: string) =>
    request<Ticket>(`/tickets/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: true }),
    }),
};
