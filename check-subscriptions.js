const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'sevaq_db',
});

ds.initialize().then(async () => {
  try {
    console.log('=== ALL SUBSCRIPTIONS ===');
    const subs = await ds.query(`
      SELECT s.id, s."publicId", s."userId", s."serviceProfileId", s.status, s."isPaid", 
             sp.name as service_profile_name, u."firstName", u."lastName", u."publicId" as user_public_id
      FROM subscriptions s
      LEFT JOIN service_profiles sp ON s."serviceProfileId" = sp.id
      LEFT JOIN "user" u ON s."userId" = u."publicId"
      ORDER BY s.id DESC
    `);
    console.log(JSON.stringify(subs, null, 2));
    
    console.log('\n=== USERS ===');
    const users = await ds.query(`SELECT id, "publicId", "firstName", "lastName", phone FROM "user" LIMIT 10`);
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await ds.destroy();
  }
}).catch(e => console.error('Connection error:', e.message));
