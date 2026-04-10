/**
 * Database migration script
 * Run with: npm run migration:run
 * 
 * This script runs direct SQL migrations to update the database schema.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔄 Running database migrations...');
  
  try {
    // Check if notificationSent column exists
    const checkColumn = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking' AND column_name = 'notificationsent'
    `);
    
    if (checkColumn.length === 0) {
      console.log('📝 Adding notificationSent column to booking table...');
      await dataSource.query(`
        ALTER TABLE booking 
        ADD COLUMN IF NOT EXISTS "notificationSent" boolean DEFAULT false
      `);
      console.log('✅ Added notificationSent column');
    } else {
      console.log('✅ notificationSent column already exists');
    }
    
    console.log('✅ All migrations complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    throw error;
  }
  
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Migration script failed:', err);
  process.exit(1);
});