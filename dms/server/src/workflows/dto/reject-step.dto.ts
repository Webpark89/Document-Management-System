import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum RejectType {
  RETURN = 'return',
  CANCEL = 'cancel',
}

export class RejectStepDto {
  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsEnum(RejectType)
  reject_type: RejectType;

  @IsOptional()
  @IsNumber()
  return_to_step?: number;
}
