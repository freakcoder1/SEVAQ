const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function deleteUnnecessaryServices() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    // Categories to keep
    const allowedCategories = ['Cleaning', 'Cooking'];

    // Get all services
    const servicesResult = await client.query('SELECT id, name, category FROM service');
    const services = servicesResult.rows;
    console.log(`Total services found: ${services.length}`);

    // Filter services to delete
    const servicesToDelete = services.filter(service => !allowedCategories.includes(service.category));
    console.log(`Services to delete: ${servicesToDelete.length}`);

    if (servicesToDelete.length > 0) {
      const serviceIdsToDelete = servicesToDelete.map(service => service.id);
      console.log('Deleting services:', servicesToDelete.map(service => `${service.name} (${service.category})`));

      // Delete services
      await client.query('DELETE FROM service WHERE id = ANY($1)', [serviceIdsToDelete]);
      console.log(`Successfully deleted ${servicesToDelete.length} services`);
    } else {
      console.log('No unnecessary services to delete');
    }

    // Verify remaining services
    const remainingResult = await client.query('SELECT id, name, category FROM service');
    const remainingServices = remainingResult.rows;
    console.log('\nRemaining services:');
    remainingServices.forEach(service => {
      console.log(`${service.id}. ${service.name} (${service.category})`);
    });

    client.release();
    await pool.end();
    console.log('\nDatabase connection closed');

  } catch (error) {
    console.error('Error deleting services:', error);
  }
}

deleteUnnecessaryServices();
