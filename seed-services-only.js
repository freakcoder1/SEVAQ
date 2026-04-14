const { Client } = require('pg');
const { randomUUID } = require('crypto');

async function seedServices() {
    console.log('🔌 Seeding only Cooking Help and Home Cleaning services...');
    
    const dbUrl = "postgresql://postgres:XYZsmjqpLzpwLMxDqebMOsNNNTkxthIE@crossover.proxy.rlwy.net:54076/railway";
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Insert Cooking Help service
        await client.query(`
            INSERT INTO "service" ("publicId", name, description, "basePrice", category, "isAvailable", "createdAt", "updatedAt")
            VALUES 
            ($1, 'Cooking Help', 'Professional cooking assistance for home meals', 350, 'home', true, NOW(), NOW()),
            ($2, 'Home Cleaning', 'Complete home cleaning and sanitation service', 400, 'home', true, NOW(), NOW())
            ON CONFLICT DO NOTHING;
        `, [randomUUID(), randomUUID()]);

        console.log('✅ Successfully inserted Cooking Help & Home Cleaning services');

        // Verify inserted services
        const result = await client.query(`SELECT id, "publicId", name, description, "basePrice" FROM "service"`);
        
        console.log('\n📋 Current services in database:');
        result.rows.forEach(s => {
            console.log(`  ✅ #${s.id} ${s.name} - ₹${s.basePrice}`);
        });

        console.log('\n✅ Service seeding completed successfully');

    } catch (err) {
        console.error('❌ Error seeding services:', err.message);
        console.error(err.stack);
    } finally {
        await client.end();
    }
}

seedServices();
