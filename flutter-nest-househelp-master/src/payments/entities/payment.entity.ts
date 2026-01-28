import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number; // Internal ID
    
    @Column('uuid', { unique: true, nullable: false })
    publicId: string; // Public API ID

    @Column({ type: 'int' })
    bookingId: number;

    @OneToOne(() => Booking)
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    paymentMethod: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    transactionId: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @CreateDateColumn()
    createdAt: Date;
}
