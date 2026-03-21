/**
 * Migration: Add Assignment Type Columns
 * 
 * SEVAQ Assignment System - Database Schema Update
 * 
 * Adds columns to support:
 * - assignmentType: PROVISIONAL (one-time) or PRIMARY (subscriptions)
 * - assignmentExpiresAt: Timeout for provisional assignments
 * - assignmentStartsAt: Start time for primary assignments
 * 
 * Run with: cd flutter-nest-househelp-master && node migrations/add-assignment-type-columns.js
 */

const { DataSource } = require('typeorm');
const path = require('path');

// Load environment and data source
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'househelp',
  entities: [path.join(__dirname, '..', 'src', '**', '*.entity.{ts,js}')],
  synchronize: false, // We want to run migrations manually
  logging: true,
});

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add Assignment Type Columns');
    console.log('='.repeat(60));
    
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Add assignmentType column
    console.log('\n📝 Adding assignmentType column...');
    try {
      await queryRunner.query(`
        ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentType VARCHAR(20) DEFAULT NULL;
      `);
      console.log('✅ assignmentType column added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  assignmentType column already exists');
      } else {
        throw error;
      }
    }
    
    // Add assignmentExpiresAt column
    console.log('\n📝 Adding assignmentExpiresAt column...');
    try {
      await queryRunner.query(`
        ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentExpiresAt TIMESTAMP DEFAULT NULL;
      `);
      console.log('✅ assignmentExpiresAt column added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  assignmentExpiresAt column already exists');
      } else {
        throw error;
      }
    }
    
    // Add assignmentStartsAt column
    console.log('\n📝 Adding assignmentStartsAt column...');
    try {
      await queryRunner.query(`
        ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentStartsAt TIMESTAMP DEFAULT NULL;
      `);
      console.log('✅ assignmentStartsAt column added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  assignmentStartsAt column already exists');
      } else {
        throw error;
      }
    }
    
    // Verify columns were added
    console.log('\n🔍 Verifying columns...');
    const result = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'booking' 
      AND column_name IN ('assignmentType', 'assignmentExpiresAt', 'assignmentStartsAt')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Assignment Type Columns:');
    console.table(result);
    
    await queryRunner.release();
    await AppDataSource.destroy();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('\n📌 Summary:');
    console.log('   - assignmentType: VARCHAR(20) - stores PROVISIONAL or PRIMARY');
    console.log('   - assignmentExpiresAt: TIMESTAMP - provisional assignment timeout');
    console.log('   - assignmentStartsAt: TIMESTAMP - primary assignment start time');
    console.log('\n💡 Note: Remember to update AssignmentState enum in entity to include:');
    console.log('   - PROVISIONAL_ASSIGNED');
    console.log('   - PROVISIONAL_EXPIRED');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
