import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fcm_guest_token')
export class FcmGuestToken {
  @PrimaryColumn({ type: 'varchar', length: 256 })
  deviceId: string;

  @Column({ type: 'text' })
  token: string;

  @CreateDateColumn()
  createdAt: Date;
}
