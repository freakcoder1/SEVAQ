import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, Frequency, SubscriptionStatus } from './entities/subscription.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async createSubscription(
    @Body() body: {
      serviceProfileId: number;
      frequency: Frequency;
      timeWindowStart: string;
      timeWindowEnd: string;
      startDate: string;
      customDays?: number[];
    },
    @Request() req,
  ): Promise<Subscription> {
    try {
      // Parse time strings like "08:00" to Date objects
      const parseTime = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      const timeWindowStart = parseTime(body.timeWindowStart);
      const timeWindowEnd = parseTime(body.timeWindowEnd);
      const startDate = new Date(body.startDate);

      return this.subscriptionsService.createSubscription(
        parseInt(req.user.userId),
        body.serviceProfileId,
        body.frequency,
        timeWindowStart,
        timeWindowEnd,
        startDate,
        body.customDays,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('user/:userId')
  async getSubscriptionsByUserId(@Param('userId') userId: string): Promise<Subscription[]> {
    return this.subscriptionsService.getSubscriptionsByUserId(parseInt(userId));
  }

  @Get(':id')
  async getSubscriptionById(@Param('id') id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsService.getSubscriptionById(parseInt(id));
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }
    return subscription;
  }

  @Get('public/:publicId')
  async getSubscriptionByPublicId(@Param('publicId') publicId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsService.getSubscriptionByPublicId(publicId);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }
    return subscription;
  }

  @Put(':id/pause')
  async pauseSubscription(@Param('id') id: string): Promise<Subscription> {
    try {
      return this.subscriptionsService.pauseSubscription(parseInt(id));
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/resume')
  async resumeSubscription(@Param('id') id: string): Promise<Subscription> {
    try {
      return this.subscriptionsService.resumeSubscription(parseInt(id));
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/cancel')
  async cancelSubscription(@Param('id') id: string): Promise<Subscription> {
    try {
      return this.subscriptionsService.cancelSubscription(parseInt(id));
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() updates: Partial<Subscription>,
  ): Promise<Subscription> {
    try {
      return this.subscriptionsService.updateSubscription(parseInt(id), updates);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionsService.getSubscriptionsByStatus(SubscriptionStatus.ACTIVE);
  }
}
