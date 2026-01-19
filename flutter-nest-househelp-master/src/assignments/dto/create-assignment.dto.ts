import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AssignmentState } from '../../bookings/entities/booking.entity';

export class CreateAssignmentDto {
  @IsString()
  bookingId: string;

  @IsOptional()
  @IsString()
  preferredWorkerId?: string;

  @IsOptional()
  @IsEnum(AssignmentState)
  assignmentState?: AssignmentState;
}