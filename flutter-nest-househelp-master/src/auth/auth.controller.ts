import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
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
import { AdminGuard } from './admin.guard';
import { JwtRequest } from '../common/types/jwt-user.type';
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
  async login(@Body() loginDto: LoginDto, @Request() req: JwtRequest) {
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

      const result = await this.authService.login(user);
      const duration = Date.now() - startTime;

      this.logger.log(
        `🚀 [${requestId}] Login completed successfully - User: ${user.email}, Duration: ${duration}ms`,
      );

      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `💥 [${requestId}] Login failed - Email: ${loginDto.email || 'N/A'}, Error: ${errorMessage}, Duration: ${duration}ms`,
      );
      throw error;
    }
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // Max 10 refresh attempts per minute
  async refresh(@Body() body: { refresh_token: string }) {
    this.logger.log('Refresh token request received');
    try {
      const result = await this.authService.refreshToken(body.refresh_token);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Refresh token failed: ${errorMessage}`);
      throw error;
    }
  }

  @Post('signup')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // Max 3 signup attempts per minute
  async signup(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Signup request received: ${createUserDto.email}`);
    const result = await this.authService.signup(createUserDto);
    this.logger.log(`Signup successful for user: ${createUserDto.email}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Worker registration failed: ${errorMessage}`);
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
  async registerWorkerProfile(@Request() req: JwtRequest, @Body() body: { name?: string; bio?: string; serviceIds?: string[]; latitude?: number; longitude?: number }) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Worker profile creation failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  // Debug endpoint to check user by phone (TEMPORARY - no guard for testing)
  @Get('debug/user-check')
  async debugUserCheck(@Query('phone') phone: string) {
    this.logger.log(`Debug: Checking user with phone: ${phone}`);
    
    // Generate phone variations
    const phoneVariations = this.firebaseAuthService['generatePhoneVariations'](phone);
    this.logger.log(`Debug: Phone variations: ${JSON.stringify(phoneVariations)}`);
    
    const results: any[] = [];
    for (const variant of phoneVariations) {
      const user = await this.firebaseAuthService.getUserByPhone(variant);
      results.push({
        variant,
        found: !!user,
        userId: user?.id,
        publicId: user?.publicId,
        isActive: user?.isActive,
        phoneInDb: user?.phone,
      });
    }
    
    return { phone, variations: results };
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
        verifyOtpLoginDto.firstName,
        verifyOtpLoginDto.lastName,
      );
      
      // Validate result is serializable before logging success
      // This catches any serialization errors that would otherwise happen after returning
      JSON.stringify(result);
      
      this.logger.log(`OTP login successful for phone: ${verifyOtpLoginDto.phone}`);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`OTP login failed: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token verification failed: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Get user by phone failed: ${errorMessage}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: JwtRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: JwtRequest, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.userId;
    return this.authService.updateProfile(userId, updateUserDto);
  }
}
