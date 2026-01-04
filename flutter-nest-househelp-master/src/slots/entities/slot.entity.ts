import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Worker } from '../../workers/entities/worker.entity';

@Entity()
export class Slot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Worker, (worker) => worker.id)
    worker: Worker;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column({ default: false })
    isBooked: boolean;
}
