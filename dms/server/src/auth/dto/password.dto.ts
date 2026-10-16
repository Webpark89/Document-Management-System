import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
export class ForgotPasswordDto {
  @IsEmail() email: string;
}
export class ResetPasswordDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) token: string;
  @IsString() @MinLength(8) @MaxLength(72) password_hash: string;
}
