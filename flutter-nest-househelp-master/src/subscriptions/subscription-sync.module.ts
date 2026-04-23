import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionWorkerSyncService } from './subscription-worker-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  providers: [SubscriptionWorkerSyncService],
  exports: [SubscriptionWorkerSyncService],
})
export class SubscriptionSyncModule {}
