import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { WorkersService } from '../workers/workers.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @Inject(forwardRef(() => WorkersService))
    private workersService: WorkersService,
  ) {}

  async create(createReviewDto: any) {
    const review = this.reviewsRepository.create(createReviewDto);
    const savedReview = await this.reviewsRepository.save(review);

    // Update Worker Rating
    const workerId = createReviewDto.worker;
    if (workerId) {
      const reviews = await this.reviewsRepository.find({
        where: { worker: { id: workerId } },
      });
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const count = reviews.length;
      const average = count > 0 ? totalRating / count : 0;
      // Round to 1 decimal place
      await this.workersService.updateRating(
        workerId,
        Number(average.toFixed(1)),
        count,
      );
    }

    return savedReview;
  }

  findAll() {
    return this.reviewsRepository.find({ relations: ['user', 'worker'] });
  }

  findByWorker(workerId: number) {
    return this.reviewsRepository.find({
      where: { worker: { id: workerId } },
      relations: ['user'],
    });
  }
}
