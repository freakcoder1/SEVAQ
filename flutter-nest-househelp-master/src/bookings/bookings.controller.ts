import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import {
  PaginationDto,
  createPaginatedResponse,
} from '../common/dto/pagination.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Post(':id/attempt-assignment')
  attemptAssignment(@Param('id') id: string) {
    console.log('🔍 Attempting assignment for booking ID:', id);
    return this.bookingsService.attemptAssignment(id);
  }

  @Post(':id/create-with-assignment')
  @UsePipes(new ValidationPipe({ transform: true }))
  createWithAssignment(
    @Param('id') id: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createWithAssignment(createBookingDto);
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('userId') userId?: string,
    @Query('workerId') workerId?: string,
  ) {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 20;
    const { sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.bookingsService.findAllPaginated(
      userId,
      workerId,
      skip,
      limit,
      sortBy,
      sortOrder,
    );

    return createPaginatedResponse(data, total, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Post('assign')
  assignBooking(
    @Body() assignBookingDto: { bookingId: string; workerId: string },
  ) {
    return this.bookingsService.assignBooking(assignBookingDto);
  }
}
