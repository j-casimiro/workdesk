import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketsService } from '../tickets/tickets.service';
import { CheckpointEntity } from './checkpoint.entity';
import { CreateCheckpointDto } from './checkpoint.dto';

@Injectable()
export class CheckpointsService {
  constructor(
    @InjectRepository(CheckpointEntity)
    private readonly checkpoints: Repository<CheckpointEntity>,
    private readonly tickets: TicketsService,
  ) {}

  async create(ticketKey: string, input: CreateCheckpointDto) {
    const ticket = await this.tickets.getByKey(ticketKey);
    return this.checkpoints.save(this.checkpoints.create({ ...input, ticket }));
  }
}
