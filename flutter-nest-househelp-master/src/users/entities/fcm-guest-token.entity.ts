import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fcm_guest_token')
export class FcmGuestToken {
  @PrimaryColumn({ type: 'varchar', length: 256, name: 'device_id' })
  deviceId: string;

  @Column({ type: 'text', name: 'token' })
  token: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
