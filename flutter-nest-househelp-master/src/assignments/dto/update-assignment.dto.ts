import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { AssignmentState } from '../../bookings/entities/booking.entity';

export class UpdateAssignmentDto {
  @IsOptional()
  @IsEnum(AssignmentState)
  assignmentState?: AssignmentState;

  @IsOptional()
  @IsNumber()
  assignedWorkerId?: number;

  @IsOptional()
  @IsString()
  assignmentFailureReason?: string;
}
