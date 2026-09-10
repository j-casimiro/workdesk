import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoteDto, CreateTicketDto, UpdateTicketDto } from './ticket.dto';
import { TicketEntity } from './ticket.entity';
import { TicketNoteEntity } from './ticket-note.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly tickets: Repository<TicketEntity>,
    @InjectRepository(TicketNoteEntity)
    private readonly notes: Repository<TicketNoteEntity>,
  ) {}

  list() {
    return this.tickets.find({
      relations: { notes: true, checkpoints: true },
      order: { isActive: 'DESC', updatedAt: 'DESC' },
    });
  }

  async getByKey(externalKey: string) {
    const ticket = await this.tickets.findOne({
      where: { externalKey },
      relations: { notes: true, checkpoints: true },
      order: { notes: { createdAt: 'DESC' }, checkpoints: { createdAt: 'DESC' } },
    });

    if (!ticket) throw new NotFoundException(`Ticket ${externalKey} was not found.`);
    return ticket;
  }

  async create(input: CreateTicketDto) {
    const existing = await this.tickets.findOneBy({ externalKey: input.externalKey });
    if (existing) throw new ConflictException(`Ticket ${input.externalKey} already exists.`);
    return this.tickets.save(this.tickets.create(input));
  }

  async update(externalKey: string, input: UpdateTicketDto) {
    const ticket = await this.getByKey(externalKey);

    if (input.isActive) {
      await this.tickets.update({ isActive: true }, { isActive: false });
    }

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) Object.assign(ticket, { [key]: value });
    }
    return this.tickets.save(ticket);
  }

  async addNote(externalKey: string, input: CreateNoteDto) {
    const ticket = await this.getByKey(externalKey);
    return this.notes.save(this.notes.create({ ...input, ticket }));
  }

  async context(externalKey: string, detailLevel: 'brief' | 'standard' | 'full') {
    const ticket = await this.getByKey(externalKey);
    const checkpoints = [...(ticket.checkpoints ?? [])].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const notes = [...(ticket.notes ?? [])].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return {
      generatedAt: new Date().toISOString(),
      detailLevel,
      ticket: {
        ...ticket,
        notes: detailLevel === 'full' ? notes : undefined,
        checkpoints: detailLevel === 'full' ? checkpoints : undefined,
      },
      latestCheckpoint: checkpoints[0] ?? null,
      recentNotes: notes.slice(0, detailLevel === 'brief' ? 3 : detailLevel === 'standard' ? 10 : notes.length),
    };
  }
}
