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

async function fixSubscription() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');
    
    // Fix subscription ID 163 - set startDate to Feb 5, 2026 and price to 8000
    await dataSource.query(`
      UPDATE subscriptions 
      SET "startDate" = '2026-02-05', 
          "monthlyPriceSnapshot" = 8000,
          status = 'ACTIVE'
      WHERE id = 163
    `);
    console.log('Updated subscription 163 with startDate: 2026-02-05, price: 8000');
    
    // Verify the update
    const sub = await dataSource.query(
      "SELECT id, \"userId\", status, \"monthlyPriceSnapshot\", \"startDate\", \"assignedWorkerId\" FROM subscriptions WHERE id = 163"
    );
    console.log('Updated subscription:', sub[0]);
    
    await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixSubscription();
