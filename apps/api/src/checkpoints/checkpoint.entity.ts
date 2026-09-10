import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TicketEntity } from '../tickets/ticket.entity';

@Entity('session_checkpoints')
export class CheckpointEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.checkpoints, { onDelete: 'CASCADE' })
  ticket: TicketEntity;

  @Column({ type: 'text', default: '' })
  completedWork: string;

  @Column({ type: 'text' })
  currentState: string;

  @Column({ type: 'text' })
  nextActions: string;

  @Column({ type: 'text', default: '' })
  blockers: string;

  @Column({ type: 'text', default: '' })
  openQuestions: string;

  @Column({ default: '' })
  branchName: string;

  @Column({ default: '' })
  commitHash: string;

  @Column({ type: 'text', default: '' })
  changedFiles: string;

  @Column({ type: 'text', default: '' })
  validation: string;

  @CreateDateColumn()
  createdAt: Date;
}
