import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';

@Entity()
export class Worker {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User)
    @JoinColumn()
    user: User;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ type: 'decimal', default: 0 })
    rating: number;

    @Column({ default: 0 })
    reviewCount: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
    serviceRadiusKm: number; // Default 5km

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLat: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLng: number;

    @Column({ type: 'timestamp', nullable: true })
    lastLocationUpdate: Date;

    @Column({ type: 'json', nullable: true })
    availabilitySchedule: Array<{
        day: number; // 0-6 (Sunday-Saturday)
        startTime: string; // "09:00"
        endTime: string; // "18:00"
    }>;

    @Column({ default: true })
    isActive: boolean;

    @ManyToMany(() => Service)
    @JoinTable()
    services: Service[];
}
