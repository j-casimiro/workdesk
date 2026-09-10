import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateCheckpointDto } from './checkpoint.dto';
import { CheckpointsService } from './checkpoints.service';

@Controller('tickets/:key/checkpoints')
export class CheckpointsController {
  constructor(private readonly checkpoints: CheckpointsService) {}

  @Post()
  create(@Param('key') key: string, @Body() input: CreateCheckpointDto) {
    return this.checkpoints.create(key, input);
  }
}
