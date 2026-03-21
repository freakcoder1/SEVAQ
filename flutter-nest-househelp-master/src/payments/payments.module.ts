import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { ConfigModule } from '@nestjs/config';
import { BookingsModule } from '../bookings/bookings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ServiceProfilesModule } from '../service-profiles/service-profiles.module';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ConfigModule,
    BookingsModule,
    SubscriptionsModule,
    ServiceProfilesModule,
    AssignmentsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
