import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Worker } from '../../workers/entities/worker.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { randomUUID } from 'crypto';

@Entity('service')
export class Service {
  @PrimaryGeneratedColumn()
  id: number; // Internal ID

  @Column('uuid', { unique: true, nullable: false })
  publicId: string; // Public API ID

  @BeforeInsert()
  generatePublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice: number;

  @Column({ type: 'text', nullable: true })
  reassuranceText: string; // "A safe choice for most homes"

  @Column('text', { array: true, default: '{}' })
  whatWillHappen: string[]; // ["Helper will arrive and confirm task", "Work done with standard tools"]

  @Column('text', { array: true, default: '{}' })
  whatWillNotHappen: string[]; // ["No upselling without approval", "No extra work added silently"]

  @Column({ type: 'text', nullable: true })
  ifSomethingGoesWrong: string; // "Sevaq will replace or refund immediately"

  @Column({ type: 'text', nullable: true })
  category: string; // Simple string category for now

  @Column({ type: 'text', nullable: true })
  subcategory: string;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'boolean', default: false })
  isFastBooking: boolean;

  @Column({ type: 'integer', nullable: true })
  estimatedWaitTime: number;

  @Column({ type: 'integer', nullable: true })
  workerCount: number;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @ManyToMany(() => Worker, (worker) => worker.services)
  workers: Worker[];

  @OneToMany(() => ServiceRequest, (serviceRequest) => serviceRequest.service)
  serviceRequests: ServiceRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
