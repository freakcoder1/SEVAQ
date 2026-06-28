import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';

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
  // Cleaning Services
  BHK_1 = '1BHK',
  BHK_2 = '2BHK',
  BHK_3 = '3BHK',
  // Cooking Services
  BHK_1_BF = '1-BHK-BF',
  BHK_1_LUNCH = '1-BHK-LUNCH',
  BHK_1_DINNER = '1-BHK-DINNER',
  BHK_1_BF_LUNCH = '1-BHK-BF_LUNCH',
  BHK_1_LUNCH_DINNER = '1-BHK-LUNCH_DINNER',
  BHK_1_FULL_DAY = '1-BHK-FULL_DAY',
  BHK_2_BF = '2-BHK-BF',
  BHK_2_LUNCH = '2-BHK-LUNCH',
  BHK_2_DINNER = '2-BHK-DINNER',
  BHK_2_BF_LUNCH = '2-BHK-BF_LUNCH',
  BHK_2_LUNCH_DINNER = '2-BHK-LUNCH_DINNER',
  BHK_2_FULL_DAY = '2-BHK-FULL_DAY',
  BHK_3_BF = '3-BHK-BF',
  BHK_3_LUNCH = '3-BHK-LUNCH',
  BHK_3_DINNER = '3-BHK-DINNER',
  BHK_3_BF_LUNCH = '3-BHK-BF_LUNCH',
  BHK_3_LUNCH_DINNER = '3-BHK-LUNCH_DINNER',
  BHK_3_FULL_DAY = '3-BHK-FULL_DAY',
  BHK_4_BF = '4-BHK-BF',
  BHK_4_LUNCH = '4-BHK-LUNCH',
  BHK_4_DINNER = '4-BHK-DINNER',
  BHK_4_BF_LUNCH = '4-BHK-BF_LUNCH',
  BHK_4_LUNCH_DINNER = '4-BHK-LUNCH_DINNER',
  BHK_4_FULL_DAY = '4-BHK-FULL_DAY',
  BHK_5_BF = '5-BHK-BF',
  BHK_5_LUNCH = '5-BHK-LUNCH',
  BHK_5_DINNER = '5-BHK-DINNER',
  BHK_5_BF_LUNCH = '5-BHK-BF_LUNCH',
  BHK_5_LUNCH_DINNER = '5-BHK-LUNCH_DINNER',
  BHK_5_FULL_DAY = '5-BHK-FULL_DAY',
  BHK_6_BF = '6-BHK-BF',
  BHK_6_LUNCH = '6-BHK-LUNCH',
  BHK_6_DINNER = '6-BHK-DINNER',
  BHK_6_BF_LUNCH = '6-BHK-BF_LUNCH',
  BHK_6_LUNCH_DINNER = '6-BHK-LUNCH_DINNER',
  BHK_6_FULL_DAY = '6-BHK-FULL_DAY',
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

  @Column('uuid', { unique: true, nullable: false, name: 'publicId' })
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
    name: 'serviceType',
  })
  serviceType: ServiceType;

  @Column({
    type: 'varchar',
    enum: ProfileName,
    name: 'profilename',
  })
  profileName: ProfileName;

  @Column({ type: 'text', name: 'description' })
  description: string;

  @Column({ type: 'text', name: 'scopeDefinition' })
  scopeDefinition: string;

  @Column({ type: 'text', name: 'maxCapacityHint' })
  maxCapacityHint: string;

  @Column({ type: 'json', nullable: true, name: 'internalRules' })
  internalRules: any;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'monthlyPrice' })
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

  @Column({ type: 'boolean', default: true, name: 'isActive' })
  isActive: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
