import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  reassuranceText: string; // "A safe choice for most homes"

  @Column({ type: 'text', nullable: true })
  typicalEta: string; // "15-30 mins"

  @Column('text', { array: true, default: '{}' })
  typicalUseCases: string[]; // ["Routine cleaning", "Urgent cleaning"]

  @Column({ default: false })
  isSecondary: boolean; // true - not shown on primary home screen

  @Column({ type: 'text', nullable: true })
  systemValidation: string; // "Commonly booked in your area"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}