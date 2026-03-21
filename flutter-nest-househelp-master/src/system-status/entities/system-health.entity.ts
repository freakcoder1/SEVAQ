import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_health')
export class SystemHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  serviceAvailability: number; // 0-100%

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  workerAvailability: number; // 0-100%

  @Column({ default: 0 })
  averageResponseTime: number; // minutes

  @Column({ default: true })
  isHealthy: boolean;

  @Column({ type: 'text', nullable: true })
  lastUpdated: string; // ISO string

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
