import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('ticket_notes')
export class TicketNoteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.notes, { onDelete: 'CASCADE' })
  ticket: TicketEntity;

  @Column()
  type: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'jehu' })
  source: string;

  @CreateDateColumn()
  createdAt: Date;
}
