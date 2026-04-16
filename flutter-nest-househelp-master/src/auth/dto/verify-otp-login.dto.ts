import { IsString, IsNotEmpty, Matches, IsOptional, MaxLength, MinLength } from 'class-validator';

export class VerifyOtpLoginDto {
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in E.164 format (e.g., +919876543210)',
  })
  phone: string;

  @IsString({ message: 'ID token must be a string' })
  @IsNotEmpty({ message: 'ID token is required' })
  idToken: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must be maximum 50 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must be maximum 50 characters' })
  lastName?: string;
}
