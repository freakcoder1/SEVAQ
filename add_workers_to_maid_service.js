const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',  // Correct database!
  password: 'postgres',
  port: 5432,
});

async function addWorkersToMaidService() {
  const client = await pool.connect();
  
  try {
    // Check service_worker table structure
    console.log('=== service_worker table columns ===');
    const tableInfo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service_worker'
    `);
    console.log('Columns:', JSON.stringify(tableInfo.rows, null, 2));

    // Get workers that work on service 1 (Home Cleaning)
    console.log('\n=== Workers for service 1 (Home Cleaning) ===');
    const homeCleaningWorkers = await client.query(`
      SELECT w.* FROM worker w
      JOIN service_worker sw ON w.id = sw.worker_id
      WHERE sw.service_id = 1
    `);
    console.log('Home Cleaning Workers:', JSON.stringify(homeCleaningWorkers.rows, null, 2));

    // Get current workers for service 13 (Maid Service)
    console.log('\n=== Current workers for service 13 (Maid Service) ===');
    const maidServiceWorkers = await client.query(`
      SELECT w.* FROM worker w
      JOIN service_worker sw ON w.id = sw.worker_id
      WHERE sw.service_id = 13
    `);
    console.log('Maid Service Workers:', JSON.stringify(maidServiceWorkers.rows, null, 2));

    // If there are workers for Home Cleaning but none for Maid Service, add them
    if (homeCleaningWorkers.rows.length > 0 && maidServiceWorkers.rows.length === 0) {
      console.log('\n=== Adding workers to Maid Service ===');
      
      for (const worker of homeCleaningWorkers.rows) {
        await client.query(`
          INSERT INTO service_worker (worker_id, service_id)
          VALUES ($1, 13)
        `, [worker.id]);
        console.log(`Added worker ${worker.id} to Maid Service`);
      }
      
      console.log('\n=== Verifying workers were added ===');
      const newMaidWorkers = await client.query(`
        SELECT w.* FROM worker w
        JOIN service_worker sw ON w.id = sw.worker_id
        WHERE sw.service_id = 13
      `);
      console.log('Maid Service Workers after add:', JSON.stringify(newMaidWorkers.rows, null, 2));
    } else if (maidServiceWorkers.rows.length > 0) {
      console.log('\n=== Workers already exist for Maid Service ===');
    } else {
      console.log('\n=== No workers found for Home Cleaning to copy ===');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addWorkersToMaidService();
