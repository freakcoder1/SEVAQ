import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './database/seed';
import {
  Logger,
  ValidationPipe,
  ExceptionFilter,
  ArgumentsHost,
  Catch,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

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

let BOOTSTRAP_RUNNING = false;

async function bootstrap() {
  // SINGLE INSTANCE GUARD: Prevent dual bootstrap
  if (BOOTSTRAP_RUNNING) {
    winstonLogger.warn('⚠️  Bootstrap already in progress, skipping duplicate execution');
    return;
  }
  BOOTSTRAP_RUNNING = true;

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
  // Read allowed origins from CORS_ORIGINS env var (comma-separated)
  const corsOriginsEnv =
    process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8080';
  const allowedOrigins = corsOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
    maxAge: 86400, // Cache preflight for 24 hours
  });

  // Global interceptor to strip password fields from all API responses
  app.useGlobalInterceptors(new SerializeInterceptor());

  // Global exception filter for better error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Production Security Headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
    ieNoOpen: true,
    permittedCrossDomainPolicies: true,
    hidePoweredBy: true,
  }));

  // Prevent clickjacking
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('X-Frame-Options', 'DENY');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // Swagger API Documentation (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SEVAQ API')
      .setDescription('SEVAQ House Help Service API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Runtime Environment Validation
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnv = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingEnv.length > 0) {
    winstonLogger.error('Missing required environment variables', { missing: missingEnv });
    process.exit(1);
  }

  const port = process.env.PORT ?? 45357;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}/api`);

  winstonLogger.log('info', 'Application started', {
    port,
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: '/api',
    timestamp: new Date().toISOString(),
  });

  // Graceful Shutdown Handlers
  process.on('SIGTERM', async () => {
    winstonLogger.log('info', 'SIGTERM received, starting graceful shutdown');
    await app.close();
    winstonLogger.log('info', 'Application shutdown completed successfully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    winstonLogger.log('info', 'SIGINT received, starting graceful shutdown');
    await app.close();
    winstonLogger.log('info', 'Application shutdown completed successfully');
    process.exit(0);
  });

  process.on('unhandledRejection', (reason, promise) => {
    winstonLogger.error('Unhandled Rejection at:', {
      promise: promise.toString(),
      reason: reason instanceof Error ? reason.message : reason
    });
  });

  process.on('uncaughtException', (error) => {
    winstonLogger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}
bootstrap();
