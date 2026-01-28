const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'admin',
  port: 5432,
});

async function getServices() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT id, name, category, "basePrice" FROM service');
    console.log('Services found:', res.rows.length);
    res.rows.forEach((service, index) => {
      console.log(`${index + 1}. ID: ${service.id}, Name: ${service.name}, Category: ${service.category}, Base Price: ${service.basePrice}`);
    });
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getServices();