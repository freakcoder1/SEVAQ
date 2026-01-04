import { Controller, Post, Body, UseGuards, Request, Get, HttpException, HttpStatus, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() req) {
        console.log('Login request received:', req);
        // For simplicity, we'll validate manually here or use a LocalGuard
        // Let's assume req body has email and password
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            console.log('Invalid credentials for email:', req.email);
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }
        console.log('Login successful for user:', user.email);
        return this.authService.login(user);
    }

    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        console.log('Signup request received:', createUserDto);
        const result = await this.authService.signup(createUserDto);
        console.log('Signup successful for user:', createUserDto.email);
        return result;
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
