import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FcmGuestTokenService } from './fcm-guest-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FcmGuestToken } from './entities/fcm-guest-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, FcmGuestToken])],
  controllers: [UsersController],
  providers: [UsersService, FcmGuestTokenService],
  exports: [UsersService, FcmGuestTokenService],
})
export class UsersModule {}
