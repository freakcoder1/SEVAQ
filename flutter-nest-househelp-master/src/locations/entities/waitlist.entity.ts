import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Waitlist {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    serviceId: string;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    @Column({ type: 'timestamp' })
    requestedAt: Date;

    @Column({ type: 'enum', enum: ['pending', 'notified', 'cancelled'] })
    status: string;

    @Column({ type: 'timestamp', nullable: true })
    notifiedAt: Date;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    estimatedWaitTime: number; // in minutes

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}