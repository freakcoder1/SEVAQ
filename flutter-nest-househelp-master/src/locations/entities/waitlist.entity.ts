import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Waitlist {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'int' })
    serviceId: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    @Column({ type: 'timestamp' })
    requestedAt: Date;

    @Column({ type: 'varchar', default: 'pending' })
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