import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import * as GeoJSON from 'geojson';
import { ServiceArea } from './service_area.entity';

@Entity()
export class MicroZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  serviceAreaId: string;

  @ManyToOne(() => ServiceArea)
  @JoinColumn({ name: 'serviceAreaId' })
  serviceArea: ServiceArea;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLng: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  radiusKm: number; // 0.5 to 2km

  @Column({ nullable: true })
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
