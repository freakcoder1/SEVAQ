import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  VersionColumn,
} from 'typeorm';
import { Worker } from '../../workers/entities/worker.entity';

@Entity()
@Index(['worker', 'startTime', 'isBooked']) // Composite index for slot lookup queries
@Index(['worker', 'date', 'isBooked']) // Index for date-based availability queries
export class Slot {
  @PrimaryGeneratedColumn()
  id: number; // Internal ID

  @Column('uuid', { unique: true, nullable: false })
  publicId: string; // Public API ID

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: false })
  isBooked: boolean;

  @Column({ default: 1 })
  maxBookings: number;

  @Column({ default: 0 })
  currentBookings: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @VersionColumn({ default: 1 })
  version: number; // Optimistic locking for race condition prevention

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'workerId' })
  worker: Worker;
}
