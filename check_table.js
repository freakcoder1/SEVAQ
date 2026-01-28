const { createConnection } = require('typeorm');
const config = require('./flutter-nest-househelp-master/src/config/database.config');

async function checkTable() {
  try {
    const conn = await createConnection(config);
    const result = await conn.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'service_worker'
      ORDER BY ordinal_position;
    `);
    console.log('service_worker table columns:');
    console.log(result);
    await conn.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTable();