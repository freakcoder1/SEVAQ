import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { BookingsService } from '../bookings/bookings.service';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    private razorpay: any;

    constructor(
        @InjectRepository(Payment)
        private paymentsRepository: Repository<Payment>,
        private configService: ConfigService,
        private bookingsService: BookingsService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || 'test_key_id',
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'test_key_secret',
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

    async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'test_key_secret';
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');

        if (generated_signature === signature) {
            return true;
        }
        return false;
    }

    async createBookingAfterPayment(bookingData: any, razorpayOrderId: string, razorpayPaymentId: string) {
        // Create the booking
        const booking = await this.bookingsService.create(bookingData) as any;

        // Save payment record
        const payment = this.paymentsRepository.create({
            razorpayOrderId,
            razorpayPaymentId,
            amount: bookingData.amount / 100, // Convert from paise to rupees
            currency: bookingData.currency || 'INR',
            status: PaymentStatus.PAID,
            booking: { id: booking.id },
        });
        await this.paymentsRepository.save(payment);

        // Update booking with payment info
        await this.bookingsService.update(booking.id, { isPaid: true, paymentId: payment.id });

        return booking;
    }
}
