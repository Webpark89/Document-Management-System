import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { FolderVisibilityEnum } from './create-folder.dto';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  @IsArray()
  shared_departments?: string[];

  @IsOptional()
  @IsArray()
  shared_users?: string[];
}
