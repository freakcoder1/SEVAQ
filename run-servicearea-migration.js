const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'admin',
  port: 5432,
});

async function runMigration() {
  console.log('Connecting to PostgreSQL...');
  
  try {
    const client = await pool.connect();
    
    console.log('Connected successfully!');
    
    // Check if columns exist and add them if they don't
    const columnsToAdd = [
      { name: 'minLat', type: 'decimal(10,7)' },
      { name: 'maxLat', type: 'decimal(10,7)' },
      { name: 'minLng', type: 'decimal(10,7)' },
      { name: 'maxLng', type: 'decimal(10,7)' },
      { name: 'coverageMap', type: 'json' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        const query = `ALTER TABLE service_area ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}`;
        console.log(`Executing: ${query}`);
        await client.query(query);
        console.log('Success');
      } catch (error) {
        console.log(`Error adding column ${column.name}:`, error.message);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
