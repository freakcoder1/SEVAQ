import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as GeoJSON from 'geojson';

@Entity()
export class ServiceArea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  pincode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  minLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  maxLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  minLng: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  maxLng: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  coverageMap: GeoJSON.MultiPolygon;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
