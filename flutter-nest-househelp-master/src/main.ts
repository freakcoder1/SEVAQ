import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  Logger,
  ValidationPipe,
  ExceptionFilter,
  ArgumentsHost,
  Catch,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

// Configure Winston logger
const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Global exception filter for better error responses
@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = winstonLogger;

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Internal server error';

    // Log error with Winston (structured logging)
    this.logger.error('HTTP Exception', {
      statusCode: status,
      message: message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      stack: exception.stack,
    });

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const responseMessage =
      isProduction && status === 500 ? 'Internal server error' : message;

    response.status(status).json({
      statusCode: status,
      message: responseMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

async function bootstrap() {
  // Ensure logs directory exists
  const fs = require('fs');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe for better error handling
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS with production-safe configuration
  const corsOrigin =
    process.env.CORS_ORIGIN ||
    (process.env.NODE_ENV === 'production' ? false : true);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global exception filter for better error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ?? 45357;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}/api`);

  winstonLogger.log('info', 'Application started', {
    port,
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: '/api',
    timestamp: new Date().toISOString(),
  });
}
bootstrap();
