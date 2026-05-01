import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  BeforeInsert,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { randomUUID } from 'crypto';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { unique: true, nullable: false })
  token: string;

  @BeforeInsert()
  generateToken() {
    if (!this.token) {
      this.token = randomUUID();
    }
  }

  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to check if token is expired
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Helper method to check if token is valid
  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}
