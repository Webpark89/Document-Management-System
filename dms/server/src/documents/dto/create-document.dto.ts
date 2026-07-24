import { IsNotEmpty, IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class PRItemDto {
  @IsNotEmpty()
  @IsString()
  item_name: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNotEmpty()
  @IsNumber()
  unit_price: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  prefix: string; // e.g. "PR", "PO", "MEMO", "OTHER"

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsArray()
  items?: PRItemDto[];

  @IsOptional()
  @IsArray()
  workflow_steps?: { step_order: number; approver_id: string }[];
}
