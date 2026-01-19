import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Twilio } from 'twilio';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;
  private twilioClient: Twilio;

  constructor(private configService: ConfigService) {
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
      throw error;
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
      throw error;
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
}