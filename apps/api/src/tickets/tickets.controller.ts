import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateNoteDto, CreateTicketDto, UpdateTicketDto } from './ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  list() {
    return this.tickets.list();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.tickets.getByKey(key);
  }

  @Get(':key/context')
  context(
    @Param('key') key: string,
    @Query('detailLevel') detailLevel: 'brief' | 'standard' | 'full' = 'standard',
  ) {
    return this.tickets.context(key, detailLevel);
  }

  @Post()
  create(@Body() input: CreateTicketDto) {
    return this.tickets.create(input);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() input: UpdateTicketDto) {
    return this.tickets.update(key, input);
  }

  @Post(':key/notes')
  addNote(@Param('key') key: string, @Body() input: CreateNoteDto) {
    return this.tickets.addNote(key, input);
  }
}
