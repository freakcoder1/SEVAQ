import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Application is starting...');
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 45357, '0.0.0.0');
  console.log('Application is listening on port', process.env.PORT ?? 45357);
}
bootstrap();
