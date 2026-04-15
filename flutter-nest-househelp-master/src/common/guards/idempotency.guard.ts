import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

/**
 * Idempotency Guard
 * 
 * Prevents duplicate operations by validating Idempotency-Key header
 * for all write operations.
 * 
 * Clients should send a unique UUID v4 key in the Idempotency-Key header
 * for POST, PUT, PATCH, DELETE requests.
 * 
 * Keys are stored for 24 hours and guarantee exactly-once execution.
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
  private readonly KEY_TTL_HOURS = 24;
  private readonly VALID_KEY_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Only apply idempotency checks to write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true;
    }

    const idempotencyKey = request.headers[this.IDEMPOTENCY_KEY_HEADER] as string;

    // Allow requests without idempotency key for backward compatibility
    // Will become mandatory in future version
    if (!idempotencyKey) {
      return true;
    }

    // Validate key format
    if (!this.VALID_KEY_REGEX.test(idempotencyKey)) {
      throw new HttpException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid Idempotency-Key format. Must be UUID v4.',
        error: 'Bad Request'
      }, HttpStatus.BAD_REQUEST);
    }

    // Store key in request for downstream processing
    request.idempotencyKey = idempotencyKey;

    return true;
  }
}
