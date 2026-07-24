import { IsOptional, IsString } from 'class-validator';

export class ApproveStepDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
