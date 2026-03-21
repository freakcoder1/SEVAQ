import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { Worker } from '../../workers/entities/worker.entity';

export enum ServiceRequestSource {
  SUBSCRIPTION = 'SUBSCRIPTION',
  ONE_TIME = 'ONE_TIME',
}

@Entity('service_requests')
@Index(['userId', 'createdAt']) // Performance optimization
@Index(['assignmentStatus', 'createdAt']) // For async job processing
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Internal ID (UUID)

  @Column('uuid', { unique: true, nullable: false })
  publicId: string; // Public API ID

  @Column({
    type: 'varchar',
    enum: ServiceRequestSource,
    default: ServiceRequestSource.ONE_TIME,
  })
  source: ServiceRequestSource;

  @Column('int')
  userId: number;

  @Column('int', { nullable: true })
  serviceId?: number;

  @Column('int', { nullable: true })
  serviceProfileId?: number;

  @Column()
  date: Date;

  @Column({
    type: 'varchar',
    enum: ['morning', 'afternoon', 'evening', 'early-morning'],
  })
  timeWindow: string;

  @Column('decimal', { precision: 10, scale: 2 })
  priceSnapshot: number;

  @Column({
    type: 'varchar',
    default: 'REQUESTED',
  })
  assignmentStatus: 'REQUESTED' | 'ASSIGNED' | 'FAILED_TO_ASSIGN';

  @Column({ nullable: true, type: 'int' })
  assignedWorkerId?: number | null;

  @Column({ nullable: true, type: 'int' })
  assignedSlotId?: number | null;

  @Column({ nullable: true, type: 'text' })
  failureReason?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    location?: { lat: number; lng: number };
    retryCount?: number;
    lastRetryAt?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // NOTE: Booking relationship removed - Booking is legacy table

  @ManyToOne(() => User, (user) => user.serviceRequests)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Service, (service) => service.serviceRequests)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ManyToOne(() => Worker, (worker) => worker.serviceRequests)
  @JoinColumn({ name: 'assignedWorkerId' })
  worker: Worker;

  // Business logic methods
  canRetry(): boolean {
    return (
      this.assignmentStatus === 'FAILED_TO_ASSIGN' &&
      (this.metadata?.retryCount || 0) < 3
    );
  }

  shouldAutoRetry(): boolean {
    return this.canRetry() && this.failureReason !== 'NO_WORKERS_AVAILABLE';
  }
}
