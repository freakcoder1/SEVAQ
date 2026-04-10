import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pricing_rules')
export class PricingRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  serviceId: number;

  @Column({ nullable: true })
  dayOfWeek: number;

  @Column({ nullable: true })
  timeSlot: string;

  @Column({ type: 'float', default: 1.0 })
  multiplier: number;

  @Column({ type: 'float', nullable: true })
  minPrice: number;

  @Column({ type: 'float', nullable: true })
  maxPrice: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
