import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';

export enum UserRole {
  USER = 'user',
  WORKER = 'worker',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number; // Auto-increment numeric ID

  @Column('uuid', { unique: true, nullable: false })
  publicId: string; // Public-facing UUID identifier

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'varchar',
    default: 'user',
  })
  role: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true, unique: true, length: 20 })
  @Index()
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  preferredLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  preferredLng: number;

  @Column({ nullable: true })
  preferredZoneId: string;

  @Column({ default: false })
  hasCompletedLocationSetup: boolean;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ type: 'json', nullable: true })
  locationHistory: Array<{
    lat: number;
    lng: number;
    timestamp: Date;
    accuracy: number;
  }>;

  @OneToMany(() => ServiceRequest, (serviceRequest) => serviceRequest.user)
  serviceRequests: ServiceRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
