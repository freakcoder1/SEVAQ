import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import { AddTestCustomers } from './src/database/seeds/add-test-customers';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const dataSource = app.get(DataSource);
    const seedService = new AddTestCustomers();
    
    await seedService.run(dataSource);
    
    console.log('Test customers added successfully!');
  } catch (error) {
    console.error('Error adding test customers:', error);
  } finally {
    await app.close();
  }
}

bootstrap();