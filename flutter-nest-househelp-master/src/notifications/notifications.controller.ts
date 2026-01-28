import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-pre-service-reminders')
  async sendPreServiceReminders() {
    await this.notificationsService.checkAndSendReminders();
    return { message: 'Pre-service reminders sent successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('upcoming-bookings')
  async getUpcomingBookings(@Request() req) {
    const bookings = await this.notificationsService.findBookingsNeedingReminders(req.user.userId);
    return {
      count: bookings.length,
      bookings: bookings.map(booking => {
        // Combine date and startTime into a single ISO8601 datetime string
        const bookingDate = booking.date instanceof Date ? booking.date : new Date(booking.date);
        const bookingTime = booking.startTime instanceof Date ? booking.startTime : new Date(`1970-01-01T${booking.startTime}`);
        const endTime = booking.endTime instanceof Date ? booking.endTime : new Date(`1970-01-01T${booking.endTime}`);
        
        const combinedStartTime = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          bookingTime.getHours(),
          bookingTime.getMinutes()
        );
        
        const combinedEndTime = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          endTime.getHours(),
          endTime.getMinutes()
        );
        
        return {
          id: booking.id,
          publicId: booking.publicId,
          startTime: combinedStartTime.toISOString(),
          endTime: combinedEndTime.toISOString(),
          status: booking.status,
          isPaid: booking.isPaid,
          totalAmount: booking.totalAmount,
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
            user: booking.worker?.user ? {
              id: booking.worker.user.id,
              publicId: booking.worker.user.publicId,
              email: booking.worker.user.email,
              firstName: booking.worker.user.firstName,
              lastName: booking.worker.user.lastName,
              role: booking.worker.user.role,
            } : null,
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
}
