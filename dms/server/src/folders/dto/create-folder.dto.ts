import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export enum FolderVisibilityEnum {
  Private = 'Private',
  Department = 'Department',
  Shared = 'Shared',
  CompanyWide = 'CompanyWide',
  AdminOnly = 'AdminOnly',
}

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(FolderVisibilityEnum)
  visibility?: FolderVisibilityEnum;

  @IsOptional()
  @IsString()
  parent_id?: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  shared_departments?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  shared_users?: string[];
}
