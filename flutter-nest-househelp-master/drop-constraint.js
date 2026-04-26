const { Client } = require('pg');

async function dropConstraint() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'sevaq_db',
    ssl: false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Drop the unique constraint
    await client.query(`ALTER TABLE "payment" DROP CONSTRAINT IF EXISTS "REL_25f06021d5e959312ce6fabe3c"`);
    console.log('✅ Dropped unique constraint REL_25f06021d5e959312ce6fabe3c');
    
    // Verify the constraint is gone
    const res = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'payment' 
      AND constraint_name = 'REL_25f06021d5e959312ce6fabe3c'
    `);
    
    if (res.rows.length === 0) {
      console.log('✅ Constraint successfully removed');
    } else {
      console.log('❌ Constraint still exists');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

dropConstraint();
