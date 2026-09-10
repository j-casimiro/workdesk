import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Ticket, WorkflowStage } from '@workdesk/shared';
import { WORKFLOW_STAGES } from '@workdesk/shared';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  GitBranch,
  Plus,
  RefreshCw,
  TerminalSquare,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { registerWorkdeskWebTools } from './webmcp';

const stageLabels: Record<WorkflowStage, string> = {
  inbox: 'Inbox',
  understanding: 'Understanding',
  investigating: 'Investigating',
  implementing: 'Implementing',
  testing: 'Testing',
  ready_for_review: 'Ready for review',
  in_review: 'In review',
  done: 'Done',
  blocked: 'Blocked',
};

function formatDate(value?: string) {
  if (!value) return 'No checkpoint yet';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function App() {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [externalKey, setExternalKey] = useState('');
  const [title, setTitle] = useState('');

  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: api.tickets,
    refetchInterval: 3000,
  });

  const tickets = ticketsQuery.data ?? [];
  const activeTicket = tickets.find((ticket) => ticket.isActive);

  useEffect(() => {
    if (!selectedKey && tickets.length) setSelectedKey(activeTicket?.externalKey ?? tickets[0].externalKey);
  }, [activeTicket?.externalKey, selectedKey, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.externalKey === selectedKey) ?? activeTicket,
    [activeTicket, selectedKey, tickets],
  );

  const contextQuery = useQuery({
    queryKey: ['context', selectedTicket?.externalKey],
    queryFn: () => api.context(selectedTicket!.externalKey),
    enabled: Boolean(selectedTicket),
    refetchInterval: 3000,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => registerWorkdeskWebTools(refresh), [refresh]);

  const createMutation = useMutation({
    mutationFn: api.createTicket,
    onSuccess: (ticket) => {
      setSelectedKey(ticket.externalKey);
      setExternalKey('');
      setTitle('');
      setShowCreate(false);
      refresh();
    },
  });

  const stageMutation = useMutation({
    mutationFn: ({ key, stage }: { key: string; stage: WorkflowStage }) => api.updateStage(key, stage),
    onSuccess: refresh,
  });

  const focusMutation = useMutation({ mutationFn: api.focus, onSuccess: refresh });

  const submitTicket = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({ externalKey: externalKey.trim(), title: title.trim() });
  };

  const context = contextQuery.data;
  const checkpoint = context?.latestCheckpoint;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><TerminalSquare size={20} /></div>
          <div>
            <strong>Workdesk</strong>
            <span>Developer context</span>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          <button className="nav-item active"><CircleDot size={17} />Today</button>
          <button className="nav-item"><Activity size={17} />Work board</button>
          <button className="nav-item"><CheckCircle2 size={17} />Completed</button>
        </nav>

        <div className="sidebar-footer">
          <span className="connection-dot" />
          Local context ready
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">TODAY</p>
            <h1>Current work</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => refresh()} aria-label="Refresh dashboard">
              <RefreshCw size={18} />
            </button>
            <button className="primary-button" onClick={() => setShowCreate((value) => !value)}>
              <Plus size={18} /> Add ticket
            </button>
          </div>
        </header>

        {showCreate && (
          <form className="create-panel" onSubmit={submitTicket}>
            <label>
              Ticket key
              <input value={externalKey} onChange={(event) => setExternalKey(event.target.value)} placeholder="MVP-123" required />
            </label>
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Describe the issue" required />
            </label>
            <button className="primary-button" disabled={createMutation.isPending}>Create</button>
            {createMutation.error && <p className="form-error">{createMutation.error.message}</p>}
          </form>
        )}

        {ticketsQuery.isLoading && <div className="empty-state">Loading your work…</div>}
        {ticketsQuery.error && <div className="empty-state error-state">{ticketsQuery.error.message}</div>}

        {!ticketsQuery.isLoading && !tickets.length && (
          <section className="empty-state">
            <TerminalSquare size={30} />
            <h2>No active context yet</h2>
            <p>Add your first Jira ticket here or through the Workdesk CLI.</p>
            <button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={18} /> Add first ticket</button>
          </section>
        )}

        {selectedTicket && (
          <div className="workspace-grid">
            <section className="ticket-list-panel">
              <div className="section-heading">
                <h2>Tickets</h2>
                <span>{tickets.length}</span>
              </div>
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    className={`ticket-row ${selectedTicket.externalKey === ticket.externalKey ? 'selected' : ''}`}
                    onClick={() => setSelectedKey(ticket.externalKey)}
                  >
                    <span className="ticket-key">{ticket.externalKey}</span>
                    <strong>{ticket.title}</strong>
                    <span className="ticket-stage">{stageLabels[ticket.localStage]}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="focus-panel">
              <div className="focus-header">
                <div>
                  <div className="ticket-meta">
                    <span className="ticket-key">{selectedTicket.externalKey}</span>
                    {selectedTicket.isActive && <span className="active-label">Active</span>}
                  </div>
                  <h2>{selectedTicket.title}</h2>
                </div>
                {!selectedTicket.isActive && (
                  <button className="secondary-button" onClick={() => focusMutation.mutate(selectedTicket.externalKey)}>
                    Set active
                  </button>
                )}
              </div>

              <div className="stage-control">
                <label htmlFor="stage">Local stage</label>
                <select
                  id="stage"
                  value={selectedTicket.localStage}
                  onChange={(event) =>
                    stageMutation.mutate({ key: selectedTicket.externalKey, stage: event.target.value as WorkflowStage })
                  }
                >
                  {WORKFLOW_STAGES.map((stage) => <option value={stage} key={stage}>{stageLabels[stage]}</option>)}
                </select>
              </div>

              <div className="context-grid">
                <article className="context-card next-action-card">
                  <span className="card-label">NEXT ACTION</span>
                  <p>{checkpoint?.nextActions || 'Create a checkpoint to define the next action.'}</p>
                  <ArrowRight size={20} />
                </article>
                <article className="context-card">
                  <span className="card-label">CURRENT STATE</span>
                  <p>{checkpoint?.currentState || 'No saved session state.'}</p>
                </article>
                <article className="context-card">
                  <span className="card-label">BRANCH</span>
                  <p className="mono"><GitBranch size={16} />{checkpoint?.branchName || selectedTicket.branchName || 'Not recorded'}</p>
                </article>
                <article className="context-card">
                  <span className="card-label">LAST CHECKPOINT</span>
                  <p>{formatDate(checkpoint?.createdAt)}</p>
                </article>
              </div>

              <section className="activity-panel">
                <div className="section-heading">
                  <h3>Recent context</h3>
                  <span>{context?.recentNotes.length ?? 0}</span>
                </div>
                {!context?.recentNotes.length && <p className="quiet">Findings, decisions, blockers, and test results will appear here.</p>}
                {context?.recentNotes.map((note) => (
                  <div className="note-row" key={note.id}>
                    <span className={`note-type ${note.type}`}>{note.type.replace('_', ' ')}</span>
                    <p>{note.content}</p>
                    <time>{formatDate(note.createdAt)}</time>
                  </div>
                ))}
              </section>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
