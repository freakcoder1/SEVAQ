const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

async function debugAvailability() {
    try {
        console.log('=== DEBUG: Availability Check ===');
        
        // Parameters from the API call
        const serviceId = 1;
        const userLat = 28.5805083;
        const userLng = 77.4392111;
        const radius = 5;
        const date = '2026-01-20';
        const timeWindow = 'afternoon';
        
        // Step 1: Find workers offering this service
        console.log('\n1. Finding workers offering Service', serviceId);
        const workersResult = await pool.query(`
            SELECT w.id, u."firstName"
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            JOIN "service_worker" sw ON w.id = sw."worker_id"
            WHERE sw."service_id" = $1 AND w."isActive" = true AND w."isAvailable" = true
        `, [serviceId]);
        
        console.log(`Workers found: ${workersResult.rows.length}`);
        workersResult.rows.forEach(row => {
            console.log(`  Worker ${row.id}: ${row.firstName}`);
        });
        
        // Step 2: Check worker locations
        console.log('\n2. Checking worker locations (radius:', radius, 'km)');
        const locationResult = await pool.query(`
            SELECT w.id, u."firstName", u.latitude, u.longitude
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            JOIN "service_worker" sw ON w.id = sw."worker_id"
            WHERE sw."service_id" = $1 AND w."isActive" = true AND w."isAvailable" = true
        `, [serviceId]);
        
        // Simple distance calculation
        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = deg2rad(lat2 - lat1);
            const dLon = deg2rad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                     Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }
        
        function deg2rad(deg) {
            return deg * (Math.PI / 180);
        }
        
        const nearbyWorkers = [];
        locationResult.rows.forEach(row => {
            const distance = calculateDistance(userLat, userLng, parseFloat(row.latitude), parseFloat(row.longitude));
            const isWithinRadius = distance <= radius;
            
            if (isWithinRadius) {
                nearbyWorkers.push(row.id);
                console.log(`  Worker ${row.id}: ${row.firstName} (${distance.toFixed(2)}km) - ✅ Within radius`);
            } else {
                console.log(`  Worker ${row.id}: ${row.firstName} (${distance.toFixed(2)}km) - ❌ Outside radius`);
            }
        });
        
        // Step 3: Check slots availability for nearby workers
        console.log('\n3. Checking slot availability');
        const timeWindowStart = 12; // afternoon
        const timeWindowEnd = 17;
        
        for (const workerId of nearbyWorkers) {
            const slotsResult = await pool.query(`
                SELECT id, "startTime", "endTime", "isBooked"
                FROM "slot" 
                WHERE "workerId" = $1 AND DATE("startTime") = $2
                ORDER BY "startTime"
            `, [workerId, date]);
            
            console.log(`\n  Worker ${workerId} slots:`);
            slotsResult.rows.forEach(slot => {
                const slotStart = new Date(slot.startTime);
                const slotEnd = new Date(slot.endTime);
                
                const slotStartHour = slotStart.getHours();
                const slotEndHour = slotEnd.getHours();
                
                const isWithinWindow = slotStartHour >= timeWindowStart && slotEndHour <= timeWindowEnd;
                
                console.log(`    Slot ${slot.id}: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`);
                console.log(`      Booked: ${slot.isBooked ? '✅' : '❌'}, Window match: ${isWithinWindow ? '✅' : '❌'}`);
            });
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugAvailability();
