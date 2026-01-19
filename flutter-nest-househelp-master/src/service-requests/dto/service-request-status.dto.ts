export class ServiceRequestStatusDto {
  requestId: string;
  assignmentStatus: 'REQUESTED' | 'ASSIGNED' | 'FAILED_TO_ASSIGN';
  assignedWorkerId?: string;
  assignedSlotId?: string;
  assignedAt?: Date;
  failedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}