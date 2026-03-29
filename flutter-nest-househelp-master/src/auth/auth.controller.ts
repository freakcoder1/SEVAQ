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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { WorkersService } from '../workers/workers.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  LoginDto,
  VerifyOtpLoginDto,
  VerifyIdTokenDto,
  GetUserByPhoneDto,
} from './dto';
import { CreateWorkerRegistrationDto } from './dto/create-worker-registration.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly workersService: WorkersService,
  ) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // Max 5 login attempts per minute
  async login(@Body() loginDto: LoginDto) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    this.logger.log(
      `🔐 [${requestId}] Login request received - Email: ${loginDto.email || 'N/A'}`,
    );

    try {
      this.logger.debug(
        `🔍 [${requestId}] Starting user validation for email: ${loginDto.email}`,
      );

      const user = await this.authService.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        this.logger.warn(
          `❌ [${requestId}] Authentication failed - Invalid credentials for email: ${loginDto.email}`,
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
        `💥 [${requestId}] Login failed - Email: ${loginDto.email || 'N/A'}, Error: ${error.message}, Duration: ${duration}ms`,
      );
      throw error;
    }
  }

  @Post('signup')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // Max 3 signup attempts per minute
  async signup(@Body() createUserDto: CreateUserDto) {
    console.log('Signup request received:', createUserDto);
    const result = await this.authService.signup(createUserDto);
    console.log('Signup successful for user:', createUserDto.email);
    return result;
  }

  /**
   * Worker registration - creates both user account and worker profile
   * POST /auth/workers/register
   */
  @Post('workers/register')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // Max 3 worker registrations per minute
  async registerWorker(@Body() createWorkerDto: CreateWorkerRegistrationDto) {
    this.logger.log(`Worker registration request received: ${createWorkerDto.email}`);
    this.logger.log(`Worker registration DTO: ${JSON.stringify(createWorkerDto)}`);
    try {
      const result = await this.authService.registerWorker(createWorkerDto);
      this.logger.log(`Worker registration successful: ${createWorkerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Worker registration failed: ${error.message}`);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Create worker profile for logged-in user (authenticated)
   * POST /auth/workers/register-authenticated
   * This endpoint is for existing users who want to become workers
   * Uses JWT auth - requires Bearer token
   */
  @Post('workers/register-authenticated')
  @UseGuards(JwtAuthGuard)
  async registerWorkerProfile(@Request() req, @Body() body: { name?: string; bio?: string; serviceIds?: string[]; latitude?: number; longitude?: number }) {
    this.logger.log(`Worker profile creation request from user: ${req.user.userId}`);
    this.logger.log(`Request body: ${JSON.stringify(body)}`);
    
    try {
      // Check if user already has a worker profile
      const existingWorker = await this.workersService.findByUserId(req.user.userId);
      if (existingWorker) {
        return {
          worker: existingWorker,
          message: 'Worker profile already exists',
          needsApproval: false
        };
      }
      
      // Create worker profile
      const worker = await this.workersService.createWorkerProfile(
        req.user.userId,
        body.bio || '',
        body.serviceIds || [],
        body.latitude || 28.5804579,
        body.longitude || 77.4392951,
      );
      
      this.logger.log(`Worker profile created for user: ${req.user.userId}`);
      
      return {
        worker: worker,
        message: 'Worker registered successfully. Pending admin approval.',
        needsApproval: true
      };
    } catch (error) {
      this.logger.error(`Worker profile creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // OTP Login endpoints
  @Post('otp/verify-login')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // Max 10 OTP attempts per minute
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
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // Max 10 OTP token verifications per minute
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
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // Max 10 OTP user lookups per minute
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
