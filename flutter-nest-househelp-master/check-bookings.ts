import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'postgres.railway.internal',
  port: 5432,
  username: 'postgres',
  password: 'XYZsmjqpLzpwLMxDqebMOsNNNTkxthIE',
  database: 'railway',
  synchronize: false,
});

dataSource.initialize()
  .then(async () => {
    console.log('Connected to local Postgres!');
    
    // Get pending/confirmed bookings
    const bookings = await dataSource.query(`
      SELECT b.id, b.customer_name as "customerName", b.booking_date as "bookingDate", 
             b.status, b.assigned_worker_id as "assignedWorkerId", s.name as service_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.status IN ('pending', 'confirmed')
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    console.log('=== Pending/Confirmed Bookings ===');
    console.log(JSON.stringify(bookings, null, 2));
    
    // Get workers named Sumit or CP Pandey
    const workers = await dataSource.query(`
      SELECT id, name, phone, status, service_type as "serviceType", location
      FROM users 
      WHERE role = 'worker' AND (name ILIKE '%sumit%' OR name ILIKE '%cp%' OR name ILIKE '%pandey%')
    `);
    console.log('=== Workers (Sumit/CP Pandey) ===');
    console.log(JSON.stringify(workers, null, 2));
    
    await dataSource.destroy();
  })
  .catch(e => console.error('DB Error:', e.message));
