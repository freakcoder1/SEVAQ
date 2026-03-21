import {
  IsNumber,
  IsUUID,
  IsDate,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus, AssignmentState } from '../entities/booking.entity';

export class UpdateBookingDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(AssignmentState)
  assignmentState?: AssignmentState;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  responsibilityTransferred?: boolean;

  @IsOptional()
  @IsBoolean()
  systemMonitoring?: boolean;
}
