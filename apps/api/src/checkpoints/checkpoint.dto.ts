import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCheckpointDto {
  @IsOptional()
  @IsString()
  completedWork?: string;

  @IsString()
  @MinLength(1)
  currentState: string;

  @IsString()
  @MinLength(1)
  nextActions: string;

  @IsOptional()
  @IsString()
  blockers?: string;

  @IsOptional()
  @IsString()
  openQuestions?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsString()
  commitHash?: string;

  @IsOptional()
  @IsString()
  changedFiles?: string;

  @IsOptional()
  @IsString()
  validation?: string;
}
