import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Slot } from '../../slots/entities/slot.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Service } from '../../services/entities/service.entity';

@Entity('worker')
export class Worker {
   @PrimaryGeneratedColumn('uuid')
   id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  // NEW: Professional identity fields
  @Column({ default: 0 })
  yearsOfExperience: number;

  @Column({ default: 0 })
  homesServedInArea: number;

  @Column({ default: 0 })
  reliabilityStreak: number; // Consecutive on-time jobs

  // NEW: System backing
  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isTrained: boolean;

  @Column({ default: false })
  isMonitored: boolean;

  // NEW: Worker status
  @Column({ default: true })
  isActive: boolean;

  // Location data
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  microZoneId: string;

  @Column({ type: 'text', nullable: true })
  serviceAreaId: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  currentLocationData: string; // JSON string for location data

  // NEW: Current location tracking for real-time updates
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLng: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLocationUpdate: Date;

  // NEW: Service radius for worker availability
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 5.0 })
  serviceRadiusKm: number;

  // NEW: Availability schedule
  @Column({ type: 'json', nullable: true })
  availabilitySchedule: Array<{
    day: number;
    startTime: string;
    endTime: string;
  }>;

  @OneToMany(() => Slot, slot => slot.worker)
  slots: Slot[];


  @ManyToMany(() => Service, service => service.workers)
  @JoinTable({
    name: 'service_worker',
    joinColumn: { name: 'worker_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  services: Service[];

  @OneToMany(() => Booking, booking => booking.worker)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
