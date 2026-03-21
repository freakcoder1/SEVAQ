const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'admin',
  port: 5432,
});

async function addColumn() {
  try {
    // Add the worker_assignment_failed column (TypeORM will use snake_case naming)
    await pool.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN worker_assignment_failed BOOLEAN DEFAULT false
    `);
    console.log('Column worker_assignment_failed added successfully');
  } catch (err) {
    if (err.code === '42701') {  // duplicate_column
      console.log('Column already exists');
    } else {
      console.error('Error:', err.message);
    }
  } finally {
    await pool.end();
  }
}

addColumn();
