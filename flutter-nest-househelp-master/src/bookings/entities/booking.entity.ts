import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { Service } from '../../services/entities/service.entity';
import { Slot } from '../../slots/entities/slot.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Payment } from '../../payments/entities/payment.entity';

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
  @PrimaryGeneratedColumn()
  id: number; // Internal ID
  
  @Column('uuid', { unique: true, nullable: false })
  publicId: string; // Public API ID

  @Column({ name: 'serviceRequestId', type: 'uuid' })
  serviceRequestId: string;

  @ManyToOne(() => ServiceRequest, { nullable: false })
  @JoinColumn({ name: 'serviceRequestId' })
  serviceRequest: ServiceRequest;

  @Column({ name: 'userId', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', nullable: true })
  workerId: number;

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'workerId' })
  worker: Worker;

  @Column({ type: 'int', nullable: true })
  serviceId: number;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'int', nullable: true })
  slotId: number;

  @ManyToOne(() => Slot, { nullable: true })
  @JoinColumn({ name: 'slotId' })
  slot: Slot;

  @Column({ type: 'time' })
  startTime: Date;

  @Column({ type: 'time' })
  endTime: Date;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'totalAmount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

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

  @Column({ type: 'int', nullable: true })
  assignedWorkerId: number;

  @Column({ type: 'text', nullable: true })
  assignmentReason: string;

  @Column({ type: 'integer', default: 0 })
  reassignmentCount: number;

  @Column({ type: 'timestamp', nullable: true })
  assignmentTimestamp: Date;

  @Column({ type: 'text', nullable: true })
  assignmentMetadata: string;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
