import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    category: string; // e.g., 'Cleaning', 'Cooking'

    @Column({ nullable: true })
    subcategory: string; // e.g., 'Deep Cleaning', 'Laundry'

    @Column('decimal')
    basePrice: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
