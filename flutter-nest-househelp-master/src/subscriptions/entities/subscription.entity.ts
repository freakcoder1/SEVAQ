import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum Frequency {
  DAILY = 'DAILY',
  WEEKDAYS = 'WEEKDAYS',
  CUSTOM_DAYS = 'CUSTOM_DAYS',
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

  @Column('int')
  userId: number;

  @Column('int')
  serviceProfileId: number;

  @Column({
    type: 'varchar',
    enum: Frequency,
    default: Frequency.DAILY,
  })
  frequency: Frequency;

  @Column('time')
  timeWindowStart: Date;

  @Column('time')
  timeWindowEnd: Date;

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

  @Column({ type: 'json', nullable: true })
  customDays?: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
