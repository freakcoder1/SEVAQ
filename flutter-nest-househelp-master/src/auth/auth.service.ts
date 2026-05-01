import { Injectable, UnauthorizedException, Logger, ConflictException, Inject, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { WorkersService } from '../workers/workers.service';
import { ServicesService } from '../services/services.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateWorkerRegistrationDto } from './dto/create-worker-registration.dto';
import { UserRole } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Request } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private workersService: WorkersService,
    private servicesService: ServicesService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    this.logger.debug(`Validating user: ${email}`);

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      this.logger.warn(`User not found for email: ${email}`);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      return null;
    }

    const { password, ...result } = user;
    this.logger.debug(`Authentication successful for: ${email}`);
    return result;
  }

  async login(user: any, userAgent?: string, ipAddress?: string) {
    // Use publicId (UUID) instead of internal numeric id for JWT
    const payload = {
      email: user.email,
      sub: user.publicId, // Use UUID for JWT subject
      role: user.role,
    };

    // Generate access token (short-lived, e.g., 1 hour)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    // Generate refresh token (long-lived, e.g., 30 days)
    const refreshToken = new RefreshToken();
    refreshToken.userId = user.id;
    refreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    refreshToken.userAgent = userAgent ?? '';
    refreshToken.ipAddress = ipAddress ?? '';
    await this.refreshTokenRepository.save(refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      user: {
        id: user.id, // Return numeric database id
        publicId: user.publicId, // Also return publicId for reference
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenStr: string) {
    // Find the refresh token in the database
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenStr },
      relations: ['user'],
    });

    if (!refreshToken || !refreshToken.isValid()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = refreshToken.user;
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const payload = {
      email: user.email,
      sub: user.publicId,
      role: user.role,
    };
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    // Rotate refresh token: revoke old one, create new one
    refreshToken.isRevoked = true;
    await this.refreshTokenRepository.save(refreshToken);

    const newRefreshToken = new RefreshToken();
    newRefreshToken.userId = user.id;
    newRefreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepository.save(newRefreshToken);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken.token,
    };
  }

  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.login(user);
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    return this.usersService.update(userId, updateUserDto);
  }

  /**
   * Register a new worker (creates both user account and worker profile)
   */
  async registerWorker(dto: CreateWorkerRegistrationDto) {
    this.logger.log(`Registering new worker: ${dto.email}, phone: ${dto.phone}`);

    // Check if email already exists
    const existingUser = await this.usersService.findOneByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await this.usersService.findOneByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Create user first
    const createUserDto: CreateUserDto = {
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      address: dto.address,
      role: UserRole.WORKER,
      latitude: dto.serviceArea?.latitude,
      longitude: dto.serviceArea?.longitude,
    };

    const user = await this.usersService.create(createUserDto);
    this.logger.log(`User created with ID: ${user.id}`);

    // Map service categories to service IDs
    const serviceIds: number[] = [];
    if (dto.serviceCategories && dto.serviceCategories.length > 0) {
      for (const category of dto.serviceCategories) {
        const service = await this.servicesService.findByCategory(category);
        if (service) {
          serviceIds.push(service.id);
        }
      }
    }

    // Create worker profile
    const worker = await this.workersService.create(
      user.id,
      dto.bio || '',
      serviceIds,
      dto.serviceArea?.latitude || 0,
      dto.serviceArea?.longitude || 0,
    );
    this.logger.log(`Worker profile created with ID: ${worker.id}`);

    // Return login response with worker info
    return this.login(user);
  }
}
