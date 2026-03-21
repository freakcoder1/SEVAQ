const { createConnection } = require('typeorm');
const { v4: uuidv4 } = require('uuid');
const { Service } = require('./flutter-nest-househelp-master/src/services/entities/service.entity');

async function run() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin',
      database: 'sevaq_db',
      entities: [Service],
      synchronize: false,
    });

    const serviceRepository = connection.getRepository(Service);
    
    // Check if Maid service exists
    const existingMaidService = await serviceRepository.findOne({ 
      where: { category: 'Maid' } 
    });
    
    if (!existingMaidService) {
      const maidService = serviceRepository.create({
        publicId: uuidv4(),
        name: 'Maid Service',
        category: 'Maid',
        basePrice: 600.00,
        description: 'Professional maid service for your home',
        isAvailable: true,
        whatWillHappen: ['Helper will arrive and confirm task', 'Work done with standard tools'],
        whatWillNotHappen: ['No upselling without approval', 'No extra work added silently'],
        ifSomethingGoesWrong: 'Sevaq will replace or refund immediately',
      });
      
      await serviceRepository.save(maidService);
      console.log('✅ Maid service created successfully');
    } else {
      console.log('ℹ️  Maid service already exists');
    }
    
    await connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

run();
