const { createConnection } = require('typeorm');
const config = require('./src/config/database.config');

async function checkTables() {
  try {
    const conn = await createConnection(config);
    const tables = await conn.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.map(t => t.table_name));

    // Check service_worker table structure
    const serviceWorkerTable = await conn.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'service_worker' AND table_schema = 'public'");
    console.log('service_worker columns:', serviceWorkerTable);

    conn.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();