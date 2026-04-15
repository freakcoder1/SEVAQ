import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { Service } from '../../services/entities/service.entity';
import { Slot } from '../../slots/entities/slot.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export class LocationData {
  @Expose()
  @IsNumber()
  lat: number;

  @Expose()
  @IsNumber()
  lng: number;

  @Expose()
  @IsNumber()
  latitude: number;

  @Expose()
  @IsNumber()
  longitude: number;

  @Expose()
  @IsOptional()
  @IsString()
  address: string;

  constructor() {}
}

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
  CANCELLED = 'cancelled',
  PROVISIONAL_ASSIGNED = 'provisional_assigned',
  PROVISIONAL_EXPIRED = 'provisional_expired',
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

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'workerId' })
  worker: Worker;

  @Column({ type: 'int', nullable: true })
  workerId: number;

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'assignedWorkerId' })
  assignedWorker: Worker;

  @Column({ type: 'int', nullable: true })
  assignedWorkerId: number;

  @Column({ name: 'serviceId', type: 'int', nullable: true })
  serviceId: number;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ name: 'slotId', type: 'int', nullable: true })
  slotId: number;

  @ManyToOne(() => Slot, { nullable: true })
  @JoinColumn({ name: 'slotId' })
  slot: Slot;

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount: number;

  @Column({
    name: 'totalAmount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ type: 'text', default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'text', default: BookingType.ON_DEMAND })
  type: BookingType;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'serviceRequestId', type: 'uuid', nullable: true })
  serviceRequestId: string;

  @Column({ type: 'json', nullable: true })
  @Type(() => LocationData)
  location: LocationData;

  @Column({ default: false })
  responsibilityTransferred: boolean;

  @Column({ default: false })
  systemMonitoring: boolean;

  @Column({ type: 'text', nullable: true })
  protectionStatus: string;

  @Column({ type: 'text', default: AssignmentState.PENDING })
  assignmentState: AssignmentState;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'text', nullable: true })
  assignmentReason: string;

  @Column({ type: 'integer', default: 0 })
  reassignmentCount: number;

  @Column({ type: 'timestamp', nullable: true })
  assignmentTimestamp: Date;

  @Column({ default: false })
  notificationSent: boolean;

  @Column({ type: 'text', nullable: true })
  assignmentMetadata: string;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment: Payment;

  @ManyToOne(() => ServiceRequest, { nullable: true })
  @JoinColumn({ name: 'serviceRequestId' })
  serviceRequest: ServiceRequest;

  @Column({ type: 'int', nullable: true })
  subscriptionId: number;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
