import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TicketNote, WorkflowStage } from '@workdesk/shared';
import { WORKFLOW_STAGES } from '@workdesk/shared';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  GitBranch,
  Plus,
  RefreshCw,
  X,
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

const boardGroups: Array<{ label: string; stages: WorkflowStage[] }> = [
  { label: 'Up next', stages: ['inbox', 'understanding', 'investigating'] },
  { label: 'In progress', stages: ['implementing', 'testing'] },
  { label: 'Review', stages: ['ready_for_review', 'in_review'] },
  { label: 'Parked', stages: ['blocked', 'done'] },
];

function formatDate(value?: string) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function findRecentNote(notes: TicketNote[] | undefined, types: TicketNote['type'][]) {
  return notes?.find((note) => types.includes(note.type));
}

export function App() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [externalKey, setExternalKey] = useState('');
  const [title, setTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: api.tickets,
    refetchInterval: 3000,
  });

  const tickets = ticketsQuery.data ?? [];
  const activeTicket = tickets.find((ticket) => ticket.isActive) ?? tickets[0];

  const contextQuery = useQuery({
    queryKey: ['context', activeTicket?.externalKey],
    queryFn: () => api.context(activeTicket!.externalKey),
    enabled: Boolean(activeTicket),
    refetchInterval: 3000,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => registerWorkdeskWebTools(refresh), [refresh]);

  const focusMutation = useMutation({ mutationFn: api.focus, onSuccess: refresh });

  const createMutation = useMutation({
    mutationFn: api.createTicket,
    onSuccess: (ticket) => {
      setExternalKey('');
      setTitle('');
      setShowCreate(false);
      if (!activeTicket) focusMutation.mutate(ticket.externalKey);
      refresh();
    },
  });

  const stageMutation = useMutation({
    mutationFn: ({ key, stage }: { key: string; stage: WorkflowStage }) =>
      api.updateStage(key, stage),
    onSuccess: refresh,
  });

  const context = contextQuery.data;
  const checkpoint = context?.latestCheckpoint;
  const notes = context?.recentNotes;
  const recentSignal = findRecentNote(notes, ['decision', 'finding', 'test_result']);
  const recentBlocker = findRecentNote(notes, ['blocker']);
  const otherTickets = tickets.filter((ticket) => ticket.id !== activeTicket?.id);
  const isRefreshing = ticketsQuery.isFetching || contextQuery.isFetching;

  const groupedTickets = useMemo(
    () => boardGroups.map((group) => ({
      ...group,
      tickets: otherTickets.filter((ticket) => group.stages.includes(ticket.localStage)),
    })),
    [otherTickets],
  );

  const submitTicket = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({ externalKey: externalKey.trim(), title: title.trim() });
  };

  const copyResume = async () => {
    if (!activeTicket) return;
    const resume = [
      `${activeTicket.externalKey}: ${activeTicket.title}`,
      `Stage: ${stageLabels[activeTicket.localStage]}`,
      '',
      `Current state: ${checkpoint?.currentState || 'Not recorded'}`,
      `Next action: ${checkpoint?.nextActions || 'Not recorded'}`,
      `Branch: ${checkpoint?.branchName || activeTicket.branchName || 'Not recorded'}`,
      `Last checkpoint: ${formatDate(checkpoint?.createdAt)}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(resume);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">W</span>
          <div><strong>Workdesk</strong><span><i />Local context ready</span></div>
        </div>
        <div className="header-actions">
          <button className="button button-quiet icon-button" onClick={refresh} aria-label="Refresh dashboard">
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
          </button>
          <button className="button button-secondary" onClick={() => setShowCreate((value) => !value)}>
            {showCreate ? <X size={16} /> : <Plus size={16} />}
            {showCreate ? 'Close' : 'Add work'}
          </button>
        </div>
      </header>

      <main>
        <section className="welcome">
          <p className="today">{formatToday()}</p>
          <h1>{greeting()}</h1>
          <p>Here’s where you left off and what deserves your attention next.</p>
        </section>

        {showCreate && (
          <form className="create-panel" onSubmit={submitTicket}>
            <div><strong>Add something to your desk</strong><span>You only need a key and a clear title.</span></div>
            <label><span>Ticket key</span><input value={externalKey} onChange={(event) => setExternalKey(event.target.value)} placeholder="MVP-123" required autoFocus /></label>
            <label className="title-field"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" required /></label>
            <button className="button button-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Adding…' : 'Add ticket'}</button>
            {createMutation.error && <p className="form-error">{createMutation.error.message}</p>}
          </form>
        )}

        {ticketsQuery.isLoading && <div className="empty-state">Preparing your desk…</div>}
        {ticketsQuery.error && <div className="empty-state error-state">{ticketsQuery.error.message}</div>}

        {!ticketsQuery.isLoading && !activeTicket && (
          <section className="empty-state">
            <span className="empty-check"><CheckCircle2 size={22} /></span>
            <h2>Nothing on your desk yet</h2>
            <p>Add your first ticket and Workdesk will keep the next action ready for you.</p>
            <button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Add first ticket</button>
          </section>
        )}

        {activeTicket && (
          <>
            <section className="resume-card">
              <div className="resume-topline">
                <div className="ticket-identity">
                  <span className="active-pulse" />
                  <span>{activeTicket.externalKey}</span>
                  <span className="active-copy">Active work</span>
                </div>
                <div className="stage-control" data-stage={activeTicket.localStage}>
                  <span className="stage-dot" />
                  <select
                    aria-label="Local workflow stage"
                    value={activeTicket.localStage}
                    disabled={stageMutation.isPending}
                    onChange={(event) => stageMutation.mutate({ key: activeTicket.externalKey, stage: event.target.value as WorkflowStage })}
                  >
                    {WORKFLOW_STAGES.map((stage) => <option value={stage} key={stage}>{stageLabels[stage]}</option>)}
                  </select>
                </div>
              </div>

              <h2>{activeTicket.title}</h2>
              {activeTicket.description && <p className="ticket-description">{activeTicket.description}</p>}

              <div className="next-step">
                <div><span className="section-label">Your next move</span><p>{checkpoint?.nextActions || 'Add a checkpoint so your next action is waiting here when you return.'}</p></div>
                <ArrowRight size={23} />
              </div>

              <div className="resume-footer">
                <div className="resume-meta"><GitBranch size={14} /><span>{checkpoint?.branchName || activeTicket.branchName || 'No branch recorded'}</span></div>
                <div className="resume-meta"><Clock3 size={14} /><span>{checkpoint ? `Checkpoint ${formatDate(checkpoint.createdAt)}` : 'No checkpoint yet'}</span></div>
                <button className="button button-primary resume-button" onClick={() => void copyResume()}>
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? 'Copied' : 'Copy resume context'}
                </button>
              </div>
            </section>

            <section className="briefing-section">
              <div className="section-heading"><div><span className="eyebrow">Morning brief</span><h2>What to know before you start</h2></div><span>Updated {formatDate(context?.generatedAt)}</span></div>
              <div className="briefing-grid">
                <article className="brief-item">
                  <span className="brief-number">01</span>
                  <div><h3>Where things stand</h3><p>{checkpoint?.currentState || 'No current state has been recorded yet.'}</p></div>
                </article>
                <article className="brief-item">
                  <span className="brief-number">02</span>
                  <div><h3>Latest signal</h3><p>{recentSignal?.content || 'No findings, decisions, or test results recorded yet.'}</p>{recentSignal && <small>{recentSignal.type.replace('_', ' ')} · {formatDate(recentSignal.createdAt)}</small>}</div>
                </article>
                <article className={`brief-item ${checkpoint?.blockers || recentBlocker ? 'has-warning' : ''}`}>
                  <span className="brief-number">03</span>
                  <div><h3>{checkpoint?.blockers || recentBlocker ? 'Needs attention' : 'Clear to proceed'}</h3><p>{checkpoint?.blockers || recentBlocker?.content || 'No blockers are currently recorded.'}</p></div>
                  {checkpoint?.blockers || recentBlocker ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
                </article>
              </div>
            </section>

            <section className="board-section">
              <div className="section-heading"><div><span className="eyebrow">Your desk</span><h2>Other work</h2></div><span>{otherTickets.length} tickets outside your current focus</span></div>
              <div className="board-grid">
                {groupedTickets.map((group) => (
                  <div className="board-column" key={group.label}>
                    <div className="column-heading"><h3>{group.label}</h3><span>{group.tickets.length}</span></div>
                    <div className="column-items">
                      {group.tickets.length === 0 && <p className="column-empty">Nothing here</p>}
                      {group.tickets.map((ticket) => (
                        <article className="work-card" key={ticket.id} data-stage={ticket.localStage}>
                          <div><span className="stage-dot" /><span className="ticket-key">{ticket.externalKey}</span></div>
                          <h4>{ticket.title}</h4>
                          <footer><span>{stageLabels[ticket.localStage]}</span><button onClick={() => focusMutation.mutate(ticket.externalKey)} disabled={focusMutation.isPending}>Focus <ArrowRight size={13} /></button></footer>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
