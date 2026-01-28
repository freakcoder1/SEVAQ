const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'sevaq_user',
  password: process.env.DB_PASSWORD || 'sevaq_password',
  database: process.env.DB_NAME || 'sevaq_db',
});

async function addPublicIdColumn() {
  try {
    console.log('Adding publicId column to user table...');
    
    // Add column without NOT NULL constraint
    await pool.query(`
      ALTER TABLE "user" 
      ADD COLUMN "publicId" UUID
    `);
    
    // Update existing users with UUIDs
    const result = await pool.query('SELECT id FROM "user"');
    for (const row of result.rows) {
      const uuid = require('crypto').randomUUID();
      await pool.query(
        'UPDATE "user" SET "publicId" = $1 WHERE id = $2',
        [uuid, row.id]
      );
    }
    
    console.log('Existing users updated with UUIDs');
    
    // Add NOT NULL constraint and unique index
    await pool.query(`
      ALTER TABLE "user" 
      ALTER COLUMN "publicId" SET NOT NULL
    `);
    
    await pool.query(`
      ALTER TABLE "user" 
      ADD CONSTRAINT "UQ_user_publicId" UNIQUE ("publicId")
    `);
    
    console.log('publicId column added successfully!');
    
  } catch (error) {
    if (error.code === '42701') { // Duplicate column
      console.log('publicId column already exists');
    } else {
      console.error('Error adding publicId column:', error);
    }
  } finally {
    await pool.end();
  }
}

addPublicIdColumn();
