const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/sevaq_db',
});
async function run() {
  await client.connect();
  try {
    // Rename orderid to orderId (case-sensitive)
    await client.query('ALTER TABLE payment RENAME COLUMN orderid TO "orderId"');
    console.log('Column renamed from "orderid" to "orderId" successfully');
  } catch (e) {
    // Column might already be renamed, check if it exists
    try {
      await client.query('ALTER TABLE payment RENAME COLUMN "orderId" TO "orderId"');
      console.log('Column already named "orderId"');
    } catch (e2) {
      console.log('Column already exists: ' + e.message);
    }
  }
  await client.end();
}
run();
