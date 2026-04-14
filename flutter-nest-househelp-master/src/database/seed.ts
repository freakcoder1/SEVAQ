import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedServiceAreas } from './seeds/seed-service-areas';
import { SeedGreaterNoidaAreas } from './seeds/seed-greater-noida';
import { EnhancedWorkerSeeding } from './seeds/enhanced-worker-seeding';
import { SeedCustomers } from './seeds/seed-customers';
import { SeedServiceProfiles } from './seeds/seed-service-profiles';
import { SeedServices } from './seeds/seed-services';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting database seeding...');

  const seedServiceAreas = new SeedServiceAreas();
  await seedServiceAreas.run(dataSource);

  const seedGreaterNoida = new SeedGreaterNoidaAreas();
  await seedGreaterNoida.run(dataSource);

  // Seed service profiles before workers
  const seedServiceProfiles = new SeedServiceProfiles();
  await seedServiceProfiles.run(dataSource);

  // Seed services
  const seedServices = new SeedServices();
  await seedServices.run(dataSource);

  // Use enhanced worker seeding instead of basic worker seeding
  const seedWorkers = new EnhancedWorkerSeeding();
  await seedWorkers.run(dataSource);

  const seedCustomers = new SeedCustomers();
  await seedCustomers.run(dataSource);

  console.log('✅ Database seeding complete!');

  // Update special workers to be in service area
  console.log('🔄 Updating worker locations for Greater Noida West...');
  
  // Check if workers table exists before running update (fixes race condition on fresh deployments)
  const tableExists = await dataSource.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'workers'
    );
  `);

  if (tableExists[0].exists) {
    await dataSource.query(`
      UPDATE workers
      SET "serviceAreaId" = '67856b26-d323-4ead-95f2-1be8fa361704',
          "serviceRadiusKm" = 25,
          latitude = 28.58,
          longitude = 77.43,
          "currentLat" = 28.58,
          "currentLng" = 77.43
      WHERE id IN (17, 21)
    `);
    console.log('✅ Workers 17 and 21 updated with Greater Noida West service area');
  } else {
    console.log('⚠️ Workers table does not exist yet, skipping worker location update (will run on next deployment)');
  }

  await app.close();
}

bootstrap().catch(console.error);
