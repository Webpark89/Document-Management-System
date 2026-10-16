import { PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
export class CreateUserDto {
  @IsNotEmpty() @IsString() @MaxLength(100) username: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
  @IsNotEmpty() @IsString() @MaxLength(100) first_name: string;
  @IsString() @MaxLength(100) last_name: string;
  @IsUUID() department_id: string;
  @IsOptional() @IsUUID() position_id?: string;
  @IsUUID() role_id: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional() @IsBoolean() is_active?: boolean;
}
