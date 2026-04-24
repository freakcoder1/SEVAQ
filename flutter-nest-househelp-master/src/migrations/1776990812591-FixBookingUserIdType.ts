import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class FixBookingUserIdType1776990812591 implements MigrationInterface {
  name = 'FixBookingUserIdType1776990812591';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔍 Checking booking.userId column type...');
    
    // Check current column type
    const columnInfo = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking' AND column_name = 'userId'
    `);
    
    if (columnInfo.length === 0) {
      console.log('⚠️  booking.userId column not found, skipping migration');
      return;
    }
    
    const currentType = columnInfo[0].data_type;
    console.log(`   Current type: ${currentType}`);
    
    if (currentType === 'integer') {
      console.log('📝 Migrating booking.userId from integer to uuid...');
      
      // Check if table has data
      const countResult = await queryRunner.query(`
        SELECT COUNT(*) as count FROM "booking"
      `);
      const bookingCount = parseInt(countResult[0].count);
      
      if (bookingCount > 0) {
        console.log(`   ⚠️  Booking table has ${bookingCount} rows. Performing safe data migration...`);
        
        // Step 1: Add temporary UUID column
        await queryRunner.query(`
          ALTER TABLE "booking" ADD COLUMN "userId_uuid" uuid
        `);
        console.log('   ✅ Added temporary userId_uuid column');
        
        // Step 2: Migrate data by joining with user table
        await queryRunner.query(`
          UPDATE "booking" b
          SET "userId_uuid" = u."publicId"
          FROM "user" u
          WHERE b."userId" = u.id
        `);
        console.log('   ✅ Migrated user IDs to UUIDs');
        
        // Step 3: Drop old FK constraint
        await queryRunner.query(`
          ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "FK_336b3f4a235460dc93645fbf222"
        `);
        console.log('   ✅ Dropped old FK constraint');
        
        // Step 4: Drop old integer column
        await queryRunner.query(`
          ALTER TABLE "booking" DROP COLUMN "userId"
        `);
        console.log('   ✅ Dropped old userId column');
        
        // Step 5: Rename temp column
        await queryRunner.query(`
          ALTER TABLE "booking" RENAME COLUMN "userId_uuid" TO "userId"
        `);
        console.log('   ✅ Renamed userId_uuid to userId');
        
        // Step 6: Add new FK referencing user(publicId)
        await queryRunner.query(`
          ALTER TABLE "booking" 
          ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222" 
          FOREIGN KEY ("userId") REFERENCES "user"("publicId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        console.log('   ✅ Added new FK constraint referencing user(publicId)');
      } else {
        console.log('   ℹ️  Booking table is empty. Directly altering column type...');
        
        // Simple type change for empty table
        await queryRunner.query(`
          ALTER TABLE "booking" 
          ALTER COLUMN "userId" TYPE uuid USING "userId"::text::uuid
        `);
        console.log('   ✅ Changed column type to uuid');
        
        // Update FK
        await queryRunner.query(`
          ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "FK_336b3f4a235460dc93645fbf222"
        `);
        await queryRunner.query(`
          ALTER TABLE "booking" 
          ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222" 
          FOREIGN KEY ("userId") REFERENCES "user"("publicId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        console.log('   ✅ Updated FK to reference user(publicId)');
      }
      
      console.log('✅ booking.userId migration complete');
    } else {
      console.log('✅ booking.userId already migrated (type: ' + currentType + ')');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is not easily reversible due to data type change
    // In production, we would need to handle data conversion back to integer
    throw new Error('This migration cannot be reverted automatically');
  }
}
