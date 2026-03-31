import { DataSource } from 'typeorm';
import 'reflect-metadata';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'containers-us-west-99.railway.app',
  port: parseInt(process.env.DB_PORT || '5994'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'WnZtNmh2WjJoUWhvcEVTMEVyME11ckRmYjB6MmZqMmU',
  database: process.env.DB_DATABASE || 'railway',
  ssl: true,
  entities: ['src/**/*.entity.ts']
});

async function main() {
  await dataSource.initialize();
  
  const userRepo = dataSource.getRepository('user');
  const bookingRepo = dataSource.getRepository('booking');
  
  const user = await userRepo.findOne({ 
    where: { email: 'aryanjaiswal791@gmail.com' }
  });
  
  if (user) {
    console.log('User found - ID:', user.id, 'Public ID:', user.publicId);
    
    const bookings = await bookingRepo.find({
      where: { user: { id: user.id } },
      relations: ['worker', 'service']
    });
    
    console.log('Bookings count:', bookings.length);
    bookings.forEach(b => {
      console.log('- ID:', b.publicId);
      console.log('  Status:', b.status);
      console.log('  Start:', b.startTime);
      console.log('  End:', b.endTime);
    });
  } else {
    console.log('User not found!');
  }
  
  await dataSource.destroy();
}

main().catch(console.error);