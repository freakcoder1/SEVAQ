import { AppDataSource } from './src/data-source';

async function linkWorkersToCleaning() {
  await AppDataSource.initialize();
  console.log('=== LINKING WORKERS TO CLEANING SERVICE ===');
  
  // Get CLEANING service ID
  const cleaningService = await AppDataSource.query(
    'SELECT id FROM service WHERE category = $1',
    ['Cleaning']
  );
  
  if (cleaningService.length === 0) {
    console.log('CLEANING service not found!');
    await AppDataSource.destroy();
    return;
  }
  
  const cleaningServiceId = cleaningService[0].id;
  console.log(`CLEANING Service ID: ${cleaningServiceId}`);
  
  // Link workers 1,3,4,5,15 to CLEANING service
  const workerIds = [1, 3, 4, 5, 15];
  
  for (const workerId of workerIds) {
    // Check if already linked
    const existing = await AppDataSource.query(
      'SELECT * FROM service_worker WHERE "serviceId" = $1 AND "workerId" = $2',
      [cleaningServiceId, workerId]
    );
    
    if (existing.length === 0) {
      await AppDataSource.query(
        'INSERT INTO service_worker ("serviceId", "workerId") VALUES ($1, $2)',
        [cleaningServiceId, workerId]
      );
      console.log(`Linked worker ${workerId} to CLEANING service`);
    } else {
      console.log(`Worker ${workerId} already linked to CLEANING service`);
    }
  }
  
  // Verify
  const linkedWorkers = await AppDataSource.query(
    `SELECT w.id, u."firstName", u."lastName" 
     FROM service_worker sw 
     JOIN worker w ON sw."workerId" = w.id 
     JOIN "user" u ON w."userId" = u.id 
     WHERE sw."serviceId" = $1`,
    [cleaningServiceId]
  );
  
  console.log('Linked workers to CLEANING service:', linkedWorkers);
  
  await AppDataSource.destroy();
}

linkWorkersToCleaning().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
