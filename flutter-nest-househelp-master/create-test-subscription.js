require('dotenv').config();
const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'admin',
  database: 'househelp',
});

async function createTestSubscription() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');
    
    // Create a new subscription for user 18
    const result = await dataSource.query(`
      INSERT INTO subscriptions ("userId", "serviceProfileId", status, "monthlyPriceSnapshot", "startDate", "createdAt", "updatedAt")
      VALUES (18, 1, 'ACTIVE', 8000, CURRENT_DATE, NOW(), NOW())
      RETURNING id
    `);
    console.log('Created new subscription:', result[0]);

    // Verify the subscription
    const sub = await dataSource.query(
      "SELECT id, \"userId\", status, \"monthlyPriceSnapshot\", \"startDate\", \"assignedWorkerId\" FROM subscriptions WHERE \"userId\" = 18"
    );
    console.log('Current subscription:', sub[0]);

    await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createTestSubscription();
