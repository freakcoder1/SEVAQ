/**
 * JWT User Payload Interface
 * Matches the payload structure from jwt.strategy.ts
 */
export interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
  workerId?: number;
}

/**
 * Typed Request interface for controllers using JwtAuthGuard
 * Extends Express Request with typed user property
 */
export interface JwtRequest extends Request {
  user: JwtUserPayload;
}
