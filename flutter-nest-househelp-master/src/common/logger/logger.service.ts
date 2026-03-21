import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Production-ready structured logging service using Winston
 * Replaces console.log with proper log levels, rotation, and sensitive data filtering
 */
@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  // Fields that should be redacted from logs
  private sensitiveFields = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'api_key',
    'apiKey',
    'authorization',
    'credit_card',
    'creditCard',
    'cvv',
    'pin',
    'otp',
    'phone',
    'email',
    'address',
    'location',
    'latitude',
    'longitude',
    'lat',
    'lng',
    'razorpayPaymentId',
    'razorpayOrderId',
    'signature',
  ];

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: isProduction
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp(),
              winston.format.printf(
                ({ timestamp, level, message, context, ...meta }) => {
                  return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${
                    Object.keys(meta).length ? JSON.stringify(meta) : ''
                  }`;
                },
              ),
            ),
      }),
    ];

    // Add file transport in production (without rotation for now)
    if (isProduction) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/application.log',
          maxsize: 20971520, // 20MB
          maxFiles: 14,
          format: winston.format.json(),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          maxsize: 20971520, // 20MB
          maxFiles: 30,
          level: 'error',
          format: winston.format.json(),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      defaultMeta: { service: 'sevaq-househelp' },
      transports,
    });
  }

  /**
   * Redact sensitive fields from log data
   */
  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redactSensitiveData(item));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        this.sensitiveFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSensitiveData(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  /**
   * Format log message with context and metadata
   */
  private formatMessage(
    message: any,
    context?: string,
    meta?: any,
  ): { message: string; context?: string; meta: any } {
    let formattedMessage: string;

    if (typeof message === 'string') {
      formattedMessage = message;
    } else if (message instanceof Error) {
      formattedMessage = message.message;
      meta = { ...meta, stack: message.stack, name: message.name };
    } else {
      formattedMessage = JSON.stringify(message);
    }

    // Redact sensitive data from metadata
    const safeMeta = meta ? this.redactSensitiveData(meta) : {};

    return {
      message: formattedMessage,
      context,
      meta: safeMeta,
    };
  }

  log(message: any, context?: string, meta?: any) {
    const formatted = this.formatMessage(message, context, meta);
    this.logger.info(formatted.message, {
      context: formatted.context,
      ...formatted.meta,
    });
  }

  error(message: any, trace?: string, context?: string, meta?: any) {
    const formatted = this.formatMessage(message, context, meta);
    this.logger.error(formatted.message, {
      context: formatted.context,
      trace,
      ...formatted.meta,
    });
  }

  warn(message: any, context?: string, meta?: any) {
    const formatted = this.formatMessage(message, context, meta);
    this.logger.warn(formatted.message, {
      context: formatted.context,
      ...formatted.meta,
    });
  }

  debug(message: any, context?: string, meta?: any) {
    const formatted = this.formatMessage(message, context, meta);
    this.logger.debug(formatted.message, {
      context: formatted.context,
      ...formatted.meta,
    });
  }

  verbose(message: any, context?: string, meta?: any) {
    const formatted = this.formatMessage(message, context, meta);
    this.logger.verbose(formatted.message, {
      context: formatted.context,
      ...formatted.meta,
    });
  }

  // Additional utility methods for structured logging

  /**
   * Log HTTP request
   */
  logRequest(method: string, url: string, userId?: string, meta?: any) {
    this.log(`${method} ${url}`, 'HTTP', { userId, ...meta });
  }

  /**
   * Log HTTP response
   */
  logResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: any,
  ) {
    const level = statusCode >= 400 ? 'warn' : 'log';
    this[level](
      `${method} ${url} - ${statusCode} (${duration}ms)`,
      'HTTP',
      meta,
    );
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, meta?: any) {
    this.debug(`Query executed (${duration}ms)`, 'Database', {
      query,
      ...meta,
    });
  }

  /**
   * Log security event
   */
  logSecurity(event: string, userId?: string, meta?: any) {
    this.warn(`Security: ${event}`, 'Security', { userId, ...meta });
  }

  /**
   * Log business operation
   */
  logOperation(
    operation: string,
    status: 'success' | 'failure',
    duration: number,
    meta?: any,
  ) {
    const level = status === 'success' ? 'log' : 'error';
    this[level](
      `Operation: ${operation} - ${status} (${duration}ms)`,
      'Business',
      meta,
    );
  }
}
