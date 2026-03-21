import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { AssignmentState } from '../../bookings/entities/booking.entity';

export class CreateAssignmentDto {
  @IsNumber()
  bookingId: number;

  @IsOptional()
  @IsNumber()
  preferredWorkerId?: number;

  @IsOptional()
  @IsEnum(AssignmentState)
  assignmentState?: AssignmentState;
}
