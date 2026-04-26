const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'sevaq_db'
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get Cooking service ID
    const cookingResult = await client.query('SELECT id FROM service WHERE category = \$1', ['Cooking']);
    if (cookingResult.rows.length === 0) {
      console.log('Cooking service not found');
      return;
    }
    const cookingServiceId = cookingResult.rows[0].id;
    console.log('Cooking Service ID:', cookingServiceId);
    
    // Get Cleaning service ID
    const cleaningResult = await client.query('SELECT id FROM service WHERE category = \$1', ['Cleaning']);
    let cleaningServiceId = null;
    if (cleaningResult.rows.length > 0) {
      cleaningServiceId = cleaningResult.rows[0].id;
      console.log('Cleaning Service ID:', cleaningServiceId);
    }
    
    // Update old bookings for Cooking subscriptions
    const updateCookingResult = await client.query(`
      UPDATE booking 
      SET "serviceId" = \$1 
      WHERE "serviceId" IS NULL 
      AND "subscriptionId" IN (
        SELECT id FROM subscription 
        WHERE "customPlanData"::jsonb->>'serviceType' IN ('COOKING', 'COOK')
      )
      RETURNING id
    `, [cookingServiceId]);
    console.log('Updated Cooking bookings:', updateCookingResult.rowCount);
    
    // Update old bookings for Cleaning subscriptions
    if (cleaningServiceId) {
      const updateCleaningResult = await client.query(`
        UPDATE booking 
        SET "serviceId" = \$1 
        WHERE "serviceId" IS NULL 
        AND "subscriptionId" IN (
          SELECT id FROM subscription 
          WHERE "customPlanData"::jsonb->>'serviceType' = 'CLEANING'
        )
        RETURNING id
      `, [cleaningServiceId]);
      console.log('Updated Cleaning bookings:', updateCleaningResult.rowCount);
    }
    
    // Check remaining null bookings
    const remainingResult = await client.query('SELECT COUNT(*) as count FROM booking WHERE "serviceId" IS NULL');
    console.log('Remaining bookings with null serviceId:', remainingResult.rows[0].count);
    
    // Show the null booking IDs
    if (parseInt(remainingResult.rows[0].count) > 0) {
      const nullBookings = await client.query('SELECT id FROM booking WHERE "serviceId" IS NULL');
      console.log('Null booking IDs:', nullBookings.rows.map(r => r.id));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();