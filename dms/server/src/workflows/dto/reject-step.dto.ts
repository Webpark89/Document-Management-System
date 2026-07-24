import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class RejectStepDto {
  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsOptional()
  @IsNumber()
  return_to_step?: number;
}
