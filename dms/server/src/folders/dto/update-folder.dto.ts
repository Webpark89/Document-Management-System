import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { FolderVisibilityEnum } from './create-folder.dto';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
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
  @IsUUID('all', { each: true })
  shared_departments?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  shared_users?: string[];
}
