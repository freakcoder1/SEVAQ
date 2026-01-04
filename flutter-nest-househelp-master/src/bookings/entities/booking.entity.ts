import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { Service } from '../../services/entities/service.entity';

export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
}

export enum BookingType {
    ONE_TIME = 'one_time',
    SUBSCRIPTION = 'subscription',
}

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User;

    @ManyToOne(() => Worker)
    @JoinColumn()
    worker: Worker;

    @ManyToOne(() => Service)
    @JoinColumn()
    service: Service;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING,
    })
    status: BookingStatus;

    @Column({
        type: 'enum',
        enum: BookingType,
        default: BookingType.ONE_TIME,
    })
    type: BookingType;

    @Column({ type: 'json', nullable: true })
    subscriptionDetails: any; // Store frequency, duration etc.

    @Column({ default: false })
    isPaid: boolean;

    @Column({ nullable: true })
    paymentId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
