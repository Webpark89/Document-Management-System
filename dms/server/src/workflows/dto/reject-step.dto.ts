import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
export enum RejectType {
  RETURN = 'return',
  CANCEL = 'cancel',
}
export class RejectStepDto {
  @IsNotEmpty() @IsString() @MaxLength(5000) comment: string;
  @IsEnum(RejectType) reject_type: RejectType;
  @IsOptional() @IsInt() @Min(1) return_to_step?: number;
  @IsInt() @Min(1) expected_step: number;
  @IsInt() @Min(1) expected_version: number;
}
