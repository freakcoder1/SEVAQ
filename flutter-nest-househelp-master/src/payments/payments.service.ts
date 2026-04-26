import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { BookingsService } from '../bookings/bookings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
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
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    private configService: ConfigService,
    private bookingsService: BookingsService,
    private subscriptionsService: SubscriptionsService,
    private notificationsService: NotificationsService,
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

  private serializeBooking(booking: any): any {
    if (!booking) return null;
    
    const serialized: any = {
      id: booking.id,
      publicId: booking.publicId,
      userId: booking.userId,
      workerId: booking.workerId,
      serviceId: booking.serviceId,
      serviceRequestId: booking.serviceRequestId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount ? booking.totalAmount / 100 : 0,
      amount: booking.totalAmount ? booking.totalAmount / 100 : 0,
      status: booking.status,
      isPaid: booking.isPaid,
      type: booking.type,
      notes: booking.notes,
      location: booking.location,
      metadata: booking.metadata,
    };
    
    // Include worker with user if available
    if (booking.worker) {
      serialized.worker = {
        id: booking.worker.id,
        publicId: booking.worker.publicId,
        rating: booking.worker.rating,
        reviewCount: booking.worker.reviewCount,
        bio: booking.worker.bio,
      };
      if (booking.worker.user) {
        serialized.worker.user = {
          id: booking.worker.user.id,
          publicId: booking.worker.user.publicId,
          firstName: booking.worker.user.firstName,
          lastName: booking.worker.user.lastName,
          email: booking.worker.user.email,
        };
      }
    }
    
    // Include service if available
    if (booking.service) {
      serialized.service = {
        id: booking.service.id,
        publicId: booking.service.publicId,
        name: booking.service.name,
        description: booking.service.description,
        basePrice: booking.service.basePrice,
        category: booking.service.category,
      };
    }
    
    // Include user if available
    if (booking.user) {
      serialized.user = {
        id: booking.user.id,
        publicId: booking.user.publicId,
        firstName: booking.user.firstName,
        lastName: booking.user.lastName,
        email: booking.user.email,
        phone: booking.user.phone,
        address: booking.user.address,
      };
    }
    
    return serialized;
  }

  async createOrder(amount: number, currency: string = 'INR') {
    // Amount is already in paise from frontend, don't multiply again
    const options = {
      amount: amount, // Razorpay expects amount in paise
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
  ): Promise<boolean> {
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

  /**
   * Atomically verify payment and create booking in a single transaction.
   * Ensures that if booking creation fails, no partial state is left behind,
   * and if verification fails, no booking is created.
   */
  async verifyAndCreateBooking(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
    bookingData: any,
  ): Promise<any> {
    // Step 1: Verify payment signature (stateless, no DB)
    const isValid = await this.verifyPayment(
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    );

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Step 2: Create booking + payment record atomically in a transaction
    return this.createBookingAfterPayment(
      bookingData,
      razorpayOrderId,
      razorpayPaymentId,
    );
  }

  /**
   * Atomically verify payment and create subscription in a single transaction.
   * Ensures that if subscription creation fails, no partial state is left behind.
   */
  async verifyAndCreateSubscription(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
    subscriptionData: any,
  ): Promise<any> {
    // Step 1: Verify payment signature (stateless, no DB)
    const isValid = await this.verifyPayment(
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    );

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Step 2: Create subscription + payment record atomically in a transaction
    return this.createSubscriptionAfterPayment(
      subscriptionData,
      razorpayOrderId,
      razorpayPaymentId,
    );
  }

  private convertToTimeString(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private convertToDateString(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
          status: 'confirmed',
        });

        // ✅ PERMANENT FIX: Reload booking from database AFTER save to verify persistence
        // Never trust in-memory objects - always verify what was actually written
        const bookingRepo = queryRunner.manager.getRepository('Booking');
        booking = await bookingRepo.findOne({
          where: { id: booking.id },
          select: ['id', 'publicId', 'userId', 'workerId', 'serviceId', 'serviceRequestId', 'date', 'startTime', 'endTime', 'totalAmount', 'amount', 'status', 'isPaid', 'type', 'notes', 'location', 'guestFcmToken'],
          relations: ['worker', 'worker.user', 'service', 'user'],
        });

        // ✅ Validate persistence actually succeeded
        if (!booking) {
          throw new Error(`Booking ${bookingData.id} vanished after update - persistence failure`);
        }

        if (!booking.isPaid) {
          throw new Error(`Booking ${booking.id} was not marked as paid in database - critical persistence failure`);
        }

        if (booking.status !== 'confirmed') {
          throw new Error(`Booking ${booking.id} status was not updated to confirmed - persistence failure`);
        }

        this.logger.log(`✅ Verified booking ${booking.id} persisted correctly: isPaid=${booking.isPaid}, status=${booking.status}`);
      } else {
        // Create new booking within transaction
        const validBookingData: any = {};

        if (bookingData.assignmentId || bookingData.serviceRequestId) {
          validBookingData.serviceRequestId =
            bookingData.assignmentId || bookingData.serviceRequestId;
          
          // Fetch the service request to get the correct date
          const srId = bookingData.assignmentId || bookingData.serviceRequestId;
          this.logger.debug(`Looking for service request with ID: ${srId}, Type: ${typeof srId}`);
          
          // Handle both UUID (publicId) and numeric ID
          let serviceRequest;
          if (String(srId).includes('-')) {
            // It's a UUID (publicId)
            serviceRequest = await this.dataSource.query(
              'SELECT id, date FROM service_request WHERE publicId = $1 LIMIT 1',
              [srId]
            );
            this.logger.debug('Querying by publicId');
          } else {
            // It's a numeric ID
            serviceRequest = await this.dataSource.query(
              'SELECT id, date FROM service_request WHERE id = $1 LIMIT 1',
              [parseInt(srId)]
            );
            this.logger.debug('Querying by numeric ID');
          }
          this.logger.debug(`Service request query result: ${serviceRequest}`);
          if (serviceRequest && serviceRequest.length > 0 && serviceRequest[0].date) {
            validBookingData.date = this.convertToDateString(serviceRequest[0].date);
            this.logger.debug(`Got date from service request: ${validBookingData.date}`);
            // Also get serviceId from service request if not already set
            if (serviceRequest[0].serviceId && !validBookingData.serviceId) {
              validBookingData.serviceId = serviceRequest[0].serviceId;
              this.logger.debug(`Got serviceId from service request: ${validBookingData.serviceId}`);
            }
          } else {
            // FIX: Throw error if service request doesn't have a date
            // This ensures the bug is caught rather than silently defaulting to today
            const errorMsg = `Service request ${srId} does not have a valid date. Cannot create booking.`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
          }
        } else {
          // Handle userId - ensure it's the User's publicId (UUID) for the booking.userId column
          if (bookingData.userId) {
            const userIdStr = String(bookingData.userId);
            if (userIdStr.includes('-')) {
              // Input is already a UUID (publicId), validate user exists
              const user = await this.usersRepository.findOne({
                where: { publicId: userIdStr },
              });
              if (user) {
                validBookingData.userId = userIdStr; // Use the UUID directly
              } else {
                this.logger.warn(`User not found for publicId: ${userIdStr}`);
                throw new Error(`User with publicId ${userIdStr} not found`);
              }
            } else {
              // Input is integer user ID, lookup user to get publicId
              const userIdInt = parseInt(userIdStr);
              const user = await this.usersRepository.findOne({
                where: { id: userIdInt },
              });
              if (user) {
                validBookingData.userId = user.publicId; // Use the UUID publicId
              } else {
                this.logger.warn(`User not found for id: ${userIdInt}`);
                throw new Error(`User with id ${userIdInt} not found`);
              }
            }
          }
          // Handle workerId (supports both 'worker' and 'workerId' keys from frontend)
          const workerIdValue = bookingData.worker || bookingData.workerId;
          if (workerIdValue) {
            const workerIdStr = String(workerIdValue);
            if (workerIdStr.includes('-')) {
              // UUID (publicId) → lookup internal integer ID
              const worker = await this.workersRepository.findOne({
                where: { publicId: workerIdStr },
              });
              if (worker) {
                validBookingData.workerId = worker.id;
              } else {
                this.logger.warn(`Worker not found for publicId: ${workerIdStr}`);
              }
            } else {
              validBookingData.workerId = parseInt(workerIdStr);
            }
          }

          // Handle serviceId (supports both 'service' and 'serviceId' keys from frontend)
          const serviceIdValue = bookingData.service || bookingData.serviceId;
          if (serviceIdValue) {
            const serviceIdStr = String(serviceIdValue);
            if (serviceIdStr.includes('-')) {
              // UUID (publicId) → lookup internal integer ID
              const service = await this.servicesRepository.findOne({
                where: { publicId: serviceIdStr },
              });
              if (service) {
                validBookingData.serviceId = service.id;
              } else {
                this.logger.warn(`Service not found for publicId: ${serviceIdStr}`);
              }
            } else {
              validBookingData.serviceId = parseInt(serviceIdStr);
            }
          }
          if (bookingData.startTime)
            validBookingData.startTime = this.convertToTimeString(bookingData.startTime);
          if (bookingData.endTime)
            validBookingData.endTime = this.convertToTimeString(bookingData.endTime);
          if (bookingData.date) {
            validBookingData.date = this.convertToDateString(bookingData.date);
          } else if (bookingData.startTime) {
            // Extract date from startTime datetime string
            validBookingData.date = this.convertToDateString(bookingData.startTime);
          }
          // Handle amount - FIX: The amount from payment verification is in paise, convert to rupees
          // bookingData.amount comes from Razorpay which uses paise (1200 rupees = 120000 paise)
          if (bookingData.amount !== undefined) {
            const amountValue = Number(bookingData.amount) / 100; // Convert from paise to rupees
            this.logger.debug(`bookingData.amount = ${bookingData.amount} -> converted to ${amountValue}`);
            validBookingData.totalAmount = amountValue;
            validBookingData.amount = amountValue;
          }
          // Get date from startTime if available (extracted from service request)
          if (bookingData.startTime && !validBookingData.date) {
            validBookingData.date = this.convertToDateString(bookingData.startTime);
          }
          if (bookingData.notes) validBookingData.notes = bookingData.notes;
          if (bookingData.type) validBookingData.type = bookingData.type;
          if (bookingData.metadata)
            validBookingData.metadata = bookingData.metadata;
          if (bookingData.location)
            validBookingData.location = bookingData.location;
          // Save FCM token to booking for notification delivery
          if (bookingData.fcmToken) {
            validBookingData.guestFcmToken = bookingData.fcmToken;
            this.logger.log(`Saved FCM token to booking data for notification delivery`);
          }
        }
        
        // Create booking using queryRunner for transaction
        const bookingRepo = queryRunner.manager.getRepository('Booking');
        const newBooking = bookingRepo.create({
          ...validBookingData,
          isPaid: true,
          status: 'confirmed',
        });
        booking = await bookingRepo.save(newBooking);

        // Fetch the booking with related data for the response
        booking = await bookingRepo.findOne({
          where: { id: booking.id },
          select: ['id', 'publicId', 'userId', 'workerId', 'serviceId', 'serviceRequestId', 'date', 'startTime', 'endTime', 'totalAmount', 'amount', 'status', 'isPaid', 'type', 'notes', 'location', 'guestFcmToken'],
          relations: ['worker', 'worker.user', 'service', 'user'],
        });
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

      // Send notification to assigned worker now that payment is complete
      if (booking.workerId || booking.assignedWorkerId) {
        const workerId = booking.workerId || booking.assignedWorkerId;
        this.logger.log(`Payment complete for booking ${booking.id}, notifying worker ${workerId}`);
        
        // Import Worker entity for type
        const { Worker } = require('../workers/entities/worker.entity');
        
        // Create a minimal worker object with just the ID and FCM token
        const worker = await this.dataSource.getRepository('Worker').findOne({
          where: { id: workerId },
          relations: ['user'],
        });
        
        if (worker) {
          const serviceName = booking.service?.name || 'Service';
          const bookingDate = booking.date || new Date().toISOString().split('T')[0];
          
          try {
              await this.notificationsService.sendFullScreenPushNotification(
                worker.fcmToken,
                'नई बुकिंग मिली! 🎉',
                `${serviceName} - ${bookingDate} को। ग्राहक का पता और विवरण देखने के लिए ऐप खोलें।`,
                {
                  type: 'new_booking',
                  bookingId: booking.id.toString(),
                  serviceName,
                  serviceDate: bookingDate,
                  startTime: booking.startTime ?? '',
                  assignmentType: booking.type || 'on_demand',
                  timestamp: new Date().toISOString(),
                },
              );
              this.logger.log(`Sent full-screen payment-confirmed notification to worker ${workerId} for booking ${booking.id}`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error sending notification to worker ${workerId}: ${errorMsg}`);
          }
        }
      }

      // ✅ Send confirmation notification to CUSTOMER now that payment is complete
      // THIS WAS MISSING - THIS IS WHY CUSTOMERS NEVER RECEIVED NOTIFICATIONS
      
      let notificationFcmToken: string | null = null;
      let notificationSource: string = 'none';
      
      // First check for authenticated user FCM token
      if (booking.userId) {
        this.logger.log(`Payment complete for booking ${booking.id}, checking customer ${booking.userId}`);
        
          try {
            // Load user with fcm token (booking.userId is User.publicId UUID)
            const user = await this.usersRepository.findOne({
              where: { publicId: booking.userId }
            });
          
          if (user && user.fcmToken) {
            notificationFcmToken = user.fcmToken;
            notificationSource = 'authenticated_user';
            this.logger.debug(`Using authenticated user FCM token for booking ${booking.id}`);
          } else if (user && !user.fcmToken && booking.guestFcmToken) {
            // ✅ AUTO-MIGRATION: Save guest token to user profile permanently
            this.logger.log(`🔄 Auto-migrating guest FCM token to user ${booking.userId}`);
            // Direct update via repository (no UsersService dependency required)
            // Update by publicId since booking.userId is User.publicId (UUID)
            await this.usersRepository.update({ publicId: booking.userId }, {
              fcmToken: booking.guestFcmToken.trim(),
              updatedAt: new Date()
            });
            notificationFcmToken = booking.guestFcmToken;
            notificationSource = 'auto_migrated_guest_token';
            this.logger.log(`✅ Successfully migrated FCM token for user ${booking.userId}`);
          } else {
            this.logger.debug(`User ${booking.userId} has no FCM token, checking booking guest token`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error loading user ${booking.userId}: ${errorMsg}`);
        }
      }
      
      // ✅ FALLBACK: Check for guest FCM token attached directly to booking
      if (!notificationFcmToken && booking.guestFcmToken) {
        notificationFcmToken = booking.guestFcmToken;
        notificationSource = 'guest_booking_token';
        this.logger.debug(`Using GUEST FCM token attached to booking ${booking.id}`);
      }
      
      // Send notification if we have any valid token
      if (notificationFcmToken) {
        const serviceName = booking.service?.name || 'Service';
        const bookingDate = booking.date || new Date().toISOString().split('T')[0];
        
        try {
          await this.notificationsService.sendPushNotification(
            notificationFcmToken,
            'Booking Confirmed ✅',
            `Your ${serviceName} booking for ${bookingDate} has been confirmed successfully. We have assigned a worker for your service.`,
            {
              type: 'booking_confirmed',
              bookingId: booking.id.toString(),
              serviceName,
              serviceDate: bookingDate,
              startTime: booking.startTime ?? '',
              timestamp: new Date().toISOString(),
            },
          );
          
          this.logger.log(`✅ Sent booking confirmation notification to customer for booking ${booking.id} (source: ${notificationSource})`);
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`❌ Error sending notification for booking ${booking.id}: ${errorMsg}`);
          this.logger.debug(`Full error: ${error}`);
        }
      } else {
        this.logger.warn(`⚠️ NO FCM TOKEN FOUND for booking ${booking.id} - cannot send customer confirmation`);
        this.logger.debug(`userId = ${booking.userId}, guestFcmToken exists = ${!!booking.guestFcmToken}`);
      }

      // Serialize the booking to ensure relations are included in response
      return this.serializeBooking(booking);
    } catch (error: any) {
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
        // Import SubscriptionStatus from subscriptions module
        const { SubscriptionStatus } = await import('../subscriptions/entities/subscription.entity');
        
        // ✅ CORRECT FIX: Subscriptions table expects UUID (publicId) for userId column
        // Subscription entity joins User on publicId, not internal integer id
        // subscriptionData.userId is already the correct UUID publicId, use it directly
        
        // 🔍 DEBUG LOG
        this.logger.log('🔍 subscriptionData payload:', JSON.stringify(subscriptionData, null, 2));
        
        // Extract service profile id - ONLY from fields that actually represent serviceProfileId
        // NOTE: Do NOT use subscriptionData.id as fallback - that field is for updating existing subscriptions
        let serviceProfileId = subscriptionData.serviceProfileId
          ?? subscriptionData.profileId;
        
        // If serviceProfileId is null, check if customPlanData is provided
        if (serviceProfileId == null) {
          if (subscriptionData.customPlanData) {
            // Use customPlanData as primary source - no need to look up ServiceProfile
            this.logger.log(`🔍 Using customPlanData for subscription creation (no serviceProfileId provided)`);
            // serviceProfileId remains null, which is now allowed
          } else {
            // Neither serviceProfileId nor customPlanData provided - throw error
            throw new Error('Cannot create subscription: Neither serviceProfileId nor customPlanData provided');
          }
        }
        
        this.logger.log(`🔍 Final selected serviceProfileId: ${serviceProfileId}`);

        // ✅ FIX: For custom plans, ALWAYS create a NEW subscription (don't reuse existing ones)
        // A user can have MULTIPLE active subscriptions for DIFFERENT service types
        let existingSubscription = null;
        
        if (subscriptionData.customPlanData) {
          // For custom plans, NEVER reuse existing subscriptions
          // User might want multiple different custom services
          this.logger.log(`🔍 Custom plan detected - always creating NEW subscription (not reusing existing)`);
        } else if (serviceProfileId) {
          // For serviceProfileId subscriptions, only reuse if SAME serviceProfileId
          this.logger.log(`🔍 Checking for existing active subscription for user ${subscriptionData.userId} with serviceProfileId ${serviceProfileId}`);
          
          existingSubscription = await subscriptionRepo.findOne({
            select: ['id'],
            where: {
              userId: subscriptionData.userId,
              serviceProfileId: serviceProfileId,
              status: SubscriptionStatus.ACTIVE
            }
          });
        }

        if (existingSubscription) {
          this.logger.log(`✅ Found existing active subscription id=${existingSubscription.id} for same serviceProfileId, reusing instead of creating new one`);
          // Existing active subscription is already paid - no need to update
          subscription = existingSubscription;
        } else {
          this.logger.log(`🔄 No existing active subscription found (or custom plan), creating new subscription`);
          try {
            const newSubscription = subscriptionRepo.create({
              publicId: uuidv4(), // Generate unique publicId
              userId: subscriptionData.userId, // ✅ Using UUID publicId directly as expected by schema
              serviceProfileId: serviceProfileId,
              preferredTimeWindow: subscriptionData.preferredTimeWindow,
              startDate: new Date(subscriptionData.startDate),
              location: subscriptionData.location,
              monthlyPriceSnapshot: subscriptionData.monthlyPriceSnapshot ?? 0, // Default to 0 if null
              status: SubscriptionStatus.ACTIVE,
              isPaid: true,
              customPlanData: subscriptionData.customPlanData || null, // ✅ Save custom plan data
            });
            subscription = await subscriptionRepo.save(newSubscription);
          } catch (error: any) {
            // Handle duplicate key violation (race condition)
            if (error.code === '23505') { // PostgreSQL unique violation error code
              this.logger.warn(`Duplicate key error caught for user ${subscriptionData.userId} and serviceProfileId ${serviceProfileId}. Fetching existing subscription.`);
               
              // Query for the existing active subscription and return it
              const existingSubscription = await subscriptionRepo.findOne({
                select: ['id'],
                where: {
                  userId: subscriptionData.userId,
                  serviceProfileId: serviceProfileId,
                  status: SubscriptionStatus.ACTIVE
                }
              });
               
              if (existingSubscription) {
                this.logger.log(`✅ Found existing active subscription id=${existingSubscription.id} after duplicate key error, returning it`);
                subscription = existingSubscription;
              } else {
                // If we somehow still don't find it, re-throw the original error
                this.logger.error(`Duplicate key error but no existing subscription found for user ${subscriptionData.userId} and serviceProfileId ${serviceProfileId}`);
                throw error;
              }
            } else {
              // Re-throw non-duplicate key errors
              throw error;
            }
          }
        }
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
        // ✅ FINAL FIX: Only run assignment logic for NEW subscriptions
        // When reusing existing subscription subscriptionData will be incomplete
        if (subscriptionData && subscriptionData.startDate) {
          const assignmentQueryRunner = this.dataSource.createQueryRunner();
          await assignmentQueryRunner.connect();
          
          // Find the first booking for this subscription
          // ✅ CORRECT: subscription.userId is UUID publicId, booking.userId is INTEGER internal ID
          // We need to look up user internal ID from subscription's userId which is public UUID
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
                userId: user.publicId,  // ✅ FIX: Use UUID publicId (booking.userId is UUID, not integer)
                date: startDate,
              },
              order: { id: 'ASC' },
            });
          
            await assignmentQueryRunner.release();
          
            if (firstBooking && firstBooking.id) {
              this.logger.log(
                `Found first booking for subscription ${subscription.id}, booking ${firstBooking.id} - worker assignment will be handled by scheduler`,
              );
            } else {
              this.logger.warn(
                `No upcoming bookings found for subscription ${subscription.id}. Generating new weekly bookings...`,
              );
              // Generate new bookings for the subscription to ensure there are upcoming appointments
              try {
                await this.subscriptionsService.generateBookingsForSubscription(
                  subscription.id,
                  startDate,
                );
                this.logger.log(
                  `✅ Successfully generated new bookings for subscription ${subscription.id}`,
                );
              } catch (genError: any) {
                this.logger.error(
                  `Failed to generate bookings for subscription ${subscription.id}: ${genError.message}`,
                  genError.stack,
                );
                // Don't throw - payment already succeeded, but log prominently
              }
            }
          }
        }
      } catch (assignmentError: any) {
        this.logger.error(
          `Failed to trigger immediate assignment for subscription ${subscription.id}: ${assignmentError.message}`,
          assignmentError.stack,
        );
        // Don't throw - subscription creation already succeeded
      }

      return subscription;
    } catch (error: any) {
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
