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
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FcmGuestTokenService } from './fcm-guest-token.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtRequest } from '../common/types/jwt-user.type';
import {
  PaginationDto,
  createPaginatedResponse,
} from '../common/dto/pagination.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly fcmGuestTokenService: FcmGuestTokenService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: AdminCreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('register-fcm-token')
  @HttpCode(HttpStatus.OK)
  async registerFcmToken(@Request() req: any, @Body() registerFcmTokenDto: RegisterFcmTokenDto) {
    const userId = req.user?.userId;
    this.logger.log(
      `POST /register-fcm-token :: userId=${userId ?? '(null, guest)'}, deviceId=${registerFcmTokenDto.deviceId ?? '(null)'}, fcmToken=${registerFcmTokenDto.fcmToken?.substring(0, 20)}...`,
    );

    if (userId) {
      // Authenticated user: attach token to user account
      await this.usersService.updateFcmToken(userId, registerFcmTokenDto.fcmToken);
      this.logger.log(`Updated FCM token for authenticated user ${userId}`);
    } else if (registerFcmTokenDto.deviceId) {
      // Guest / unauthenticated: store token keyed by deviceId
      await this.fcmGuestTokenService.storeToken(
        registerFcmTokenDto.deviceId,
        registerFcmTokenDto.fcmToken,
      );
      this.logger.log(`Stored guest FCM token for deviceId=${registerFcmTokenDto.deviceId}`);
    } else {
      this.logger.warn('No userId and no deviceId — guest FCM token NOT stored');
    }

    return {
      success: true,
      message: 'FCM token registered successfully',
      timestamp: new Date().toISOString(),
    };
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

  @Get('fcm-guest-tokens')
  @UseGuards(AdminGuard)
  async listGuestFcmTokens() {
    const tokens = await this.fcmGuestTokenService.findAll();
    return { success: true, data: tokens };
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
