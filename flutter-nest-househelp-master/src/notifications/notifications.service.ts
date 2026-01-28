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

    // Configure Firebase Admin SDK
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      if (!admin.apps.length) {
        console.error('Error initializing Firebase Admin SDK:', error);
      }
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

  async sendPushNotification(to: string, title: string, body: string): Promise<void> {
    try {
      // Check if Firebase Admin SDK is initialized
      if (!admin.apps.length) {
        console.warn('Firebase Admin SDK not initialized, skipping push notification');
        return;
      }
      
      // Assuming 'to' is the FCM token
      const message = {
        token: to,
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

  async sendPreServiceReminder(booking: Booking, reminderType: '24h' | '2h'): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: booking.userId } });
    if (!user) {
      console.error(`User not found for booking ${booking.id}`);
      return;
    }

    const timeString = this.formatTime(booking.startTime);
    
    if (reminderType === '24h') {
      // T-24 hours reminder
      const pushTitle = 'Service scheduled for tomorrow';
      const pushBody = `Your SEVAQ service is scheduled for tomorrow at ${timeString}. We’ll take care of everything.`;
      
      await this.sendPushNotification(user.id.toString(), pushTitle, pushBody);
      
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
      
      await this.sendPushNotification(user.id.toString(), pushTitle, pushBody);
      
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
      await this.sendPreServiceReminder(booking, reminderType);
    }
  }

  private async determineReminderType(booking: Booking): Promise<'24h' | '2h'> {
    const now = new Date();
    // Handle cases where date or startTime might not be Date objects
    const bookingDate = booking.date instanceof Date ? booking.date : new Date(booking.date);
    const bookingTime = booking.startTime instanceof Date ? booking.startTime : new Date(`1970-01-01T${booking.startTime}`);
    
    const bookingDateTime = new Date(
      bookingDate.getFullYear(),
      bookingDate.getMonth(),
      bookingDate.getDate(),
      bookingTime.getHours(),
      bookingTime.getMinutes()
    );

    const timeUntilBooking = bookingDateTime.getTime() - now.getTime();

    // Check if booking needs 24h or 2h reminder
    const is24hReminder = timeUntilBooking >= 23.5 * 60 * 60 * 1000 && timeUntilBooking <= 24.5 * 60 * 60 * 1000;
    const is2hReminder = timeUntilBooking >= 1.5 * 60 * 60 * 1000 && timeUntilBooking <= 2.5 * 60 * 60 * 1000;
    const isTestReminder = timeUntilBooking >= 4 * 60 * 60 * 1000 && timeUntilBooking <= 5 * 60 * 60 * 1000;

    if (is24hReminder) return '24h';
    if (is2hReminder) return '2h';
    if (isTestReminder) return '2h'; // treat test as 2h for now

    return '2h'; // default
  }

  async findBookingsNeedingReminders(userId?: string): Promise<Booking[]> {
    const now = new Date();
    console.log('Finding bookings needing reminders at:', now.toISOString(), 'for userId:', userId);

    const queryBuilder = this.bookingsRepository.createQueryBuilder('booking');
    const query = queryBuilder
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .leftJoinAndSelect('booking.service', 'service')
      .where('booking.status IN (:...statuses)', { statuses: ['confirmed', 'requested'] });

    if (userId) {
      query.andWhere('booking.userId = :userId', { userId });
    }

    const bookings = await query.getMany();

    console.log('Total confirmed bookings found:', bookings.length);

    // Filter bookings that need reminders
    return bookings.filter(booking => {
      // Handle cases where date or startTime might not be Date objects
      const bookingDate = booking.date instanceof Date ? booking.date : new Date(booking.date);
      const bookingTime = booking.startTime instanceof Date ? booking.startTime : new Date(`1970-01-01T${booking.startTime}`);
      
      const bookingDateTime = new Date(
        bookingDate.getFullYear(),
        bookingDate.getMonth(),
        bookingDate.getDate(),
        bookingTime.getHours(),
        bookingTime.getMinutes()
      );

      const timeUntilBooking = bookingDateTime.getTime() - now.getTime();

      // Check if booking needs 24h or 2h reminder
      const is24hReminder = timeUntilBooking >= 23.5 * 60 * 60 * 1000 && timeUntilBooking <= 24.5 * 60 * 60 * 1000;
      const is2hReminder = timeUntilBooking >= 1.5 * 60 * 60 * 1000 && timeUntilBooking <= 2.5 * 60 * 60 * 1000;
      
      // For testing purposes, include bookings with timeUntil between 1-24 hours
      const isTestReminder = timeUntilBooking >= 1 * 60 * 60 * 1000 && timeUntilBooking <= 24 * 60 * 60 * 1000;

      // Debug log for each booking
      console.log(`Booking ID: ${booking.id}, Date: ${booking.date}, Time: ${booking.startTime}, Time Until Booking: ${(timeUntilBooking / 1000 / 60).toFixed(2)} minutes`);

      return is24hReminder || is2hReminder || isTestReminder;
    });
  }



  private formatTime(time: any): string {
    // Handle cases where time might not be a Date object (e.g., string like '08:00:00')
    let dateTime: Date;
    if (time instanceof Date) {
      dateTime = time;
    } else {
      // If time is a string like '08:00:00', create a date object with that time
      dateTime = new Date(`1970-01-01T${time}`);
    }
    
    let hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
    
    return `${hours}:${minutesStr} ${ampm}`;
  }
}