import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';
import { CheckpointsModule } from './checkpoints/checkpoints.module';
import { TicketsModule } from './tickets/tickets.module';

const databasePath = process.env.WORKDESK_DB_PATH
  ? resolve(process.cwd(), process.env.WORKDESK_DB_PATH)
  : resolve(__dirname, '../../../data/workdesk.sqlite');

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: databasePath,
      autoSave: true,
      autoLoadEntities: true,
      synchronize: true,
    }),
    TicketsModule,
    CheckpointsModule,
  ],
})
export class AppModule {}
