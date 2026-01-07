import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Worker } from '../../workers/entities/worker.entity';

@Entity()
export class Slot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Worker, { nullable: true })
    @JoinColumn()
    worker: Worker;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column({ default: false })
    isBooked: boolean;
}
