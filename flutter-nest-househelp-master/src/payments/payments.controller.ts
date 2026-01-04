import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('create-order')
    async createOrder(@Body() body: { amount: number; currency?: string }) {
        return this.paymentsService.createOrder(body.amount, body.currency);
    }

    @Post('verify')
    async verifyPayment(@Body() body: { razorpayOrderId: string; razorpayPaymentId: string; signature: string; bookingData: any }) {
        const isValid = await this.paymentsService.verifyPayment(
            body.razorpayOrderId,
            body.razorpayPaymentId,
            body.signature,
        );
        if (!isValid) {
            throw new BadRequestException('Invalid payment signature');
        }
        // Create booking after successful payment verification
        const booking = await this.paymentsService.createBookingAfterPayment(body.bookingData, body.razorpayOrderId, body.razorpayPaymentId);
        return { status: 'success', booking };
    }
}
