import { Injectable, UnauthorizedException, Logger, ConflictException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { WorkersService } from '../workers/workers.service';
import { ServicesService } from '../services/services.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateWorkerRegistrationDto } from './dto/create-worker-registration.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private workersService: WorkersService,
    private servicesService: ServicesService,
    private jwtService: JwtService,
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

  async login(user: any) {
    // Use publicId (UUID) instead of internal numeric id for JWT
    const payload = {
      email: user.email,
      sub: user.publicId, // Use UUID for JWT subject
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
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
      user.id.toString(),
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
