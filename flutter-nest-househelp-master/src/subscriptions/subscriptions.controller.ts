import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PricingService } from './pricing.service';
import {
  Subscription,
  PreferredTimeWindow,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtRequest } from '../common/types/jwt-user.type';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly pricingService: PricingService,
  ) {}

  @Post()
  async createSubscription(
    @Body()
    body: {
      serviceProfileId: number;
      preferredTimeWindow: PreferredTimeWindow;
      startDate: string;
      location: { lat: number; lng: number; address?: string };
      monthlyPriceSnapshot?: number;
    },
    @Request() req: JwtRequest,
  ): Promise<Subscription> {
    try {
      const startDate = new Date(body.startDate);

      return this.subscriptionsService.createSubscription(
        req.user.userId,
        body.serviceProfileId,
        body.preferredTimeWindow,
        startDate,
        body.location,
        body.monthlyPriceSnapshot ?? 0,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for duplicate subscription error
      if (errorMessage.includes('already have an active subscription')) {
        throw new HttpException(errorMessage, HttpStatus.CONFLICT);
      }
      
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('user/:userId')
  async getSubscriptionsByUserId(
    @Param('userId') userId: string,
  ): Promise<Subscription[]> {
    // Handle both numeric ID and UUID (publicId)
    const isNumeric = /^[0-9]+$/.test(userId);
    if (isNumeric) {
      return this.subscriptionsService.getSubscriptionsByUserId(userId);
    } else {
      // It's a UUID, use publicId
      return this.subscriptionsService.getSubscriptionsByPublicId(userId);
    }
  }

  @Get(':id')
  async getSubscriptionById(@Param('id') id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsService.getSubscriptionById(
      parseInt(id),
    );
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }
    return subscription;
  }

  @Get('public/:publicId')
  async getSubscriptionByPublicId(
    @Param('publicId') publicId: string,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionsService.getSubscriptionByPublicId(publicId);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }
    return subscription;
  }

  @Put(':id/pause')
  async pauseSubscription(@Param('id') id: string): Promise<Subscription> {
    try {
      return this.subscriptionsService.pauseSubscription(parseInt(id));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/resume')
  async resumeSubscription(@Param('id') id: string): Promise<Subscription> {
    try {
      return this.subscriptionsService.resumeSubscription(parseInt(id));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/cancel')
  async cancelSubscription(@Param('id') id: string): Promise<Subscription> {
    try {
      return this.subscriptionsService.cancelSubscription(parseInt(id));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() updates: Partial<Subscription>,
  ): Promise<Subscription> {
    try {
      return this.subscriptionsService.updateSubscription(
        parseInt(id),
        updates,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionsService.getSubscriptionsByStatus(
      SubscriptionStatus.ACTIVE,
    );
  }

  @Get('pricing/cleaning/:bhkType')
  async getCleaningPrice(@Param('bhkType') bhkType: string) {
    try {
      const price = this.pricingService.calculateCleaningPrice(parseInt(bhkType));
      return { success: true, price, bhkType: parseInt(bhkType) };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException({ success: false, message: errorMessage }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('pricing/cooking/:persons/:mealPlan')
  async getCookingPrice(
    @Param('persons') persons: string,
    @Param('mealPlan') mealPlan: string,
  ) {
    try {
      const price = this.pricingService.calculateCookingPrice(parseInt(persons), mealPlan);
      return { success: true, price, persons: parseInt(persons), mealPlan };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException({ success: false, message: errorMessage }, HttpStatus.BAD_REQUEST);
    }
  }

}
