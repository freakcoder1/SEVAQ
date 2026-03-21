import { Module, forwardRef } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';

import { WorkersModule } from '../workers/workers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    forwardRef(() => WorkersModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
