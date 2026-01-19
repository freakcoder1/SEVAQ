import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { Service } from '../../services/entities/service.entity';
import { Slot } from '../../slots/entities/slot.entity';

export enum BookingStatus {
  REQUESTED = 'requested',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum BookingType {
  ON_DEMAND = 'on_demand',
  SCHEDULED = 'scheduled',
  SUBSCRIPTION = 'subscription',
}

export enum AssignmentState {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  CONFIRMED = 'confirmed',
  REASSIGNING = 'reassigning',
  CANCELLED = 'cancelled'
}

@Entity('booking')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  workerId: string;

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'workerId' })
  worker: Worker;

  @Column({ type: 'uuid', nullable: true })
  serviceId: string;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'uuid', nullable: true })
  slotId: string;

  @ManyToOne(() => Slot, { nullable: true })
  @JoinColumn({ name: 'slotId' })
  slot: Slot;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'text', default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'text', default: BookingType.ON_DEMAND })
  type: BookingType;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // NEW: Responsibility transfer fields
  @Column({ default: false })
  responsibilityTransferred: boolean;

  @Column({ default: false })
  systemMonitoring: boolean;

  @Column({ type: 'text', nullable: true })
  protectionStatus: string;

  // NEW: Assignment-specific fields
  @Column({ type: 'text', default: AssignmentState.PENDING })
  assignmentState: AssignmentState;

  @Column({ type: 'uuid', nullable: true })
  assignedWorkerId: string;

  @Column({ type: 'text', nullable: true })
  assignmentReason: string;

  @Column({ type: 'integer', default: 0 })
  reassignmentCount: number;

  @Column({ type: 'timestamp', nullable: true })
  assignmentTimestamp: Date;

  @Column({ type: 'text', nullable: true })
  assignmentMetadata: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
