const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

async function checkWorkerLocations() {
    try {
        console.log('✅ Database connection successful');

        const userLat = 28.5805083;
        const userLng = 77.4392111;
        const radius = 5; // km

        // Get workers and their locations
        const workersResult = await pool.query(`
            SELECT w.id, u."firstName", u.latitude, u.longitude, w."isActive", w."isAvailable"
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            WHERE w."isActive" = true AND w."isAvailable" = true
            ORDER BY w.id
        `);

        console.log('=== All Active Workers ===');
        workersResult.rows.forEach(row => {
            if (row.latitude && row.longitude && !isNaN(row.latitude) && !isNaN(row.longitude)) {
                const distance = calculateDistance(userLat, userLng, parseFloat(row.latitude), parseFloat(row.longitude));
                const isWithinRadius = distance <= radius;
                console.log(`Worker ${row.id}: ${row.firstName} (${parseFloat(row.latitude).toFixed(4)}, ${parseFloat(row.longitude).toFixed(4)}) - ${distance.toFixed(2)}km - ${isWithinRadius ? '✅ Within' : '❌ Outside'}`);
            } else {
                console.log(`Worker ${row.id}: ${row.firstName} - ❌ No location data`);
            }
        });

        // Check which workers have service 1
        const serviceWorkersResult = await pool.query(`
            SELECT w.id, u."firstName", u.latitude, u.longitude
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            JOIN "service_worker" sw ON w.id = sw."worker_id"
            WHERE sw."service_id" = $1 AND w."isActive" = true AND w."isAvailable" = true
            ORDER BY w.id
        `, [1]);

        console.log('\n=== Workers Offering Service 1 ===');
        serviceWorkersResult.rows.forEach(row => {
            if (row.latitude && row.longitude && !isNaN(row.latitude) && !isNaN(row.longitude)) {
                const distance = calculateDistance(userLat, userLng, parseFloat(row.latitude), parseFloat(row.longitude));
                const isWithinRadius = distance <= radius;
                console.log(`Worker ${row.id}: ${row.firstName} (${parseFloat(row.latitude).toFixed(4)}, ${parseFloat(row.longitude).toFixed(4)}) - ${distance.toFixed(2)}km - ${isWithinRadius ? '✅ Within' : '❌ Outside'}`);
            } else {
                console.log(`Worker ${row.id}: ${row.firstName} - ❌ No location data`);
            }
        });

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkWorkerLocations();
