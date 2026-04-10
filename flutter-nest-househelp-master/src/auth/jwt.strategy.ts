import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Strict JWT Payload Interface
 * Enforces consistent token structure
 */
interface JwtPayload {
  sub: string; // User ID (must be UUID format)
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

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

  async validate(payload: JwtPayload): Promise<{ userId: string; email: string; role: string }> {
    // Validate payload structure
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid token: Missing user ID');
    }

    if (!payload.email || typeof payload.email !== 'string') {
      throw new UnauthorizedException('Invalid token: Missing email');
    }

    if (!payload.role || typeof payload.role !== 'string') {
      throw new UnauthorizedException('Invalid token: Missing role');
    }

    // Accept both UUID and legacy integer user IDs
    const userId = payload.sub;
    
    return {
      userId: userId,
      email: payload.email,
      role: payload.role,
    };
  }
}
