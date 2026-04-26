const { Client } = require('pg');

// Database configuration from .env
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'sevaq_db',
});

async function updateSubscription() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Subscription publicId to update
    const subscriptionPublicId = 'c0bd4467-b3d9-423d-b365-308e855b1302';

    // New customPlanData with correct fields matching user's payment (1 person, FULL_DAY)
    // From log: calculatedPrice: 1800 for 1 person, FULL_DAY
    const updatedCustomPlanData = {
      serviceType: 'COOKING',
      scopeDefinition: 'Custom plan',
      publicId: 'custom',
      numberOfPeople: 1,
      mealPlan: 'FULL_DAY', // FULL_DAY = all meals (matches user's selection)
      calculatedPrice: 1800, // Actual price paid by user (from payment log)
    };

    // Update the subscription (use correct DB column names)
    // custom_plan_data (from @Column name: 'custom_plan_data')
    // monthlyPriceSnapshot (camelCase, no name specified in entity)
    // publicId (camelCase, no name specified in entity)
    const result = await client.query(
      `UPDATE subscriptions 
       SET "custom_plan_data" = $1, "monthlyPriceSnapshot" = $2
       WHERE "publicId" = $3
       RETURNING id, "publicId", "custom_plan_data", "monthlyPriceSnapshot"`,
      [JSON.stringify(updatedCustomPlanData), 1800, subscriptionPublicId] // Use correct calculatedPrice 1800
    );

    if (result.rows.length > 0) {
      console.log('Successfully updated subscription:');
      console.log('ID:', result.rows[0].id);
      console.log('Public ID:', result.rows[0].public_id);
      console.log('Updated customPlanData:', result.rows[0].custom_plan_data);
      console.log('Updated monthlyPriceSnapshot:', result.rows[0].monthly_price_snapshot);
    } else {
      console.log('Subscription not found with publicId:', subscriptionPublicId);
    }
  } catch (err) {
    console.error('Error updating subscription:', err);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

updateSubscription();