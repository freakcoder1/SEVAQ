import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  PaginationDto,
  createPaginatedResponse,
} from '../common/dto/pagination.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: AdminCreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('register-fcm-token')
  @UseGuards(JwtAuthGuard)
  async registerFcmToken(@Request() req, @Body('fcmToken') fcmToken: string) {
    await this.usersService.updateFcmToken(req.user.userId, fcmToken);
    return { success: true, message: 'FCM token registered successfully' };
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll(@Query() paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 20;
    const { sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.usersService.findAllPaginated(
      skip,
      limit,
      sortBy,
      sortOrder,
    );

    return createPaginatedResponse(data, total, page, limit);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
