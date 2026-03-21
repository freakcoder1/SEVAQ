export class ServiceRequestStatusDto {
  requestId: string;
  assignmentStatus: 'REQUESTED' | 'ASSIGNED' | 'FAILED_TO_ASSIGN';
  assignedWorkerId?: number;
  assignedSlotId?: number;
  assignedAt?: Date;
  failedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
