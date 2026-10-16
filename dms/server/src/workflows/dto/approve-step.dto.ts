import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsBoolean,
} from 'class-validator';
export class ApproveStepDto {
  @IsOptional() @IsString() @MaxLength(5000) comment?: string;
  @IsInt() @Min(1) expected_step: number;
  @IsInt() @Min(1) expected_version: number;
  @IsOptional() @IsNumber() @Min(0) signature_x?: number;
  @IsOptional() @IsNumber() @Min(0) signature_y?: number;
  @IsOptional() @IsInt() @Min(1) signature_page?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(1000) signature_width?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(1000) signature_height?: number;
  @IsOptional() @IsString() @MaxLength(1000) annotation_text?: string;
  @IsOptional() @IsBoolean() date_stamp?: boolean;
}
