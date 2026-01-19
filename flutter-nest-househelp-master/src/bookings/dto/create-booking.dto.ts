import { IsUUID, IsDate, IsOptional, IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus, BookingType } from '../entities/booking.entity';
import { LocationDto } from './location.dto';

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  userId: string;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(BookingType)
  type?: BookingType;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}