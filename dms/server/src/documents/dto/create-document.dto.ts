import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class DocumentItemDto {
  @IsString() @IsNotEmpty() @MaxLength(500) item_name: string;
  @IsInt() @Min(1) @Max(1000000) quantity: number;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(99999999) unit_price: number;
  @IsOptional() @IsString() @MaxLength(2000) remark?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) vat?: number;
}

export class VisibilityDto {
  @IsIn(['CompanyWide', 'Department', 'SpecificUsers']) type: string;
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  departments: string[] = [];
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  users: string[] = [];
}

export class SubmitStepDto {
  @IsInt() @Min(1) @Max(20) step_order: number;
  @IsOptional() @IsUUID() approver_id?: string;
}

export class SubmitWorkflowDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SubmitStepDto)
  workflow_steps?: SubmitStepDto[];
}

export class CreateDocumentDto {
  @IsOptional() @IsUUID('4') client_request_id?: string;
  @IsString() @IsNotEmpty() @MaxLength(500) title: string;
  @IsString() @IsNotEmpty() @MaxLength(12) prefix: string;
  @IsOptional() @IsString() @MaxLength(50000) purpose?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => DocumentItemDto)
  items?: DocumentItemDto[];
  @IsOptional() @IsString() @MaxLength(500) vendor_name?: string;
  @IsOptional() @IsString() @MaxLength(1000) vendor_contact?: string;
  @IsOptional() @IsDateString() delivery_date?: string;
  @IsOptional() @IsDateString() requested_date?: string;
  @IsOptional() @IsDateString() required_date?: string;
  @IsOptional() @IsString() @MaxLength(1000) payment_terms?: string;
  @IsOptional() @IsString() @MaxLength(5000) remark?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => VisibilityDto)
  visibility?: VisibilityDto;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SubmitStepDto)
  workflow_steps?: SubmitStepDto[];
}
