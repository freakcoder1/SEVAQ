import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('service_requests')
@Index(['userId', 'createdAt']) // Performance optimization
@Index(['assignmentStatus', 'createdAt']) // For async job processing
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  serviceId: string;

  @Column()
  date: Date;

  @Column({
    type: 'varchar',
    enum: ['morning', 'afternoon', 'evening'],
  })
  timeWindow: string;

  @Column('decimal', { precision: 10, scale: 2 })
  priceSnapshot: number;

  @Column({
    type: 'varchar',
    default: 'REQUESTED',
  })
  assignmentStatus: 'REQUESTED' | 'ASSIGNED' | 'FAILED_TO_ASSIGN';

  @Column({ nullable: true })
  assignedWorkerId?: string;

  @Column({ nullable: true })
  assignedSlotId?: string;

  @Column({ nullable: true })
  failureReason?: string;

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

  // Business logic methods
  canRetry(): boolean {
    return this.assignmentStatus === 'FAILED_TO_ASSIGN' && 
           (this.metadata?.retryCount || 0) < 3;
  }

  shouldAutoRetry(): boolean {
    return this.canRetry() && 
           this.failureReason !== 'NO_WORKERS_AVAILABLE';
  }
}