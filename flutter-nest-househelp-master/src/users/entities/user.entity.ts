import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
    USER = 'user',
    WORKER = 'worker',
    ADMIN = 'admin',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({
        type: 'varchar',
        default: 'user',
    })
    role: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
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

    @Column({ type: 'json', nullable: true })
    locationHistory: Array<{
        lat: number;
        lng: number;
        timestamp: Date;
        accuracy: number;
    }>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
