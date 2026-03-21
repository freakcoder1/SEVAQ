import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Booking)
  @JoinColumn()
  booking: Booking;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Worker)
  worker: Worker;

  @Column('int')
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
