const { DataSource } = require('typeorm');
require('dotenv').config();

// Database connection configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: ['flutter-nest-househelp-master/src/**/*.entity.ts'],
});

async function deleteUnnecessaryServices() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Categories to keep
    const allowedCategories = ['Cleaning', 'Cooking'];

    // Get all services
    const services = await queryRunner.manager.query('SELECT id, name, category FROM service');
    console.log(`Total services found: ${services.length}`);

    // Filter services to delete
    const servicesToDelete = services.filter(service => !allowedCategories.includes(service.category));
    console.log(`Services to delete: ${servicesToDelete.length}`);

    if (servicesToDelete.length > 0) {
      const serviceIdsToDelete = servicesToDelete.map(service => service.id);
      console.log('Deleting services:', servicesToDelete.map(service => `${service.name} (${service.category})`));

      // Delete services
      await queryRunner.manager.query('DELETE FROM service WHERE id = ANY($1)', [serviceIdsToDelete]);
      console.log(`Successfully deleted ${servicesToDelete.length} services`);
    } else {
      console.log('No unnecessary services to delete');
    }

    // Verify remaining services
    const remainingServices = await queryRunner.manager.query('SELECT id, name, category FROM service');
    console.log('\nRemaining services:');
    remainingServices.forEach(service => {
      console.log(`${service.id}. ${service.name} (${service.category})`);
    });

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');

  } catch (error) {
    console.error('Error deleting services:', error);
  }
}

deleteUnnecessaryServices();
