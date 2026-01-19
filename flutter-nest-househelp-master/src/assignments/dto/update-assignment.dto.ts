import { IsOptional, IsEnum, IsString } from 'class-validator';
import { AssignmentState } from '../../bookings/entities/booking.entity';

export class UpdateAssignmentDto {
  @IsOptional()
  @IsEnum(AssignmentState)
  assignmentState?: AssignmentState;

  @IsOptional()
  @IsString()
  assignedWorkerId?: string;

  @IsOptional()
  @IsString()
  assignmentFailureReason?: string;
}