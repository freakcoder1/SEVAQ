import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    create(@Body() createBookingDto: any) {
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    findAll(@Query('userId') userId?: string, @Query('workerId') workerId?: string) {
        return this.bookingsService.findAll(userId, workerId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBookingDto: any) {
        return this.bookingsService.update(id, updateBookingDto);
    }
}
