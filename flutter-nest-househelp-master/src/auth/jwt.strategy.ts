import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'uuid';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('Missing required environment variable: JWT_SECRET');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        console.log('🔍 DEBUG: JWT Strategy validate called with payload:', JSON.stringify(payload, null, 2));

        // Ensure userId is treated as a UUID string
        const userId = payload.sub.toString();
        console.log('🔍 DEBUG: JWT Strategy extracted userId:', userId);

        // Validate that the userId is a valid UUID
        if (!validate(userId)) {
            console.log('🔍 DEBUG: JWT Strategy validation failed - invalid UUID format');
            throw new Error('Invalid user ID format: Expected UUID');
        }

        console.log('🔍 DEBUG: JWT Strategy validation successful for user:', userId);
        return { userId, email: payload.email, role: payload.role };
    }
}
