import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Worker } from '../../workers/entities/worker.entity';

export enum PaymentStatus {
    CREATED = 'created',
    PAID = 'paid',
    FAILED = 'failed',
}

@Entity()
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    bookingId: string;

    @OneToOne(() => Booking)
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column({ type: 'uuid', nullable: true })
    workerId: string;

    @ManyToOne(() => Worker, { nullable: true })
    @JoinColumn({ name: 'worker_id' })
    worker: Worker;

    @Column({ nullable: true })
    razorpayOrderId: string;

    @Column({ nullable: true })
    razorpayPaymentId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'INR' })
    currency: string;

    @Column({
        type: 'text',
        default: PaymentStatus.CREATED,
    })
    status: PaymentStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
