/**
 * Railway Deployment Seed Script
 * Run this after the build to seed the database
 * 
 * Usage: node dist/database/seed.js
 * Or via Railway: railway run node dist/database/seed.js
 */

async function main() {
  // Import after build - this file should be compiled from seed.ts
  const { DataSource } = require('typeorm');
  const { SeedServiceAreas } = require('./seeds/seed-service-areas');
  const { SeedGreaterNoidaAreas } = require('./seeds/seed-greater-noida');
  const { EnhancedWorkerSeeding } = require('./seeds/enhanced-worker-seeding');
  const { SeedCustomers } = require('./seeds/seed-customers');
  const { SeedServiceProfiles } = require('./seeds/seed-service-profiles');
  const { SeedServices } = require('./seeds/seed-services');

  console.log('🌱 Starting database seeding...');

  // Create a basic data source using environment variables
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432'),
    username: process.env.DB_USERNAME || process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'railway',
    synchronize: false, // Don't sync during seed
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    // Run seeders in order
    const seedServiceAreas = new SeedServiceAreas();
    await seedServiceAreas.run(dataSource);
    console.log('✅ Service areas seeded');

    const seedGreaterNoida = new SeedGreaterNoidaAreas();
    await seedGreaterNoida.run(dataSource);
    console.log('✅ Greater Noida areas seeded');

    const seedServiceProfiles = new SeedServiceProfiles();
    await seedServiceProfiles.run(dataSource);
    console.log('✅ Service profiles seeded');

    const seedServices = new SeedServices();
    await seedServices.run(dataSource);
    console.log('✅ Services seeded');

    const seedWorkers = new EnhancedWorkerSeeding();
    await seedWorkers.run(dataSource);
    console.log('✅ Workers seeded');

    const seedCustomers = new SeedCustomers();
    await seedCustomers.run(dataSource);
    console.log('✅ Customers seeded');

    console.log('✅ Database seeding complete!');
    
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    process.exit(0);
  }
}

main();
