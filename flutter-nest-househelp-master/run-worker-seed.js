require('dotenv').config();

const { DataSource } = require('typeorm');
const { seedWorkersWithSlots } = require('./dist/src/database/seed-workers-with-slots');

async function runWorkerSeed() {
  try {
    console.log('🚀 Starting worker seeding process...');

    // Create database connection
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'sevaq_db',
      entities: [
        'dist/**/*.entity.js'
      ],
      synchronize: true,
      logging: false
    });

    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Run the seeding function
    await seedWorkersWithSlots(dataSource);

    console.log('🎉 Worker seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during worker seeding:', error);
    process.exit(1);
  }
}

// Run the seeding process
runWorkerSeed();