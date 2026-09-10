import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const stages = [
  'inbox',
  'understanding',
  'investigating',
  'implementing',
  'testing',
  'ready_for_review',
  'in_review',
  'done',
  'blocked',
];

export class CreateTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  externalKey: string;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  title: string;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @IsOptional()
  @IsString()
  jiraStatus?: string;

  @IsOptional()
  @IsIn(stages)
  localStage?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  repositoryPath?: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @IsOptional()
  @IsString()
  jiraStatus?: string;

  @IsOptional()
  @IsIn(stages)
  localStage?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  repositoryPath?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsString()
  pullRequestUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateNoteDto {
  @IsIn(['personal_note', 'question', 'finding', 'decision', 'blocker', 'test_result'])
  type: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  source?: string;
}
