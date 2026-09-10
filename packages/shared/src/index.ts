export const WORKFLOW_STAGES = [
  'inbox',
  'understanding',
  'investigating',
  'implementing',
  'testing',
  'ready_for_review',
  'in_review',
  'done',
  'blocked',
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export type NoteType =
  | 'personal_note'
  | 'question'
  | 'finding'
  | 'decision'
  | 'blocker'
  | 'test_result';

export interface TicketNote {
  id: number;
  type: NoteType;
  content: string;
  source: string;
  createdAt: string;
}

export interface Checkpoint {
  id: number;
  completedWork: string;
  currentState: string;
  nextActions: string;
  blockers: string;
  openQuestions: string;
  branchName: string;
  commitHash: string;
  changedFiles: string;
  validation: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  externalKey: string;
  externalUrl: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  jiraStatus: string;
  localStage: WorkflowStage;
  priority: string;
  repositoryPath: string;
  branchName: string;
  pullRequestUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: TicketNote[];
  checkpoints?: Checkpoint[];
}

export interface TicketContext {
  generatedAt: string;
  detailLevel: 'brief' | 'standard' | 'full';
  ticket: Ticket;
  latestCheckpoint: Checkpoint | null;
  recentNotes: TicketNote[];
}
