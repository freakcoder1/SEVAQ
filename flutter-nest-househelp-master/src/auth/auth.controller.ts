import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  VerifyOtpLoginDto,
  VerifyIdTokenDto,
  GetUserByPhoneDto,
} from './dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  @Post('login')
  async login(@Body() req) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    this.logger.log(
      `🔐 [${requestId}] Login request received - Email: ${req.email || 'N/A'}, IP: ${req.ip || 'unknown'}`,
    );

    try {
      // Validate input
      if (!req.email || !req.password) {
        this.logger.warn(
          `❌ [${requestId}] Missing credentials - Email: ${req.email || 'empty'}, Password: ${req.password ? 'provided' : 'empty'}`,
        );
        throw new HttpException(
          'Email and password are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.debug(
        `🔍 [${requestId}] Starting user validation for email: ${req.email}`,
      );

      const user = await this.authService.validateUser(req.email, req.password);

      if (!user) {
        this.logger.warn(
          `❌ [${requestId}] Authentication failed - Invalid credentials for email: ${req.email}`,
        );
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      this.logger.log(
        `✅ [${requestId}] User authenticated successfully - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`,
      );

      const result = this.authService.login(user);
      const duration = Date.now() - startTime;

      this.logger.log(
        `🚀 [${requestId}] Login completed successfully - User: ${user.email}, Duration: ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `💥 [${requestId}] Login failed - Email: ${req.email || 'N/A'}, Error: ${error.message}, Duration: ${duration}ms`,
      );
      throw error;
    }
  }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    console.log('Signup request received:', createUserDto);
    const result = await this.authService.signup(createUserDto);
    console.log('Signup successful for user:', createUserDto.email);
    return result;
  }

  // OTP Login endpoints
  @Post('otp/verify-login')
  async verifyOtpLogin(@Body() verifyOtpLoginDto: VerifyOtpLoginDto) {
    this.logger.log(`OTP login request received - Phone: ${verifyOtpLoginDto.phone}`);

    try {
      const result = await this.firebaseAuthService.verifyPhoneAndLogin(
        verifyOtpLoginDto.phone,
        verifyOtpLoginDto.idToken,
      );
      this.logger.log(`OTP login successful for phone: ${verifyOtpLoginDto.phone}`);
      return result;
    } catch (error) {
      this.logger.error(`OTP login failed: ${error.message}`);
      throw error;
    }
  }

  @Post('otp/verify-token')
  async verifyIdToken(@Body() verifyIdTokenDto: VerifyIdTokenDto) {
    this.logger.log('OTP token verification request received');

    try {
      const decodedToken = await this.firebaseAuthService.verifyIdToken(
        verifyIdTokenDto.idToken,
      );
      return decodedToken;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw error;
    }
  }

  @Post('otp/get-user')
  async getUserByPhone(@Body() getUserByPhoneDto: GetUserByPhoneDto) {
    this.logger.log(`Getting user by phone: ${getUserByPhoneDto.phone}`);

    try {
      const user = await this.firebaseAuthService.getUserByPhone(getUserByPhoneDto.phone);
      return { user };
    } catch (error) {
      this.logger.error(`Get user by phone failed: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.userId;
    return this.authService.updateProfile(userId, updateUserDto);
  }
}
