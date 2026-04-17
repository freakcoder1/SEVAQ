import {
  Injectable,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check for existing email
    const existingEmail = await this.findOneByEmail(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check for existing phone if provided
    if (createUserDto.phone) {
      const existingPhone = await this.findOneByPhone(createUserDto.phone);
      if (existingPhone) {
        throw new ConflictException('User with this phone number already exists');
      }
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      publicId: uuidv4(),
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      // Handle unique constraint violations from database
      if (error.code === '23505') {
        // PostgreSQL unique violation code
        if (error.detail?.includes('email')) {
          throw new ConflictException('User with this email already exists');
        }
        if (error.detail?.includes('phone')) {
          throw new ConflictException('User with this phone number already exists');
        }
        throw new ConflictException('User with these credentials already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Create user within a transaction - for OTP flow to prevent race conditions
   */
  async createWithTransaction(
    createUserDto: CreateUserDto,
    phone: string,
  ): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use pessimistic lock to prevent concurrent creation
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { phone },
        lock: { mode: 'pessimistic_write' },
      });

      if (existingUser) {
        await queryRunner.rollbackTransaction();
        return existingUser;
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      const user = queryRunner.manager.create(User, {
        ...createUserDto,
        password: hashedPassword,
        publicId: uuidv4(),
      });

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code === '23505') {
        // Unique violation - user was created by another request
        const existingUser = await this.findOneByPhone(phone);
        if (existingUser) {
          return existingUser;
        }
        throw new ConflictException('User creation conflict');
      }

      throw new InternalServerErrorException('Failed to create user');
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findAllPaginated(
    skip: number,
    take: number,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[User[], number]> {
    const order: any = {};
    order[sortBy || 'createdAt'] = sortOrder;

    return this.usersRepository.findAndCount({
      skip,
      take,
      order,
    });
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ publicId: id });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOneByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phone });
  }

  async update(publicId: string, updateUserDto: UpdateUserDto) {
    // Find user by publicId first
    const user = await this.findOne(publicId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Update using the numeric id
    return this.usersRepository.update(user.id, updateUserDto);
  }

  async updateFcmToken(userId: number | string, fcmToken: string): Promise<void> {
    // Validate FCM token format
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length === 0) {
      throw new ForbiddenException('FCM token cannot be empty');
    }

    if (fcmToken.length > 512) {
      throw new ForbiddenException('FCM token exceeds maximum allowed length');
    }

    // Handle both numeric ID and UUID publicId
    let user: User | null;
    
    if (typeof userId === 'number' || !isNaN(Number(userId))) {
      // Numeric internal ID
      user = await this.usersRepository.findOneBy({ id: Number(userId) });
    } else {
      // UUID publicId
      user = await this.findOne(userId);
    }
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      // Update using the numeric id
      await this.usersRepository.update(user.id, {
        fcmToken: fcmToken.trim(),
        updatedAt: new Date()
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to save FCM token');
    }
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    if (user.role === 'admin') {
      throw new ForbiddenException('Cannot delete admin users');
    }
    return this.usersRepository.delete(id);
  }
}
