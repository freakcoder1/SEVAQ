import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WorkersService } from './workers/workers.service';

async function runMigration() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const workersService = app.get(WorkersService);

  console.log('Updating existing workers with default location data...');
  await workersService.updateExistingWorkersWithDefaultLocation();
  console.log('Migration completed successfully!');

  await app.close();
}

runMigration().catch(console.error);
