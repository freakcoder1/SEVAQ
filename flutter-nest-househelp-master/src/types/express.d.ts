import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * Idempotency Key provided by client for write operations
       * Extracted from Idempotency-Key header
       * UUID v4 format
       */
      idempotencyKey?: string;
      
      /**
       * Authenticated user object from JWT strategy
       */
      user?: any;
    }
  }
}
