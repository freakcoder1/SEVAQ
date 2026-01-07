import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, ExceptionFilter, ArgumentsHost, Catch } from '@nestjs/common';
import { Response } from 'express';

// Global exception filter for better error responses
@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.status || 500;
    const message = exception.message || 'Internal server error';

    this.logger.error(`Error: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  console.log('Application is starting...');
  const app = await NestFactory.create(AppModule);
  
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
  
  // Enable CORS with detailed configuration
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  // Global exception filter for better error responses
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  const port = process.env.PORT ?? 45357;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Application is listening on http://0.0.0.0:${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
