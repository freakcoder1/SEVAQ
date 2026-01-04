import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as GeoJSON from 'geojson';

@Entity()
export class MicroZone {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    centerLat: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    centerLng: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    radiusKm: number; // 0.5 to 2km

    @Column({ type: 'enum', enum: ['static', 'dynamic', 'hybrid'] })
    zoneType: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'json', nullable: true })
    boundaries: GeoJSON.Polygon; // For complex zone shapes

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}