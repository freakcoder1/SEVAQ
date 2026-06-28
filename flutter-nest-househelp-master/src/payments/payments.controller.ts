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
    // Calculate the amount based on service profile
    const serviceProfile = await this.serviceProfilesService.getProfileById(
      body.serviceProfileId,
    );
    if (!serviceProfile) {
      throw new BadRequestException('Service profile not found');
    }

    // Store the original price in rupees for the subscription snapshot
    const monthlyPriceInRupees = Number(serviceProfile.monthlyPrice);
    
    // Check if test mode is enabled (skip Razorpay for testing)
    const testMode = process.env.RAZORPAY_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';
    let order: any;
    if (testMode) {
      // Generate mock order for testing
      order = {
        id: 'test_order_' + Date.now(),
        entity: 'order',
        amount: monthlyPriceInRupees * 100,
        currency: 'INR',
        status: 'created',
        created_at: Date.now(),
      };
    } else {
      // Convert rupees to paise for Razorpay (Razorpay expects amount in paise)
      const amountInPaise = monthlyPriceInRupees * 100;
      order = await this.paymentsService.createOrder(amountInPaise, 'INR');
    }

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
    @Req() req: Request,
  ) {
    const testMode = process.env.RAZORPAY_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';
    
    // Check if it's a booking payment or subscription payment
    if (body.bookingData) {
      // Inject authenticated user's UUID into bookingData for test mode
      const bookingData = {
        ...body.bookingData,
        userId: body.bookingData.userId || (req.user as any).userId, // Use JWT user if not provided
      };
      
      if (testMode) {
        // In test mode, skip payment verification and directly create booking
        const booking = await this.paymentsService.createBookingAfterPayment(
          bookingData,
          body.razorpayOrderId || 'test_order',
          body.razorpayPaymentId || 'test_payment',
        );
        return { status: 'success', booking };
      }
      // Atomically verify payment + create booking in a single flow
      const booking = await this.paymentsService.verifyAndCreateBooking(
        body.razorpayOrderId,
        body.razorpayPaymentId,
        body.signature,
        bookingData,
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
      // Resolve serviceProfileId - handle both numeric and UUID formats
      let resolvedServiceProfileId: number | string;
      const spId = body.subscriptionData.serviceProfileId;
      if (spId && String(spId).includes('-')) {
        const profile = await this.serviceProfilesService.getProfileByPublicId(spId);
        if (!profile) {
          throw new BadRequestException('Service profile not found');
        }
        resolvedServiceProfileId = profile.id;
      } else {
        resolvedServiceProfileId = spId;
      }

      // Update subscriptionData with resolved numeric ID
      const subscriptionData = {
        ...body.subscriptionData,
        serviceProfileId: resolvedServiceProfileId,
      };

      if (testMode) {
        // In test mode, skip payment verification and directly create subscription
        const subscription = await this.paymentsService.createSubscriptionAfterPayment(
          subscriptionData,
          body.razorpayOrderId || 'test_order',
          body.razorpayPaymentId || 'test_payment',
        );
        return { status: 'success', subscription };
      }
      // Atomically verify payment + create subscription in a single flow
      const subscription =
        await this.paymentsService.verifyAndCreateSubscription(
          body.razorpayOrderId,
          body.razorpayPaymentId,
          body.signature,
          subscriptionData,
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
    const testMode = process.env.RAZORPAY_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';

    // Resolve serviceProfileId - handle both numeric and UUID formats
    let resolvedServiceProfileId: number;
    const serviceProfileIdInput = body.serviceProfileId;
    if (String(serviceProfileIdInput).includes('-')) {
      // It's a UUID publicId - look up the numeric ID
      const profile = await this.serviceProfilesService.getProfileByPublicId(serviceProfileIdInput);
      if (!profile) {
        throw new BadRequestException('Service profile not found');
      }
      resolvedServiceProfileId = profile.id;
    } else {
      resolvedServiceProfileId = Number(serviceProfileIdInput);
    }

    // Get subscription data - use authenticated userId from JWT
    const subscriptionData = {
      userId: userId, // Use authenticated user's UUID
      serviceProfileId: resolvedServiceProfileId, // Now numeric
      preferredTimeWindow: body.preferredTimeWindow,
      startDate: body.startDate,
      location: body.location,
      monthlyPriceSnapshot: body.monthlyPriceSnapshot,
    };

    // In test mode, skip payment verification and directly create subscription
    if (testMode) {
      const subscription = await this.paymentsService.createSubscriptionAfterPayment(
        subscriptionData,
        body.razorpayOrderId || 'test_order',
        body.razorpayPaymentId || 'test_payment',
      );
      return { status: 'success', subscription };
    }

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
