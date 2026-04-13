import { Controller, Post, Get, UseGuards, Request, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtRequest } from '../common/types/jwt-user.type';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications/firebase-status
   * Returns Firebase initialization status for monitoring and diagnostics
   */
  @Get('firebase-status')
  getFirebaseStatus() {
    const status = this.notificationsService.getFirebaseStatus();
    return {
      success: true,
      timestamp: new Date().toISOString(),
      firebase: status,
      summary: status.initialized
        ? `Firebase is initialized (Project: ${status.projectId}, Type: ${status.credentialType})`
        : `Firebase is NOT initialized. Last error: ${status.lastError}`,
    };
  }

  @Post('send-pre-service-reminders')
  async sendPreServiceReminders() {
    await this.notificationsService.checkAndSendReminders();
    return { message: 'Pre-service reminders sent successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('upcoming-bookings')
  async getUpcomingBookings(@Request() req: JwtRequest) {
    const bookings =
      await this.notificationsService.findBookingsNeedingReminders(
        req.user.userId,
      );
    return {
      count: bookings.length,
      bookings: bookings.map((booking) => {
        return {
          id: booking.id,
          type: booking.type,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          amount: booking.amount,
          user: {
            id: booking.user.id,
            publicId: booking.user.publicId,
            email: booking.user.email,
            firstName: booking.user.firstName,
            lastName: booking.user.lastName,
            role: booking.user.role,
          },
          worker: {
            id: booking.worker?.id,
            publicId: booking.worker?.publicId,
            user: booking.worker?.user
              ? {
                  id: booking.worker.user.id,
                  publicId: booking.worker.user.publicId,
                  email: booking.worker.user.email,
                  firstName: booking.worker.user.firstName,
                  lastName: booking.worker.user.lastName,
                  role: booking.worker.user.role,
                }
              : null,
            rating: booking.worker?.rating,
            reviewCount: booking.worker?.reviewCount,
            bio: booking.worker?.bio,
          },
          service: {
            id: booking.service?.id,
            publicId: booking.service?.publicId,
            name: booking.service?.name,
            description: booking.service?.description,
            basePrice: booking.service?.basePrice,
            category: booking.service?.category,
          },
        };
      }),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('all-bookings')
  async getAllBookings(@Request() req: JwtRequest) {
    const bookings = await this.notificationsService.findAllUserBookings(
      req.user.userId,
    );
    return {
      count: bookings.length,
      bookings: bookings.map((booking) => {
        return {
          id: booking.id,
          type: booking.type,
          date: booking.date, // Include the date field - CRITICAL for frontend
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          amount: booking.amount || booking.totalAmount,
          user: {
            id: booking.user.id,
            publicId: booking.user.publicId,
            email: booking.user.email,
            firstName: booking.user.firstName,
            lastName: booking.user.lastName,
            role: booking.user.role,
          },
          worker: {
            id: booking.worker?.id,
            publicId: booking.worker?.publicId,
            user: booking.worker?.user
              ? {
                  id: booking.worker.user.id,
                  publicId: booking.worker.user.publicId,
                  email: booking.worker.user.email,
                  firstName: booking.worker.user.firstName,
                  lastName: booking.worker.user.lastName,
                  role: booking.worker.user.role,
                }
              : null,
            rating: booking.worker?.rating,
            reviewCount: booking.worker?.reviewCount,
            bio: booking.worker?.bio,
          },
          service: {
            id: booking.service?.id,
            publicId: booking.service?.publicId,
            name: booking.service?.name,
            description: booking.service?.description,
            basePrice: booking.service?.basePrice,
            category: booking.service?.category,
          },
        };
      }),
    };
  }

  /**
   * POST /notifications/test-fcm
   * Test FCM notification delivery (for diagnostics)
   * Temporarily allowing unauthenticated access for testing
   */
  @Post('test-fcm')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async testFcmNotification(
    @Body() body: { fcmToken: string; title: string; body: string; data?: Record<string, any> },
  ) {
    try {
      await this.notificationsService.sendPushNotification(
        body.fcmToken,
        body.title,
        body.body,
        body.data,
      );
      return {
        success: true,
        message: 'Test FCM notification sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error sending test FCM notification: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
