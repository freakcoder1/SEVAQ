import {
  IsNumber,
  IsUUID,
  IsDate,
  IsOptional,
  IsString,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus, BookingType } from '../entities/booking.entity';
import { LocationDto } from './location.dto';

export class CreateBookingDto {
  @IsUUID()
  @IsOptional()
  serviceRequestId?: string;

  @IsNumber()
  @IsOptional()
  serviceId?: number;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsNumber()
  @IsOptional()
  workerId?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

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
