import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
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
}
