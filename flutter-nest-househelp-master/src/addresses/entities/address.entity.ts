import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'publicId' })
  user: User;

  @Column({ name: 'societyName', type: 'varchar', nullable: false })
  societyName: string;

  @Column({ name: 'towerNumber', type: 'varchar', nullable: true })
  towerNumber: string;

  @Column({ name: 'flatNumber', type: 'varchar', nullable: false })
  flatNumber: string;

  @Column({ name: 'landmark', type: 'varchar', nullable: true })
  landmark: string;

  @Column({ name: 'area', type: 'varchar', nullable: true })
  area: string;

  @Column({ name: 'city', type: 'varchar', nullable: true })
  city: string;

  @Column({ name: 'state', type: 'varchar', nullable: true })
  state: string;

  @Column({ name: 'pincode', type: 'varchar', nullable: true })
  pincode: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'isDefault', default: false })
  isDefault: boolean;

  @Column({ name: 'label', type: 'varchar', nullable: true })
  label: string; // e.g., "Home", "Office"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
