import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('assignment_metrics')
@Index(['assignmentId', 'timestamp'])
@Index(['serviceType', 'timestamp'])
@Index(['location', 'timestamp'])
@Index(['workerId', 'timestamp'])
export class AssignmentMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  assignmentId: string;

  @Column('uuid')
  bookingId: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  workerId: string;

  @Column({ length: 50 })
  serviceType: string;

  @Column({ length: 100 })
  location: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  assignmentTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  workerRating: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  userSatisfaction: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('worker_performance_metrics')
@Index(['workerId', 'date'])
export class WorkerPerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workerId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  totalAssignments: number;

  @Column()
  successfulAssignments: number;

  @Column()
  failedAssignments: number;

  @Column()
  cancelledAssignments: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  successRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  averageAssignmentTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageRating: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageUserSatisfaction: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  utilizationRate: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('user_behavior_metrics')
@Index(['userId', 'date'])
export class UserBehaviorMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  totalBookings: number;

  @Column()
  successfulBookings: number;

  @Column()
  failedBookings: number;

  @Column()
  cancelledBookings: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  conversionRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageSatisfaction: number;

  @Column()
  totalSpent: number;

  @Column()
  repeatBookingRate: number;

  @Column({ type: 'json', nullable: true })
  servicePreferences: any;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('system_performance_metrics')
@Index(['metricType', 'timestamp'])
export class SystemPerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  metricType: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}