import { Controller, Post, Body, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { ServiceProfilesService } from '../service-profiles/service-profiles.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly serviceProfilesService: ServiceProfilesService,
  ) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() body: { amount: number; currency?: string }) {
    return this.paymentsService.createOrder(body.amount, body.currency);
  }

  @Post('create-subscription-order')
  @UseGuards(JwtAuthGuard)
  async createSubscriptionOrder(@Body() body: any, @Req() req: Request) {
    // Create payment order for subscription
    // Supports both existing serviceProfileId OR custom dynamic pricing
    
    let monthlyPriceInRupees: number;
    
    if (body.customPrice !== undefined) {
      // Custom dynamic pricing mode - use provided price directly
      monthlyPriceInRupees = Number(body.customPrice);
      
      if (isNaN(monthlyPriceInRupees) || monthlyPriceInRupees < 100) {
        throw new BadRequestException('Invalid custom price. Must be minimum 100 INR.');
      }
    } else {
      // Existing profile mode - load from database
      const serviceProfile = await this.serviceProfilesService.getProfileById(
        body.serviceProfileId,
      );
      if (!serviceProfile) {
        throw new BadRequestException('Service profile not found');
      }
      
      monthlyPriceInRupees = Number(serviceProfile.monthlyPrice);
    }
    
    // Convert rupees to paise for Razorpay (Razorpay expects amount in paise)
    const amountInPaise = monthlyPriceInRupees * 100;
    const order = await this.paymentsService.createOrder(amountInPaise, 'INR');

    // Use authenticated user's publicId (UUID) from JWT token
    const userId = (req.user as any).userId;

    // Return order with subscription data
    return {
      ...order,
      subscription: {
        userId: userId, // Now guaranteed to be UUID from JWT
        serviceProfileId: body.serviceProfileId,
        preferredTimeWindow: body.preferredTimeWindow,
        startDate: body.startDate,
        location: body.location,
        monthlyPriceSnapshot: monthlyPriceInRupees, // Store in rupees for scheduler
        // Include customPlanData if provided (for custom plans)
        ...(body.customPlanData && { customPlanData: body.customPlanData }),
      },
    };
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body()
    body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      signature: string;
      bookingData?: any;
      subscriptionData?: any;
    },
  ) {
    // Check if it's a booking payment or subscription payment
    if (body.bookingData) {
      // Atomically verify payment + create booking in a single flow
      const booking = await this.paymentsService.verifyAndCreateBooking(
        body.razorpayOrderId,
        body.razorpayPaymentId,
        body.signature,
        body.bookingData,
      );

      // If booking has a provisional assignment, confirm it
      if (
        booking.assignmentType === 'PROVISIONAL' &&
        booking.assignmentState === 'PROVISIONAL_ASSIGNED'
      ) {
        // Assignment confirmation handled internally by service requests module
        return { status: 'success', booking };
      }

      return { status: 'success', booking };
    } else if (body.subscriptionData) {
      // Atomically verify payment + create subscription in a single flow
      const subscription =
        await this.paymentsService.verifyAndCreateSubscription(
          body.razorpayOrderId,
          body.razorpayPaymentId,
          body.signature,
          body.subscriptionData,
        );
      return { status: 'success', subscription };
    } else {
      throw new BadRequestException('No booking or subscription data provided');
    }
  }

  @Post('confirm-subscription')
  @UseGuards(JwtAuthGuard)
  async confirmSubscription(@Body() body: any, @Req() req: Request) {
    // Use authenticated user's publicId (UUID) from JWT token
    const userId = (req.user as any).userId;

    let monthlyPriceInRupees: number;
    let serviceProfileId: number | null;

    if (body.customPrice !== undefined) {
      // Custom dynamic pricing mode - use provided price directly
      monthlyPriceInRupees = Number(body.customPrice);
      serviceProfileId = null;
      
      if (isNaN(monthlyPriceInRupees) || monthlyPriceInRupees < 100) {
        throw new BadRequestException('Invalid custom price. Must be minimum 100 INR.');
      }
    } else {
      // Existing profile mode - load from database
      const serviceProfile = await this.serviceProfilesService.getProfileById(
        body.serviceProfileId,
      );
      if (!serviceProfile) {
        throw new BadRequestException('Service profile not found');
      }
      
      monthlyPriceInRupees = Number(serviceProfile.monthlyPrice);
      serviceProfileId = body.serviceProfileId;
    }

    // Get subscription data - use authenticated userId from JWT
    const subscriptionData = {
      userId: userId, // Use authenticated user's UUID
      serviceProfileId: serviceProfileId,
      preferredTimeWindow: body.preferredTimeWindow,
      startDate: body.startDate,
      location: body.location,
      monthlyPriceSnapshot: monthlyPriceInRupees,
      customPlanData: body.customPlanData,
    };

    // Atomically verify payment + create subscription in a single flow
    const subscription =
      await this.paymentsService.verifyAndCreateSubscription(
        body.razorpayOrderId,
        body.razorpayPaymentId,
        body.signature,
        subscriptionData,
      );
    return { status: 'success', subscription };
  }
}
