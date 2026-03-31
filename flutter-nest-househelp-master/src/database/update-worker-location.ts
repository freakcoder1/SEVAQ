import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function updateWorkers() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🔄 Updating worker locations...');

    // Update Worker 17
    await dataSource.query(`
      UPDATE workers 
      SET "serviceAreaId" = '67856b26-d323-4ead-95f2-1be8fa361704',
          "serviceRadiusKm" = 25,
          latitude = 28.58,
          longitude = 77.43,
          "currentLat" = 28.58,
          "currentLng" = 77.43
      WHERE id = 17
    `);
    console.log('✅ Worker 17 (CP Pandey) updated');

    // Update Worker 21
    await dataSource.query(`
      UPDATE workers 
      SET "serviceAreaId" = '67856b26-d323-4ead-95f2-1be8fa361704',
          "serviceRadiusKm" = 25,
          latitude = 28.58,
          longitude = 77.43,
          "currentLat" = 28.58,
          "currentLng" = 77.43
      WHERE id = 21
    `);
    console.log('✅ Worker 21 (Sumit) updated');

    console.log('✅ All workers now in Greater Noida West service area!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

updateWorkers();