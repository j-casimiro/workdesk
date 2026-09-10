import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CheckpointEntity } from '../checkpoints/checkpoint.entity';
import { TicketNoteEntity } from './ticket-note.entity';

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  externalKey: string;

  @Column({ default: '' })
  externalUrl: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', default: '' })
  acceptanceCriteria: string;

  @Column({ default: '' })
  jiraStatus: string;

  @Column({ default: 'inbox' })
  localStage: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ default: '' })
  repositoryPath: string;

  @Column({ default: '' })
  branchName: string;

  @Column({ default: '' })
  pullRequestUrl: string;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => TicketNoteEntity, (note) => note.ticket)
  notes: TicketNoteEntity[];

  @OneToMany(() => CheckpointEntity, (checkpoint) => checkpoint.ticket)
  checkpoints: CheckpointEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
