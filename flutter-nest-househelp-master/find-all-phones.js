// Find all phone numbers in the database
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'househelp',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all users with their phone numbers
    const result = await client.query(`
      SELECT id, "publicId", "firstName", "lastName", phone, email, role, "createdAt"
      FROM "user"
      WHERE phone IS NOT NULL
      ORDER BY id
    `);

    console.log(`\n=== All Users with Phone Numbers (${result.rows.length} total) ===`);
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.firstName} ${row.lastName}, Phone: ${row.phone}, Email: ${row.email}, Role: ${row.role}, Created: ${row.createdAt}`);
    });

    // Also check worker table
    const workersResult = await client.query(`
      SELECT w.id, w."userId", w.name, w.phone, u."firstName", u."lastName", u.phone as userPhone
      FROM "worker" w
      LEFT JOIN "user" u ON w."userId" = u.id
      ORDER BY w.id
    `);

    console.log(`\n\n=== All Workers (${workersResult.rows.length} total) ===`);
    workersResult.rows.forEach(row => {
      console.log(`Worker ID: ${row.id}, Name: ${row.name}, Worker Phone: ${row.phone}, User: ${row.firstName} ${row.lastName}, User Phone: ${row.userPhone}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
