import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  position_id?: string;

  @IsOptional()
  @IsString()
  role_id?: string;
}
