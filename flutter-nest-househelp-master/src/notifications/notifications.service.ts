import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;
  private twilioClient: Twilio;
  private firebaseInitialized: boolean = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    // Configure nodemailer
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Configure Twilio
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.twilioClient = new Twilio(accountSid, authToken);

    // Configure Firebase Admin SDK (optional - only if credentials are provided)
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');

    // Only initialize if all required credentials are provided
    if (
      projectId &&
      clientEmail &&
      privateKey &&
      projectId !== 'your-firebase-project-id'
    ) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        console.warn(
          'Firebase Admin SDK initialization failed, push notifications will be skipped:',
          error.message,
        );
        this.firebaseInitialized = false;
      }
    } else {
      console.warn(
        'Firebase Admin SDK credentials not configured, push notifications will be skipped',
      );
      this.firebaseInitialized = false;
    }
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        text,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error to prevent failing the entire reminder process
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to,
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      // Don't throw error to prevent failing the entire reminder process
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
  ): Promise<void> {
    try {
      // Check if Firebase Admin SDK is initialized
      if (!this.firebaseInitialized) {
        console.warn(
          'Firebase Admin SDK not initialized, skipping push notification',
        );
        return;
      }

      // Check if FCM token is provided
      if (!fcmToken) {
        console.warn('No FCM token provided, skipping push notification');
        return;
      }

      const message = {
        token: fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: {
          // Optional additional data
          type: 'pre_service_reminder',
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`Successfully sent push notification: ${response}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async notifyAdmins(subject: string, message: string): Promise<void> {
    const adminEmails = this.configService.get('ADMIN_EMAILS', '').split(',');
    const adminPhones = this.configService.get('ADMIN_PHONES', '').split(',');

    // Send emails
    for (const email of adminEmails) {
      if (email.trim()) {
        await this.sendEmail(email.trim(), subject, message);
      }
    }

    // Send SMS
    for (const phone of adminPhones) {
      if (phone.trim()) {
        await this.sendSms(phone.trim(), message);
      }
    }
  }

  async sendPreServiceReminder(
    booking: Booking,
    reminderType: '24h' | '2h',
  ): Promise<void> {
    // FIX: booking.userId is already a UUID (stored as uuid type in booking table)
    // Use it directly to find the user via their publicId (which is also a UUID)
    const user = await this.usersRepository.findOne({
      where: { publicId: booking.userId },
    });
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

      if (user.email) {
        await this.sendEmail(user.email, pushTitle, pushBody);
      }

      if (user.phone) {
        await this.sendSms(user.phone, pushBody);
      }
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

      if (user.email) {
        await this.sendEmail(user.email, pushTitle, pushBody);
      }

      if (user.phone) {
        await this.sendSms(user.phone, pushBody);
      }
    }
  }

  async checkAndSendReminders(): Promise<void> {
    const bookings = await this.findBookingsNeedingReminders();
    for (const booking of bookings) {
      const reminderType = await this.determineReminderType(booking);
      if (reminderType) {
        await this.sendPreServiceReminder(booking, reminderType);
      }
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
        bookings = allBookings.filter(booking => booking.userId === userId);
      }

      // Filter to only include bookings within the 2h-26h window
      return bookings.filter((booking) => {
        if (!booking.startTime) return false;
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
    // Fetch all bookings and filter by userPublicId to avoid UUID/INT join issues
    const allBookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .orderBy('booking.date', 'ASC')
      .addOrderBy('booking.startTime', 'ASC')
      .getMany();

    // Filter in memory by comparing UUIDs
    return allBookings.filter(booking => booking.userId === userPublicId);
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
