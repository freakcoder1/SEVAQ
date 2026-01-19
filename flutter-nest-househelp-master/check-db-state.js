const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'sevaq_db'
});

async function checkDatabaseState() {
  console.log('=== CHECKING DATABASE STATE ===\n');

  try {
    await client.connect();

    // Check tables
    console.log('1. Checking tables...');
    const tablesQuery = `
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    const tables = await client.query(tablesQuery);
    console.log('Tables:', tables.rows.map(r => r.tablename));

    // Check workers
    console.log('\n2. Checking workers...');
    const workersQuery = `SELECT COUNT(*) as count FROM worker`;
    const workers = await client.query(workersQuery);
    console.log(`Total workers: ${workers.rows[0].count}`);

    if (workers.rows[0].count > 0) {
      const workersData = await client.query(`
        SELECT w.id, u."firstName", u."lastName", w."isActive", w."isAvailable"
        FROM worker w
        JOIN "user" u ON w."userId" = u.id
        LIMIT 5
      `);
      console.log('Sample workers:');
      workersData.rows.forEach(w => {
        console.log(`  ${w.id}: ${w.firstName} ${w.lastName} - Active: ${w.isActive}, Available: ${w.isAvailable}`);
      });
    }

    // Check services
    console.log('\n3. Checking services...');
    const servicesQuery = `SELECT COUNT(*) as count FROM service`;
    const services = await client.query(servicesQuery);
    console.log(`Total services: ${services.rows[0].count}`);

    if (services.rows[0].count > 0) {
      const servicesData = await client.query(`SELECT id, name, category FROM service LIMIT 5`);
      console.log('Sample services:');
      servicesData.rows.forEach(s => {
        console.log(`  ${s.id}: ${s.name} - Category: ${s.category}`);
      });
    }

    // Check worker_service associations
    console.log('\n4. Checking worker-service associations...');
    const assocQuery = `SELECT COUNT(*) as count FROM worker_service`;
    const assoc = await client.query(assocQuery);
    console.log(`Total associations: ${assoc.rows[0].count}`);

    if (assoc.rows[0].count > 0) {
      const assocData = await client.query(`
        SELECT ws.worker_id, ws.service_id, s.name as service_name, u."firstName", u."lastName"
        FROM worker_service ws
        JOIN service s ON ws.service_id = s.id
        JOIN worker w ON ws.worker_id = w.id
        JOIN "user" u ON w."userId" = u.id
        LIMIT 10
      `);
      console.log('Sample associations:');
      assocData.rows.forEach(a => {
        console.log(`  Worker: ${a.firstName} ${a.lastName} (${a.worker_id}) -> Service: ${a.service_name} (${a.service_id})`);
      });
    }

    // Check if workers have services via API-like query
    console.log('\n5. Checking workers with their services...');
    const workersWithServices = await client.query(`
      SELECT w.id, u."firstName", u."lastName",
             COUNT(ws.service_id) as service_count
      FROM worker w
      JOIN "user" u ON w."userId" = u.id
      LEFT JOIN worker_service ws ON w.id = ws.worker_id
      GROUP BY w.id, u."firstName", u."lastName"
      ORDER BY service_count DESC
      LIMIT 10
    `);
    console.log('Workers and their service counts:');
    workersWithServices.rows.forEach(w => {
      console.log(`  ${w.firstName} ${w.lastName}: ${w.service_count} services`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDatabaseState().catch(console.error);