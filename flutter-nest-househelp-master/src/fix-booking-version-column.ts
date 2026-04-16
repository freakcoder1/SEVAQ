import { AppDataSource } from './database/data-source';

async function fixBookingVersionColumn() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source initialized');

    // Add missing version column to booking table
    await AppDataSource.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
    `);

    console.log('✅ Successfully added version column to booking table');
    
    // Verify column exists
    const result = await AppDataSource.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'booking' AND column_name = 'version';
    `);
    
    console.log('Column verification:', result);

    await AppDataSource.destroy();
    console.log('✅ Fix completed successfully');
  } catch (error) {
    console.error('❌ Error applying fix:', error);
    process.exit(1);
  }
}

fixBookingVersionColumn();
