const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'sevaq_db'
});

async function fixServiceIdType() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const sql = `
      ALTER TABLE service_requests 
      ALTER COLUMN "serviceId" TYPE integer 
      USING "serviceId"::text::integer;
    `;

    const result = await client.query(sql);
    console.log('ServiceId type updated successfully', result);

  } catch (error) {
    console.error('Error updating serviceId type:', error);
  } finally {
    await client.end();
    console.log('Disconnected from PostgreSQL');
  }
}

fixServiceIdType();