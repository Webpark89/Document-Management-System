import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveStepDto {
  @IsOptional()
  @IsString()
  comment?: string;

  /** พิกัด X ของลายเซ็นบน PDF (หน่วย: point) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signature_x?: number;

  /** พิกัด Y ของลายเซ็นบน PDF (หน่วย: point) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signature_y?: number;

  /** หน้าที่ต้องการวางลายเซ็น (1-based) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  signature_page?: number;

  /** กว้าง/สูงของลายเซ็น (default 120x60) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signature_width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signature_height?: number;
}
