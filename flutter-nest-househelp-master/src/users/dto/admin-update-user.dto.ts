import {
  IsOptional,
  IsEmail,
  IsString,
  IsEnum,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { IsValidRoleAssignment } from '../../common/validators/role-constraint.validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail(
    {},
    {
      message:
        'Please provide a valid email address in the correct format (e.g., user@example.com)',
    },
  )
  @MaxLength(254, { message: 'Email must not exceed 254 characters' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  password?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(1, { message: 'First name must be at least 1 character long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(1, { message: 'Last name must be at least 1 character long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  lastName?: string;

  @IsOptional()
  @IsValidRoleAssignment({
    message: 'Invalid role assignment for admin operations',
  })
  role?: UserRole;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Please provide a valid phone number in international format (e.g., +1234567890)',
  })
  phone?: string;

  @ValidateIf((o) => o.longitude !== undefined)
  @IsNumber({}, { message: 'Latitude must be a number between -90 and 90' })
  latitude?: number;

  @ValidateIf((o) => o.latitude !== undefined)
  @IsNumber({}, { message: 'Longitude must be a number between -180 and 180' })
  longitude?: number;
}
