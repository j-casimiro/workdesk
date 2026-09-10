import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckpointEntity } from '../checkpoints/checkpoint.entity';
import { TicketEntity } from './ticket.entity';
import { TicketNoteEntity } from './ticket-note.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity, TicketNoteEntity, CheckpointEntity])],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
