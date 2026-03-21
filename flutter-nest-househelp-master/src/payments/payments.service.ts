import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { BookingsService } from '../bookings/bookings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AssignmentsService } from '../assignments/assignments.service';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private razorpay: any;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private configService: ConfigService,
    private bookingsService: BookingsService,
    private subscriptionsService: SubscriptionsService,
    private assignmentsService: AssignmentsService,
    private dataSource: DataSource,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.error('Razorpay credentials not configured');
      throw new Error('Payment gateway not properly configured');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(amount: number, currency: string = 'INR') {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: 'receipt_' + Date.now(),
    };

    const order = await this.razorpay.orders.create(options);
    return order;
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new Error('Payment verification configuration error');
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    return generated_signature === signature;
  }

  async createBookingAfterPayment(
    bookingData: any,
    razorpayOrderId: string,
    razorpayPaymentId: string,
  ) {
    this.logger.log(
      `Creating booking after payment for order: ${razorpayOrderId}`,
    );

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let booking: any;

      // If bookingId is provided, update existing booking
      if (bookingData.id) {
        booking = await this.bookingsService.findOne(bookingData.id);
        if (!booking) {
          throw new Error(`Booking with id ${bookingData.id} not found`);
        }

        // Update booking with payment info
        await queryRunner.manager.update('Booking', booking.id, {
          isPaid: true,
        });
      } else {
        // Create new booking within transaction
        const validBookingData: any = {};

        if (bookingData.assignmentId || bookingData.serviceRequestId) {
          validBookingData.serviceRequestId =
            bookingData.assignmentId || bookingData.serviceRequestId;
        } else {
          if (bookingData.userId) validBookingData.userId = bookingData.userId;
          if (bookingData.worker)
            validBookingData.workerId = bookingData.worker;
          if (bookingData.service)
            validBookingData.serviceId = bookingData.service;
          if (bookingData.startTime)
            validBookingData.startTime = bookingData.startTime;
          if (bookingData.endTime)
            validBookingData.endTime = bookingData.endTime;
          if (bookingData.date) validBookingData.date = bookingData.date;
          if (bookingData.notes) validBookingData.notes = bookingData.notes;
          if (bookingData.type) validBookingData.type = bookingData.type;
          if (bookingData.metadata)
            validBookingData.metadata = bookingData.metadata;
          if (bookingData.location)
            validBookingData.location = bookingData.location;
        }

        // Create booking using queryRunner for transaction
        const bookingRepo = queryRunner.manager.getRepository('Booking');
        const newBooking = bookingRepo.create({
          ...validBookingData,
          isPaid: true,
          status: 'confirmed',
        });
        booking = await bookingRepo.save(newBooking);
      }

      // Save payment record within transaction
      const paymentRepo = queryRunner.manager.getRepository(Payment);
      const payment = paymentRepo.create({
        publicId: uuidv4(),
        transactionId: razorpayPaymentId,
        orderId: razorpayOrderId,
        amount: bookingData.amount ? bookingData.amount / 100 : 0,
        paymentMethod: 'RAZORPAY',
        status: PaymentStatus.COMPLETED,
        booking: { id: booking.id },
        paidAt: new Date(),
      });
      await paymentRepo.save(payment);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        `Payment and booking transaction completed successfully for booking: ${booking.id}`,
      );
      return booking;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Payment transaction failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`Payment processing failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async createSubscriptionAfterPayment(
    subscriptionData: any,
    razorpayOrderId: string,
    razorpayPaymentId: string,
  ) {
    this.logger.log(
      `Creating subscription after payment for order: ${razorpayOrderId}`,
    );

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let subscription: any;

      // If subscriptionId is provided, update existing subscription
      if (subscriptionData.id) {
        subscription = await this.subscriptionsService.getSubscriptionById(
          subscriptionData.id,
        );
        if (!subscription) {
          throw new Error(
            `Subscription with id ${subscriptionData.id} not found`,
          );
        }

        // Update subscription status
        await queryRunner.manager.update('Subscription', subscription.id, {
          status: 'active',
          isPaid: true,
        });
      } else {
        // Create new subscription within transaction
        const subscriptionRepo =
          queryRunner.manager.getRepository('Subscription');
        const newSubscription = subscriptionRepo.create({
          publicId: uuidv4(), // Generate unique publicId
          userId: subscriptionData.userId,
          serviceProfileId: subscriptionData.serviceProfileId,
          preferredTimeWindow: subscriptionData.preferredTimeWindow,
          startDate: new Date(subscriptionData.startDate),
          location: subscriptionData.location,
          monthlyPriceSnapshot: subscriptionData.monthlyPriceSnapshot ?? 0, // Default to 0 if null
          status: 'active',
          isPaid: true,
        });
        subscription = await subscriptionRepo.save(newSubscription);
      }

      // Save payment record within transaction
      const paymentRepo = queryRunner.manager.getRepository(Payment);
      const payment = paymentRepo.create({
        publicId: uuidv4(),
        transactionId: razorpayPaymentId,
        orderId: razorpayOrderId,
        amount: subscriptionData.amount ? subscriptionData.amount / 100 : 0,
        paymentMethod: 'RAZORPAY',
        status: PaymentStatus.COMPLETED,
        subscription: { id: subscription.id },
        paidAt: new Date(),
      });
      await paymentRepo.save(payment);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        `Payment and subscription transaction completed successfully for subscription: ${subscription.id}`,
      );

      // Immediately trigger worker assignment for the first booking
      // Use a new queryRunner since the transaction is committed
      try {
        const assignmentQueryRunner = this.dataSource.createQueryRunner();
        await assignmentQueryRunner.connect();
        
        // Find the first booking for this subscription
        // CRITICAL FIX: subscription.userId is UUID, but booking.userId is INTEGER
        // We must look up the user's internal ID from their public UUID
        const userRepo = assignmentQueryRunner.manager.getRepository('user');
        const user = await userRepo.findOne({
          where: { publicId: subscription.userId },
        });
        
        if (!user) {
          this.logger.warn(`User not found for publicId: ${subscription.userId} - cannot assign worker`);
          await assignmentQueryRunner.release();
        } else {
          const bookingsRepo = assignmentQueryRunner.manager.getRepository('booking');
          const startDate = new Date(subscriptionData.startDate);
          const firstBooking = await bookingsRepo.findOne({
            where: { 
              userId: user.id,  // ✅ Using INTEGER internal ID
              date: startDate,
            },
            order: { id: 'ASC' },
          });
          
          await assignmentQueryRunner.release();
          
          if (firstBooking && firstBooking.id) {
            this.logger.log(
              `Triggering immediate assignment for subscription ${subscription.id}, booking ${firstBooking.id}`,
            );
            const result = await this.assignmentsService.createPrimaryAssignment(firstBooking.id);
            this.logger.log(
              `Immediate assignment completed for subscription ${subscription.id}: success=${result?.success}, workerId=${result?.worker?.id || 'none'}`,
            );
          } else {
            this.logger.warn(
              `No booking found for subscription ${subscription.id} for immediate assignment`,
            );
          }
        }
      } catch (assignmentError) {
        this.logger.error(
          `Failed to trigger immediate assignment for subscription ${subscription.id}: ${assignmentError.message}`,
          assignmentError.stack,
        );
        // Don't throw - subscription creation already succeeded
      }

      return subscription;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Subscription payment transaction failed: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Subscription payment processing failed: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
