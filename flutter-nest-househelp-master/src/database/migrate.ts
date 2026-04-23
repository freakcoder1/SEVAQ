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
    // Migration 1: Check if notificationSent column exists
    const checkNotificationSent = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'booking' AND column_name = 'notificationsent'
    `);
    
    if (checkNotificationSent.length === 0) {
      console.log('📝 Adding notificationSent column to booking table...');
      await dataSource.query(`
        ALTER TABLE booking
        ADD COLUMN IF NOT EXISTS "notificationSent" boolean DEFAULT false
      `);
      console.log('✅ Added notificationSent column');
    } else {
      console.log('✅ notificationSent column already exists');
    }

    // Migration 2: Fix booking.userId type from integer to uuid
    console.log('🔍 Checking booking.userId column type...');
    const checkUserIdType = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'booking' AND column_name = 'userId'
    `);
    
    if (checkUserIdType.length > 0 && checkUserIdType[0].data_type === 'integer') {
      console.log('📝 Migrating booking.userId from integer to uuid...');
      
      // Check if booking table has any data
      const countResult = await dataSource.query(`
        SELECT COUNT(*) as count FROM "booking"
      `);
      const bookingCount = parseInt(countResult[0].count);
      
      if (bookingCount > 0) {
        console.log(`   ⚠️  Booking table has ${bookingCount} rows. Performing safe data migration...`);
        
        // Step 1: Add temporary UUID column
        await dataSource.query(`
          ALTER TABLE "booking" ADD COLUMN "userId_uuid" uuid
        `);
        console.log('   ✅ Added temporary userId_uuid column');
        
        // Step 2: Update new column with user publicIds by joining with user table
        await dataSource.query(`
          UPDATE "booking" b
          SET "userId_uuid" = u."publicId"
          FROM "user" u
          WHERE b."userId" = u.id
        `);
        console.log('   ✅ Migrated user IDs to UUIDs');
        
        // Step 3: Drop the old FK constraint
        await dataSource.query(`
          ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "FK_336b3f4a235460dc93645fbf222"
        `);
        console.log('   ✅ Dropped old FK constraint');
        
        // Step 4: Drop the old integer column
        await dataSource.query(`
          ALTER TABLE "booking" DROP COLUMN "userId"
        `);
        console.log('   ✅ Dropped old userId column');
        
        // Step 5: Rename the temporary column
        await dataSource.query(`
          ALTER TABLE "booking" RENAME COLUMN "userId_uuid" TO "userId"
        `);
        console.log('   ✅ Renamed userId_uuid to userId');
        
        // Step 6: Add new FK referencing user(publicId)
        await dataSource.query(`
          ALTER TABLE "booking"
          ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222"
          FOREIGN KEY ("userId") REFERENCES "user"("publicId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        console.log('   ✅ Added new FK constraint referencing user(publicId)');
      } else {
        console.log('   ℹ️  Booking table is empty. Directly altering column type...');
        
        // Simple type change for empty table
        await dataSource.query(`
          ALTER TABLE "booking"
          ALTER COLUMN "userId" TYPE uuid USING "userId"::text::uuid
        `);
        console.log('   ✅ Changed column type to uuid');
        
        // Update FK to reference publicId
        await dataSource.query(`
          ALTER TABLE "booking"
          DROP CONSTRAINT IF EXISTS "FK_336b3f4a235460dc93645fbf222"
        `);
        await dataSource.query(`
          ALTER TABLE "booking"
          ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222"
          FOREIGN KEY ("userId") REFERENCES "user"("publicId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        console.log('   ✅ Updated FK to reference user(publicId)');
      }
      
      console.log('✅ booking.userId migration complete');
    } else if (checkUserIdType.length > 0) {
      console.log('✅ booking.userId already migrated (type:', checkUserIdType[0].data_type + ')');
    } else {
      console.log('⚠️  booking.userId column not found');
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