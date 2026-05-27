import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Address } from '../../addresses/entities/address.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { randomUUID } from 'crypto';

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

  @BeforeInsert()
  generatePublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  @Expose()
  firstName: string;

  @Column({ nullable: true })
  @Expose()
  lastName: string;

  @Column({
    type: 'varchar',
    default: 'user',
  })
  role: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true, length: 20 })
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

   @OneToMany(() => Address, (address) => address.user)
   addresses: Address[];

   @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
     cascade: true,
   })
   refreshTokens: RefreshToken[];

   @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
