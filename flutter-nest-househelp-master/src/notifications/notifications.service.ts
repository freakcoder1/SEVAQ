import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, WhereExpressionBuilder } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { Worker } from '../workers/entities/worker.entity';
import * as admin from 'firebase-admin';
import { FcmHttpService } from './fcm-http.service';

/**
 * Firebase initialization status interface for diagnostics
 */
export interface FirebaseStatus {
  initialized: boolean;
  projectId: string | null;
  credentialType: 'service_account' | 'individual' | 'none';
  lastError: string | null;
  lastAttemptAt: string | null;
  credentialValidation: {
    hasServiceAccountJson: boolean;
    hasProjectId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
    serviceAccountValid: boolean;
    privateKeyFormatValid: boolean;
  };
}

@Injectable()
export class NotificationsService {
  private firebaseInitialized: boolean = false;
  private firebaseStatus: FirebaseStatus = {
    initialized: false,
    projectId: null,
    credentialType: 'none',
    lastError: null,
    lastAttemptAt: null,
    credentialValidation: {
      hasServiceAccountJson: false,
      hasProjectId: false,
      hasClientEmail: false,
      hasPrivateKey: false,
      serviceAccountValid: false,
      privateKeyFormatValid: false,
    },
  };

  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private configService: ConfigService,
    private fcmHttpService: FcmHttpService,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
  ) {
    // Configure Firebase Admin SDK (optional - only if credentials are provided)
    this.initializeFirebase();
  }

  /**
   * Validate Firebase credentials before attempting initialization
   * Returns validation result and detailed status
   */
  private validateFirebaseCredentials(): {
    valid: boolean;
    errors: string[];
    validation: FirebaseStatus['credentialValidation'];
  } {
    const serviceAccountJson = this.configService.get('FIREBASE_SERVICE_ACCOUNT');
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');

    const validation: FirebaseStatus['credentialValidation'] = {
      hasServiceAccountJson: !!serviceAccountJson,
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      serviceAccountValid: false,
      privateKeyFormatValid: false,
    };

    const errors: string[] = [];

    // Validate service account JSON if present
    if (serviceAccountJson) {
      if (serviceAccountJson.includes('service_account')) {
        try {
          const parsed = JSON.parse(serviceAccountJson);
           if (parsed.project_id && parsed.client_email && parsed.private_key) {
            validation.serviceAccountValid = true;
            this.logger.debug('Service account JSON is valid');
          } else {
            errors.push('Service account JSON missing required fields (project_id, client_email, private_key)');
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Service account JSON is invalid: ${msg}`);
        }
      } else {
        errors.push('Service account JSON does not contain "service_account" identifier');
      }
    }

    // Validate private key format if present
    if (privateKey) {
      const normalizedKey = privateKey.replace(/\\n/g, '\n');
      if (normalizedKey.includes('-----BEGIN RSA PRIVATE KEY-----') ||
          normalizedKey.includes('-----BEGIN PRIVATE KEY-----')) {
        validation.privateKeyFormatValid = true;
        this.logger.debug('Private key format is valid');
      } else {
        errors.push('Private key does not appear to be in PEM format (missing BEGIN PRIVATE KEY header)');
      }
    }

    // Check if we have at least one valid credential set
    const hasValidServiceAccount = validation.serviceAccountValid;
    const hasValidIndividualCredentials =
      validation.hasProjectId &&
      validation.hasClientEmail &&
      validation.privateKeyFormatValid &&
      projectId !== 'your-firebase-project-id';

    const valid = hasValidServiceAccount || hasValidIndividualCredentials;

    if (!valid && !errors.length) {
      errors.push('No valid Firebase credentials configured');
    }

    return { valid, errors, validation };
  }

  /**
   * Initialize Firebase Admin SDK with detailed logging and diagnostics
   */
  private initializeFirebase(): void {
    this.logger.log('='.repeat(60));
    this.logger.log('[Firebase Init] Starting Firebase Admin SDK initialization...');
    this.logger.log('='.repeat(60));

    // Record attempt timestamp
    this.firebaseStatus.lastAttemptAt = new Date().toISOString();

    // Step 1: Validate credentials
    this.logger.log('[Firebase Init] Step 1: Validating credentials...');
    const validationResult = this.validateFirebaseCredentials();
    this.firebaseStatus.credentialValidation = validationResult.validation;

    this.logger.log('[Firebase Init] Credential validation results:');
    this.logger.log(`  - Has Service Account JSON: ${validationResult.validation.hasServiceAccountJson}`);
    this.logger.log(`  - Service Account Valid: ${validationResult.validation.serviceAccountValid}`);
    this.logger.log(`  - Has Project ID: ${validationResult.validation.hasProjectId}`);
    this.logger.log(`  - Has Client Email: ${validationResult.validation.hasClientEmail}`);
    this.logger.log(`  - Has Private Key: ${validationResult.validation.hasPrivateKey}`);
    this.logger.log(`  - Private Key Format Valid: ${validationResult.validation.privateKeyFormatValid}`);

    if (validationResult.errors.length > 0) {
      this.logger.warn('[Firebase Init] Validation warnings:');
      validationResult.errors.forEach(err => this.logger.warn(`  - ${err}`));
    }

    // Step 2: Try service account JSON initialization
    const serviceAccountJson = this.configService.get('FIREBASE_SERVICE_ACCOUNT');
    
    if (validationResult.validation.serviceAccountValid) {
      this.logger.log('[Firebase Init] Step 2: Attempting initialization with service account JSON...');
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        this.logger.log(`[Firebase Init] Service account details:`);
        this.logger.log(`  - Project ID: ${serviceAccount.project_id}`);
        this.logger.log(`  - Client Email: ${serviceAccount.client_email}`);
        this.logger.log(`  - Token URI: ${serviceAccount.token_uri}`);

        // Proper private key sanitization for DER parsing
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key
            .replace(/\\\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
          
          // ✅ FIX: Add missing final newline character BEFORE the footer
          // This is the actual fix for "Unparsed DER bytes remain after ASN.1 parsing"
          const pemFooter = '-----END PRIVATE KEY-----';
          if (serviceAccount.private_key.includes(pemFooter)) {
            serviceAccount.private_key = serviceAccount.private_key.replace(pemFooter, '\n' + pemFooter + '\n');
          }

          // Ensure proper final newline after PEM footer
          if (!serviceAccount.private_key.endsWith('\n')) {
            serviceAccount.private_key += '\n';
          }
        }

        // Check if app already exists before initializing
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }

        this.firebaseInitialized = true;
        this.firebaseStatus.initialized = true;
        this.firebaseStatus.projectId = serviceAccount.project_id;
        this.firebaseStatus.credentialType = 'service_account';
        this.firebaseStatus.lastError = null;

        console.log('[Firebase Init] ✅ Firebase Admin SDK initialized successfully from service account');
        console.log(`[Firebase Init] Project: ${serviceAccount.project_id}`);
        console.log('='.repeat(60));
        return;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.firebaseStatus.lastError = `Service account init failed: ${errorMsg}`;
        console.warn(`[Firebase Init] ❌ Service account initialization failed: ${errorMsg}`);
      }
    }

    // Step 3: Fall back to individual credentials
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');

    if (
      projectId &&
      clientEmail &&
      privateKey &&
      projectId !== 'your-firebase-project-id'
    ) {
      console.log('[Firebase Init] Step 3: Attempting initialization with individual credentials...');
      try {
        // Proper private key sanitization for DER parsing
        let normalizedPrivateKey = privateKey
          .replace(/\\\\n/g, '\n')
          .replace(/\\n/g, '\n')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .trim();
        
        // ✅ FIX: Add missing final newline character BEFORE the footer
        // This is the actual fix for "Unparsed DER bytes remain after ASN.1 parsing"
        const pemFooter = '-----END PRIVATE KEY-----';
        if (normalizedPrivateKey.includes(pemFooter)) {
          normalizedPrivateKey = normalizedPrivateKey.replace(pemFooter, '\n' + pemFooter + '\n');
        }

        // Ensure proper final newline after PEM footer
        const finalPrivateKey = normalizedPrivateKey.endsWith('\n')
          ? normalizedPrivateKey
          : normalizedPrivateKey + '\n';
          
        console.log(`[Firebase Init] Using individual credentials for project: ${projectId}`);

        // Singleton guard: Only initialize if not already running
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: finalPrivateKey,
            }),
          });
        }

        this.firebaseInitialized = true;
        this.firebaseStatus.initialized = true;
        this.firebaseStatus.projectId = projectId;
        this.firebaseStatus.credentialType = 'individual';
        this.firebaseStatus.lastError = null;

        console.log('[Firebase Init] ✅ Firebase Admin SDK initialized successfully');
        console.log(`[Firebase Init] Project: ${projectId}`);
        console.log('='.repeat(60));
        return;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.firebaseStatus.lastError = `Individual credentials init failed: ${errorMsg}`;
        console.warn(`[Firebase Init] ❌ Individual credentials initialization failed: ${errorMsg}`);
      }
    }

    // Step 4: Initialization failed
    this.firebaseInitialized = false;
    this.firebaseStatus.initialized = false;
    this.firebaseStatus.credentialType = 'none';
    if (!this.firebaseStatus.lastError) {
      this.firebaseStatus.lastError = 'No valid credentials provided';
    }

    console.warn('[Firebase Init] ❌ Firebase Admin SDK initialization failed');
    console.warn(`[Firebase Init] Error: ${this.firebaseStatus.lastError}`);
    console.warn('[Firebase Init] Push notifications will be skipped');
    console.log('='.repeat(60));
  }

  /**
   * Get detailed Firebase initialization status for diagnostics
   */
  getFirebaseStatus(): FirebaseStatus {
    return { ...this.firebaseStatus };
  }



  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    dataPayload?: Record<string, string>,
  ): Promise<boolean> {
    try {
      // Check if FCM token is provided
      if (!fcmToken) {
        console.error('[NOTIFICATION FAILURE] No FCM token provided, cannot send push notification');
        return false;
      } else {
        console.log(`[NOTIFICATION] FCM token present (${fcmToken.substring(0, 20)}...), ready to send via direct HTTP API`);
      }

      // Use direct FCM HTTP API implementation (bypasses broken Firebase Admin SDK parser)
      const success = await this.fcmHttpService.sendNotification(fcmToken, title, body, {
        ...dataPayload,
        notification_title: title,
        notification_body: body,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        id: '1',
        status: 'done',
      });

      if (success) {
        console.log(`✅ Successfully sent push notification via direct FCM HTTP API`);
        return true;
      } else {
        console.error('❌ Failed to send push notification via direct FCM HTTP API');
        return false;
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send a full-screen push notification for critical alerts (worker booking notifications).
   * This sends BOTH data and android.notification blocks so that:
   * - android.notification: Shows system tray notification with full-screen intent (background/terminated)
   * - data: Flutter processes to show in-app dialog (foreground)
   * - Uses full_screen_booking_channel for full-screen alarm behavior
   */
  async sendFullScreenPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    dataPayload?: Record<string, string>,
  ): Promise<void> {
    try {
      // Check if FCM token is provided
      if (!fcmToken) {
        console.error('[NOTIFICATION FAILURE] No FCM token provided');
        return;
      } else {
        console.log(`[NOTIFICATION] FCM token present (${fcmToken.substring(0, 20)}...), ready to send full screen via direct HTTP API`);
      }

      // Use direct FCM HTTP API implementation (bypasses broken Firebase Admin SDK parser)
      const success = await this.fcmHttpService.sendNotification(fcmToken, title, body, {
        ...dataPayload,
        notification_title: title,
        notification_body: body,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        id: '1',
        status: 'done',
        fullScreen: 'true',
      });

      if (success) {
        console.log(`✅ Successfully sent full screen push notification via direct FCM HTTP API`);
      } else {
        console.error('❌ Failed to send full screen push notification via direct FCM HTTP API');
      }
    } catch (error) {
      console.error('Error sending full screen push notification:', error);
    }
  }

  /**
   * Send a data-only FCM notification that will be processed by the background handler
   * even when the app is in the background or terminated.
   * The notification title and body are included in the data payload.
   */
  async sendDataOnlyNotification(
    fcmToken: string,
    title: string,
    body: string,
    dataPayload?: Record<string, string>,
  ): Promise<void> {
    try {
      if (!this.firebaseInitialized) {
        console.error(
          '[NOTIFICATION FAILURE] Firebase Admin SDK NOT initialized - push notifications will NOT work!',
        );
        return;
      }

      if (!fcmToken) {
        console.error('[NOTIFICATION FAILURE] No FCM token provided');
        return;
      }

      // Data-only message - no notification block, so background handler will process it
      // even when the app is in the background or terminated.
      // The background handler shows a full-screen local notification.
      const message: admin.messaging.Message = {
        token: fcmToken,
        data: {
          ...dataPayload,
          // Include title and body in data payload for local notification display
          notification_title: title,
          notification_body: body,
        },
        android: {
          priority: 'high' as const,
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`Successfully sent data-only push notification: ${response}`);
    } catch (error) {
      console.error('Error sending data-only push notification:', error);
    }
  }

  async notifyWorkerNewBooking(worker: Worker, booking: Booking): Promise<void> {
    console.log(`[notifyWorkerNewBooking] Starting for worker ${worker.id}, booking ${booking.id}`);
    
    // Check if notification has already been sent to prevent duplicate notifications
    if (booking.notificationSent) {
      console.log(`[notifyWorkerNewBooking] Skipping notification for booking ${booking.id} - notification already sent`);
      return;
    }
    
    if (!worker.fcmToken) {
      console.error(`[NOTIFICATION FAILURE] No FCM token for worker ${worker.id} - worker needs to register their FCM token first!`);
      return;
    }

    console.log(`[notifyWorkerNewBooking] Worker has FCM token: ${worker.fcmToken.substring(0, 20)}...`);
    
    const serviceName = booking.service?.name || 'Service';
    const notificationTitle = 'नया काम मिला!';
    const notificationBody = `नया बुकिंग मिली है - ${serviceName}`;

    console.log(`[notifyWorkerNewBooking] Sending full-screen push notification: title="${notificationTitle}", body="${notificationBody}"`);
    
    // Send full-screen push notification with both notification and data blocks
    // This ensures the notification appears even when app is terminated
    // Uses full_screen_booking_channel which has fullScreenIntent enabled
    await this.sendFullScreenPushNotification(
      worker.fcmToken,
      notificationTitle,
      notificationBody,
      {
        type: 'new_booking',
        bookingId: booking.id.toString(),
        serviceName: booking.service?.name ?? 'Service',
        serviceDate: booking.date ?? new Date().toISOString().split('T')[0],
        startTime: booking.startTime ?? '',
        customerName: booking.user?.firstName ?? 'Customer',
        customerAddress: booking.location?.address ?? '',
        price: booking.amount?.toString() ?? '0',
        assignmentType: 'on_demand',
        fullScreen: 'true',  // Trigger full-screen notification
        timestamp: new Date().toISOString(),
      },
    );

    // Mark notification as sent to prevent duplicates
    booking.notificationSent = true;
    await this.bookingsRepository.save(booking);

    console.log(`[notifyWorkerNewBooking] Completed for worker ${worker.id} for booking ${booking.id}`);
  }

  // ============================================
  // NEW: Notify user (customer) about booking confirmation
  // ============================================
  async notifyUserBookingConfirmation(user: User, booking: Booking): Promise<void> {
    console.log(`[notifyUserBookingConfirmation] Starting for user ${user.id}, booking ${booking.id}`);
    
    // Check if user has FCM token
    // Note: User's fcmToken is stored in the user record
    if (!user.fcmToken) {
      console.log(`[notifyUserBookingConfirmation] No FCM token for user ${user.id} - user needs to register their FCM token first!`);
      return;
    }

    console.log(`[notifyUserBookingConfirmation] User has FCM token: ${user.fcmToken.substring(0, 20)}...`);
    
    const serviceName = booking.service?.name || 'Service';
    const notificationTitle = 'Booking Confirmed!';
    const notificationBody = `Your ${serviceName} booking has been confirmed successfully!`;

    console.log(`[notifyUserBookingConfirmation] Sending push notification: title="${notificationTitle}", body="${notificationBody}"`);
    
    await this.sendPushNotification(
      user.fcmToken,
      notificationTitle,
      notificationBody,
      {
        type: 'booking_confirmation',
        bookingId: booking.id.toString(),
      },
    );

    console.log(`[notifyUserBookingConfirmation] Completed for user ${user.id} for booking ${booking.id}`);
  }

  async notifyAdmins(subject: string, message: string): Promise<void> {
    // Email/SMS notifications have been completely removed from the system
    console.log(`[NOTIFICATION SYSTEM DISABLED] Admin notification skipped: ${subject} - ${message}`);
  }

  async sendPreServiceReminder(
    booking: Booking,
    reminderType: '24h' | '2h',
  ): Promise<void> {
    // FIX: booking.userId should be a UUID (stored as uuid type in booking table)
    // Validate UUID format before querying to handle stale data with numeric userIds
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Accept both numeric legacy user ids and UUID format
    const isValidUserId = booking.userId && (
      typeof booking.userId === 'number' ||
      (typeof booking.userId === 'string' && uuidRegex.test(booking.userId))
    );
    
    if (!isValidUserId) {
      console.warn(`Skipping booking ${booking.id} - invalid userId: ${booking.userId}`);
      return;
    }

    let user;
    // Handle both legacy numeric ids and modern UUID publicIds
    if (typeof booking.userId === 'number') {
      // Legacy integer user id - query by primary key id column
      user = await this.usersRepository.findOne({
        where: { id: booking.userId }
      });
    } else {
      // Modern UUID publicId - query by publicId column
      user = await this.usersRepository.findOne({
        where: { publicId: booking.userId }
      });
    }
    if (!user) {
      console.error(`User not found for booking ${booking.id}, userId: ${booking.userId}`);
      return;
    }

    const timeString = this.formatTime(booking.startTime);

    if (reminderType === '24h') {
      // T-24 hours reminder
      const pushTitle = 'Service scheduled for tomorrow';
      const pushBody = `Your SEVAQ service is scheduled for tomorrow at ${timeString}. We'll take care of everything.`;

      // Use user's FCM token for push notification
      if (user.fcmToken) {
        await this.sendPushNotification(user.fcmToken, pushTitle, pushBody);
      } else {
        console.warn(
          `No FCM token for user ${user.id}, skipping push notification`,
        );
      }

      // Email/SMS notifications have been completely removed from the system
      console.log(`[NOTIFICATION SYSTEM DISABLED] ${reminderType} reminder skipped for user ${user.id} - only push notifications are active`);
    } else {
      // T-2 hours reminder
      const pushTitle = 'Your service is coming up';
      const pushBody = `Your SEVAQ service starts at ${timeString}. Everything is on track.`;

      // Use user's FCM token for push notification
      if (user.fcmToken) {
        await this.sendPushNotification(user.fcmToken, pushTitle, pushBody);
      } else {
        console.warn(
          `No FCM token for user ${user.id}, skipping push notification`,
        );
      }

      // Email/SMS notifications have been completely removed from the system
      console.log(`[NOTIFICATION SYSTEM DISABLED] ${reminderType} reminder skipped for user ${user.id} - only push notifications are active`);
    }
  }

  async checkAndSendReminders(): Promise<{ success: boolean, processed: number, sent: number, errors: number }> {
    const stats = { processed: 0, sent: 0, errors: 0 };
    
    try {
      const bookings = await this.findBookingsNeedingReminders();
      stats.processed = bookings.length;
      
      for (const booking of bookings) {
        try {
          const reminderType = await this.determineReminderType(booking);
          if (reminderType) {
            await this.sendPreServiceReminder(booking, reminderType);
            
            // MARK REMINDER AS SENT - PERMANENT FIX FOR DUPLICATE NOTIFICATIONS
            await this.bookingsRepository
              .createQueryBuilder()
              .update(Booking)
              .set({ preServiceReminderSent: true })
              .where('id = :id', { id: booking.id })
              .execute();
            
            stats.sent++;
          }
        } catch (bookingError) {
          stats.errors++;
          this.logger.error(`Failed processing booking ${booking.id} for reminder`, bookingError);
          // Continue processing other bookings - don't fail entire batch
        }
      }
      
      return {
        success: stats.errors === 0,
        ...stats
      };
      
    } catch (globalError) {
      this.logger.error('Fatal failure in pre-service reminder check', globalError);
      throw globalError; // Re-throw so scheduler knows about complete failure
    }
  }

  private async determineReminderType(
    booking: Booking,
  ): Promise<'24h' | '2h' | null> {
    const now = new Date();
    // startTime is now a time string (HH:mm:ss), so we need to parse it
    const parseTimeToDate = (timeStr: string): Date => {
      if (typeof timeStr === 'string' && timeStr.includes(':')) {
        // Time string HH:mm:ss - combine with today's date
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || '0', 10);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
      // Fallback
      return new Date();
    };

    const bookingDateTime = parseTimeToDate(booking.startTime);

    // Calculate hours difference
    const hoursDifference =
      (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference <= 2 && hoursDifference > 0) {
      return '2h';
    } else if (hoursDifference > 2 && hoursDifference <= 26) {
      return '24h';
    }

    return null; // Not within reminder window
  }

  private formatTime(time: string | Date): string {
    // Handle both string and Date inputs
    let dateTime: Date;
    if (time instanceof Date) {
      dateTime = time;
    } else {
      // Parse time string (format: HH:mm or HH:mm:ss)
      const parts = time.split(':');
      dateTime = new Date();
      dateTime.setHours(parseInt(parts[0], 10));
      dateTime.setMinutes(parseInt(parts[1], 10));
      dateTime.setSeconds(parts[2] ? parseInt(parts[2], 10) : 0);
    }

    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  async findUpcomingBookings(): Promise<Booking[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .where('booking.status = :status', { status: 'confirmed' })
      .andWhere('booking.date >= :today', {
        today: now.toISOString().split('T')[0],
      })
      .andWhere('booking.date <= :tomorrow', {
        tomorrow: tomorrow.toISOString().split('T')[0],
      })
      .orderBy('booking.date', 'ASC')
      .addOrderBy('booking.startTime', 'ASC')
      .getMany();
  }

  async findBookingsNeedingReminders(userId?: string): Promise<Booking[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twentySixHoursFromNow = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    try {
      // Get all bookings first, then filter in memory to avoid UUID/INT join issues
      const allBookings = await this.bookingsRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.worker', 'worker')
        .leftJoinAndSelect('worker.user', 'workerUser')
        .leftJoinAndSelect('booking.service', 'service')
        .where('booking.status = :status', { status: 'confirmed' })
        .andWhere('booking.date >= :today', {
          today: now.toISOString().split('T')[0],
        })
        .andWhere('booking.date <= :tomorrow', {
          tomorrow: tomorrow.toISOString().split('T')[0],
        })
        .getMany();

      // Filter by userId if provided (after fetching)
      let bookings = allBookings;
      if (userId) {
        // Get active subscription for this user to find subscription bookings
        const activeSubscription = await this.subscriptionsRepository.findOne({
          where: {
            userId: userId,
            status: SubscriptionStatus.ACTIVE,
          },
        });
        const subscriptionId = activeSubscription?.id;

        bookings = allBookings.filter(
          (booking) =>
            booking.userId === userId ||
            (subscriptionId && booking.subscriptionId === subscriptionId)
        );
      }

      // Filter to only include bookings within the 2h-26h window AND NO REMINDER SENT YET
      return bookings.filter((booking) => {
        if (!booking.startTime) return false;
        // Skip if reminder was already sent
        if (booking.preServiceReminderSent === true) return false;
        
        const timeParts = booking.startTime.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1] || '0', 10);
        
        const bookingDateTime = new Date();
        bookingDateTime.setHours(hours, minutes, 0, 0);
        bookingDateTime.setSeconds(0);
        bookingDateTime.setMilliseconds(0);

        const hoursDifference =
          (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursDifference > 2 && hoursDifference <= 26;
      });
    } catch (error) {
      console.error('Error finding bookings needing reminders:', error);
      return [];
    }
  }

  async findAllUserBookings(userPublicId: string): Promise<Booking[]> {
    // First, find the user by their publicId to get the internal ID
    const user = await this.usersRepository.findOne({
      where: { publicId: userPublicId },
    });

    if (!user) {
      return [];
    }

    // Get ALL active subscriptions for this user to include all subscription bookings
    const activeSubscriptions = await this.subscriptionsRepository.find({
      where: {
        userId: userPublicId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    const subscriptionIds = activeSubscriptions.map(sub => sub.id).filter(id => id !== undefined);

    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.subscription', 'subscription')
      .where(
        new Brackets((qb: WhereExpressionBuilder) => {
          qb.where('booking.userId = :userId', { userId: userPublicId });
          if (subscriptionIds.length > 0) {
            qb.orWhere('booking.subscriptionId IN (:...subscriptionIds)', {
              subscriptionIds,
            });
          }
        })
      )
      .orderBy('booking.date', 'ASC')
      .addOrderBy('booking.startTime', 'ASC')
      .getMany()
      .then(bookings => {
        console.log('🔍 findAllUserBookings: Loaded', bookings.length, 'bookings');
        bookings.forEach(b => {
          console.log(`  - Booking ${b.publicId}: subscriptionId=${b.subscriptionId}, subscription=${b.subscription ? b.subscription.publicId : null}`);
        });
        return bookings;
      });
  }

  async findAllBookings(): Promise<Booking[]> {
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .orderBy('booking.date', 'ASC')
      .addOrderBy('booking.startTime', 'ASC')
      .getMany();
  }
}
