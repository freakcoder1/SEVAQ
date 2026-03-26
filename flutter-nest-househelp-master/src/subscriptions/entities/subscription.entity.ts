import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { ServiceProfile } from '../../service-profiles/entities/service-profile.entity';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { randomUUID } from 'crypto';

export enum PreferredTimeWindow {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { unique: true, nullable: false })
  publicId: string;

  @BeforeInsert()
  generatePublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'publicId' })
  user: User;

  @Column('int')
  serviceProfileId: number;

  @OneToOne(() => ServiceProfile)
  @JoinColumn()
  serviceProfile: ServiceProfile;

  @Column({ type: 'json', nullable: true })
  location?: { lat: number; lng: number; address?: string };

  @Column({
    type: 'varchar',
    enum: PreferredTimeWindow,
    name: 'preferredtimewindow',
  })
  preferredTimeWindow: PreferredTimeWindow;

  @Column('date')
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({
    type: 'varchar',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'varchar',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPriceSnapshot: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('int', { nullable: true })
  assignedWorkerId: number | null;

  @Column({ type: 'timestamp', nullable: true })
  availabilityDetectedAt: Date | null;

  @Column({ type: 'boolean', default: false, name: 'worker_assignment_failed' })
  workerAssignmentFailed: boolean;

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'assignedWorkerId' })
  assignedWorker: Worker | null;
}
