import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'uuid';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('Missing required environment variable: JWT_SECRET');
        }
        super({
            jwtFromRequest: (req: Request) => {
                console.log('🔍 DEBUG: JWT Strategy - Authorization header:', req.headers.authorization);
                return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
            },
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        console.log('🔍 DEBUG: JWT Strategy validate called with payload:', JSON.stringify(payload, null, 2));

        // Extract user ID from payload - support both numeric and UUID formats
        // IMPORTANT: Handle case where payload.sub might be missing or invalid
        let userId: string;
        
        if (payload.sub) {
            userId = payload.sub.toString();
        } else if (payload.userId) {
            userId = payload.userId.toString();
        } else {
            console.log('🔍 DEBUG: JWT Strategy validation failed - no user ID in payload');
            throw new Error('Invalid token: Missing user ID');
        }
        
        console.log('🔍 DEBUG: JWT Strategy extracted userId:', userId);

        // Validate that the userId is either a valid UUID or a numeric string
        const isNumeric = /^\d+$/.test(userId);
        const isUUID = validate(userId);
        
        if (!isNumeric && !isUUID) {
            console.log('🔍 DEBUG: JWT Strategy validation failed - invalid ID format');
            throw new Error('Invalid user ID format: Expected numeric or UUID');
        }

        console.log('🔍 DEBUG: JWT Strategy validation successful for user:', userId);
        return { userId, email: payload.email, role: payload.role };
    }
}
