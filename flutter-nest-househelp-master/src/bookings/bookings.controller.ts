import { Controller, Get, Post, Body, Param, Patch, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.create(createBookingDto);
    }

    @Post(':id/attempt-assignment')
    attemptAssignment(@Param('id') id: number) {
        console.log('🔍 Attempting assignment for booking ID:', id);
        return this.bookingsService.attemptAssignment(id);
    }

    @Post(':id/create-with-assignment')
    @UsePipes(new ValidationPipe({ transform: true }))
    createWithAssignment(@Param('id') id: string, @Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.createWithAssignment(createBookingDto);
    }

    @Get()
    findAll(@Query('userId') userId?: string, @Query('workerId') workerId?: string) {
        return this.bookingsService.findAll(userId, workerId);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    update(@Param('id') id: number, @Body() updateBookingDto: UpdateBookingDto) {
        return this.bookingsService.update(id, updateBookingDto);
    }

    @Post('assign')
    assignBooking(@Body() assignBookingDto: { bookingId: number; workerId: number }) {
        return this.bookingsService.assignBooking(assignBookingDto);
    }
}
