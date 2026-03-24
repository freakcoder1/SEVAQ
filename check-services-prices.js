const { createConnection } = require('typeorm');
const { Service } = require('./flutter-nest-househelp-master/src/services/entities/service.entity');

async function checkServicesPrices() {
  try {
    // Create connection to database
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'househelp',
      entities: [Service],
      synchronize: false,
      logging: false,
    });

    console.log('✅ Connected to database');

    // Fetch all services
    const services = await connection.getRepository(Service).find();

    console.log(`\n📋 Found ${services.length} services:`);
    services.forEach(service => {
      console.log(`\nService ID: ${service.id}`);
      console.log(`  Name: ${service.name}`);
      console.log(`  Category: ${service.category}`);
      console.log(`  Base Price: ${service.basePrice}`);
      console.log(`  Description: ${service.description}`);
    });

    await connection.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkServicesPrices();
