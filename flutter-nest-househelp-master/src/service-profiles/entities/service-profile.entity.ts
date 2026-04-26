import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';

export enum ServiceType {
  COOK = 'COOK',
  MAID = 'MAID',
  CLEANING = 'CLEANING',
}



export enum VisitPattern {
  DAILY = 'DAILY',
}

export enum MaxVisitsPerDay {
  ONE = 1,
}

@Entity('service_profiles')
export class ServiceProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { unique: true, nullable: false })
  publicId: string;

  @BeforeInsert()
  generatePublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }

  @Column({
    type: 'varchar',
    enum: ServiceType,
  })
  serviceType: ServiceType;



  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  scopeDefinition: string;

  @Column({ type: 'text' })
  maxCapacityHint: string;

  @Column({ type: 'json', nullable: true })
  internalRules: any;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice: number;

  @Column({
    type: 'varchar',
    enum: VisitPattern,
    default: VisitPattern.DAILY,
    name: 'visitpattern',
  })
  visitPattern: VisitPattern;

  @Column({
    type: 'int',
    default: MaxVisitsPerDay.ONE,
    name: 'maxvisitsperday',
  })
  maxVisitsPerDay: number;

  @Column({ type: 'json', nullable: true, name: 'defaulttimewindows' })
  defaultTimeWindows: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;



  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
