import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  IsUrl,
  Min,
  Matches,
} from 'class-validator';

export class AdminUpdateServiceDto {
  @IsOptional()
  @IsString({ message: 'Service name must be a string' })
  @MinLength(2, { message: 'Service name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Service name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s\-&]+$/, {
    message:
      'Service name can only contain letters, spaces, hyphens, and ampersands',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @MinLength(2, { message: 'Category must be at least 2 characters long' })
  @MaxLength(50, { message: 'Category must not exceed 50 characters' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'Subcategory must be a string' })
  @MinLength(2, { message: 'Subcategory must be at least 2 characters long' })
  @MaxLength(50, { message: 'Subcategory must not exceed 50 characters' })
  subcategory?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Base price must be a number' })
  @Min(0, { message: 'Base price must be greater than or equal to 0' })
  basePrice?: number;

  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  @MaxLength(500, { message: 'Image URL must not exceed 500 characters' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isAvailable must be a boolean' })
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isFastBooking must be a boolean' })
  isFastBooking?: boolean;
}
