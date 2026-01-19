import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ServiceArea } from '../../locations/entities/service_area.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('city')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  slug: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  timezone: string;

  @Column({ type: 'varchar', length: 3, nullable: false })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  coverImageUrl: string;

  @Column({ type: 'json', nullable: true })
  settings: {
    defaultRadius: number;
    maxWaitTime: number;
    serviceHours: {
      start: string;
      end: string;
    };
    bookingCutoffHours: number;
  };

  // @OneToMany(() => ServiceArea, serviceArea => serviceArea.city)
  // serviceAreas: ServiceArea[];

  // @OneToMany(() => Worker, worker => worker.city)
  // workers: Worker[];

  // @OneToMany(() => Booking, booking => booking.city)
  // bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}