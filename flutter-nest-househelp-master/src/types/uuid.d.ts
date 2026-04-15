declare module 'uuid';

declare namespace Express {
  export interface Request {
    idempotencyKey?: string;
  }
}
