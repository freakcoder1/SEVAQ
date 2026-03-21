const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/sevaq_db',
});
async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE payment ADD COLUMN IF NOT EXISTS orderId VARCHAR(255)');
    console.log('Column orderId added successfully');
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
