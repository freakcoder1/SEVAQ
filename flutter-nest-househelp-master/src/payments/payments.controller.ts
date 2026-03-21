import { Controller, Post, Body, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { ServiceProfilesService } from '../service-profiles/service-profiles.service';
import { AssignmentsService } from '../assignments/assignments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly serviceProfilesService: ServiceProfilesService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post('create-order')
  async createOrder(@Body() body: { amount: number; currency?: string }) {
    return this.paymentsService.createOrder(body.amount, body.currency);
  }

  @Post('create-subscription-order')
  @UseGuards(JwtAuthGuard)
  async createSubscriptionOrder(@Body() body: any, @Req() req: Request) {
    // Create payment order for subscription
    // Calculate the amount based on service profile
    const serviceProfile = await this.serviceProfilesService.getProfileById(
      body.serviceProfileId,
    );
    if (!serviceProfile) {
      throw new BadRequestException('Service profile not found');
    }

    const amount = Number(serviceProfile.monthlyPrice);
    const order = await this.paymentsService.createOrder(amount, 'INR');

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
        monthlyPriceSnapshot: amount,
      },
    };
  }

  @Post('verify')
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
    const isValid = await this.paymentsService.verifyPayment(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.signature,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Check if it's a booking payment or subscription payment
    if (body.bookingData) {
      // Create booking after successful payment verification
      const booking = await this.paymentsService.createBookingAfterPayment(
        body.bookingData,
        body.razorpayOrderId,
        body.razorpayPaymentId,
      );

      // If booking has a provisional assignment, confirm it
      if (
        booking.assignmentType === 'PROVISIONAL' &&
        booking.assignmentState === 'PROVISIONAL_ASSIGNED'
      ) {
        const confirmedBooking =
          await this.assignmentsService.confirmProvisionalAssignment(
            booking.id,
          );
        return { status: 'success', booking: confirmedBooking };
      }

      return { status: 'success', booking };
    } else if (body.subscriptionData) {
      // Create subscription after successful payment verification
      const subscription =
        await this.paymentsService.createSubscriptionAfterPayment(
          body.subscriptionData,
          body.razorpayOrderId,
          body.razorpayPaymentId,
        );
      return { status: 'success', subscription };
    } else {
      throw new BadRequestException('No booking or subscription data provided');
    }
  }

  @Post('confirm-subscription')
  @UseGuards(JwtAuthGuard)
  async confirmSubscription(@Body() body: any, @Req() req: Request) {
    const isValid = await this.paymentsService.verifyPayment(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.signature,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Use authenticated user's publicId (UUID) from JWT token
    const userId = (req.user as any).userId;

    // Get subscription data - use authenticated userId from JWT
    const subscriptionData = {
      userId: userId, // Use authenticated user's UUID
      serviceProfileId: body.serviceProfileId,
      preferredTimeWindow: body.preferredTimeWindow,
      startDate: body.startDate,
      location: body.location,
      monthlyPriceSnapshot: body.monthlyPriceSnapshot,
    };

    const subscription =
      await this.paymentsService.createSubscriptionAfterPayment(
        subscriptionData,
        body.razorpayOrderId,
        body.razorpayPaymentId,
      );
    return { status: 'success', subscription };
  }
}
