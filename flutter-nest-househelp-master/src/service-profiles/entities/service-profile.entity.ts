import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ServiceType {
  COOK = 'COOK',
  MAID = 'MAID',
  CLEANING = 'CLEANING',
}

export enum ProfileName {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  EXTENDED = 'EXTENDED',
  COMPACT = 'COMPACT',
}

@Entity('service_profiles')
export class ServiceProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { unique: true, nullable: false })
  publicId: string;

  @Column({
    type: 'varchar',
    enum: ServiceType,
  })
  serviceType: ServiceType;

  @Column({
    type: 'varchar',
    enum: ProfileName,
  })
  profileName: ProfileName;

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

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
