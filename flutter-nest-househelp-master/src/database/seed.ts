import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedServiceAreas } from './seeds/seed-service-areas';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  
  const seedServiceAreas = new SeedServiceAreas();
  await seedServiceAreas.run(dataSource);
  
  await app.close();
}

bootstrap().catch(console.error);