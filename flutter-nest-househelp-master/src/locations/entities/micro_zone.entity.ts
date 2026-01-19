import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as GeoJSON from 'geojson';

@Entity()
export class MicroZone {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    centerLat: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    centerLng: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    radiusKm: number; // 0.5 to 2km

    @Column()
    zoneType: string; // 'static', 'dynamic', or 'hybrid'

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'json', nullable: true })
    boundaries: GeoJSON.Polygon; // For complex zone shapes

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}