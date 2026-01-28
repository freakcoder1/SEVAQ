import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log('🔍 Validating user:', email);
        console.log('🔑 Input password length:', pass ? pass.length : 'null/undefined');
        const user = await this.usersService.findOneByEmail(email);

        if (!user) {
            console.log('❌ User not found for email:', email);
            return null;
        }

        console.log('✅ User found:', user.email, 'Role:', user.role);
        console.log('🔒 Password hash from DB:', user.password.substring(0, 20) + '...');

        const isPasswordValid = await bcrypt.compare(pass, user.password);
        console.log('🔑 Password validation result:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('❌ Password mismatch - checking if hash was created with different method');
            // Test with common passwords for debugging
            const testPasswords = ['password123', 'worker123', 'admin123'];
            for (const testPass of testPasswords) {
                const testResult = await bcrypt.compare(testPass, user.password);
                if (testResult) {
                    console.log(`🔍 Hash matches test password: ${testPass}`);
                    break;
                }
            }
        }
        
        if (user && isPasswordValid) {
            const { password, ...result } = user;
            console.log('✅ Authentication successful for:', email);
            return result;
        }
        
        console.log('❌ Authentication failed for:', email);
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        };
    }

    async signup(createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return this.login(user);
    }

    async updateProfile(userId: number, updateUserDto: UpdateUserDto) {
        return this.usersService.update(userId, updateUserDto);
    }
}
