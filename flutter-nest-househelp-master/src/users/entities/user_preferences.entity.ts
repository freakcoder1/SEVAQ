import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'json', nullable: true })
  favoriteServices: Array<{
    serviceId: string;
    category: string;
    lastBooked: Date;
    bookingCount: number;
  }>;

  @Column({ type: 'json', nullable: true })
  bookingHistory: Array<{
    serviceId: string;
    serviceName: string;
    category: string;
    bookingDate: Date;
    rating?: number;
    review?: string;
  }>;

  @Column({ type: 'json', nullable: true })
  servicePreferences: Array<{
    category: string;
    preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
    preferredDays: number[]; // 0-6 (Sunday-Saturday)
    maxWaitTime: number; // Maximum acceptable wait time in minutes
  }>;

  @Column({ type: 'json', nullable: true })
  locationPreferences: Array<{
    microZoneId: string;
    preferred: boolean;
    lastVisited: Date;
  }>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageRatingGiven: number;

  @Column({ default: 0 })
  totalBookings: number;

  @Column({ type: 'timestamp', nullable: true })
  lastBookingDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
