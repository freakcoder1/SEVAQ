import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedServiceAreas } from './seeds/seed-service-areas';
import { SeedGreaterNoidaAreas } from './seeds/seed-greater-noida';
import { EnhancedWorkerSeeding } from './seeds/enhanced-worker-seeding';
import { SeedCustomers } from './seeds/seed-customers';
import { DataSource } from 'typeorm';
import { ServiceProfilesService } from '../service-profiles/service-profiles.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting database seeding...');

  const seedServiceAreas = new SeedServiceAreas();
  await seedServiceAreas.run(dataSource);

  const seedGreaterNoida = new SeedGreaterNoidaAreas();
  await seedGreaterNoida.run(dataSource);

  // Use enhanced worker seeding instead of basic worker seeding
  const seedWorkers = new EnhancedWorkerSeeding();
  await seedWorkers.run(dataSource);

  const seedCustomers = new SeedCustomers();
  await seedCustomers.run(dataSource);

  // Seed service profiles
  console.log('🌱 Seeding service profiles...');
  const serviceProfilesService = app.get(ServiceProfilesService);
  await serviceProfilesService.onModuleInit();
  console.log('✅ Service profiles seeded');

  console.log('✅ Database seeding complete!');

  await app.close();
}

bootstrap().catch(console.error);
