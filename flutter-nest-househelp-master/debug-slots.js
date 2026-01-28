const axios = require('axios');

async function main() {
    try {
        // Login as test user
        const loginResponse = await axios.post('http://127.0.0.1:45357/auth/login', {
            email: 'test.user1@example.com',
            password: 'password123'
        });
        
        const accessToken = loginResponse.data.access_token;
        
        console.log('🔐 Logged in successfully');
        
        // Debug function to check slots and attempt assignment
        await debugSlotsAndAssignment(accessToken);
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

async function debugSlotsAndAssignment(token) {
    console.log('\n🎯 Debugging Slot Creation and Assignment Process');
    
    const workerId = 1;
    console.log(`\n🔍 Checking slots for Worker ${workerId}`);
    
    try {
        // Get worker's slots
        const response = await axios.get(`http://127.0.0.1:45357/workers/${workerId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const worker = response.data;
        
        console.log(`✅ Worker found: ${worker.name}`);
        console.log(`🎯 Worker service: ${worker.service.name}`);
        
        // Get all slots for worker
        const slotsResponse = await axios.get(`http://127.0.0.1:45357/slots?workerId=${workerId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const slots = slotsResponse.data;
        const availableSlots = slots.filter(slot => !slot.isBooked);
        
        console.log(`\n📅 Slots available for Worker ${workerId} (${slots.length} total):`);
        availableSlots.forEach(slot => {
            console.log(`   - ${new Date(slot.startTime).toLocaleString()} - ${new Date(slot.endTime).toLocaleString()}`);
        });
        
        // Create a test service request to see if assignment works
        console.log('\n📝 Trying to create a service request');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const serviceRequestData = {
            serviceId: worker.serviceId,
            date: tomorrow.toISOString().split('T')[0],
            timeWindow: 'morning',
            priceSnapshot: 300,
            location: {
                lat: 28.582, 
                lng: 77.437, 
                address: '123 Main Street, New Delhi' 
            }
        };
        
        console.log(`📅 Date: ${serviceRequestData.date}`);
        console.log(`⏰ Time Window: ${serviceRequestData.timeWindow}`);
        console.log(`📍 Location: ${serviceRequestData.location.address}`);
        
        // Create service request
        const requestResponse = await axios.post('http://127.0.0.1:45357/service-requests', 
            serviceRequestData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        console.log(`✅ Service request created: ${requestResponse.data.publicId}`);
        
        // Check assignment status
        const requestId = requestResponse.data.id;
        const statusResponse = await axios.get(`http://127.0.0.1:45357/service-requests/${requestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`📋 Assignment status: ${statusResponse.data.assignmentStatus}`);
        
    } catch (error) {
        console.error('❌ Error during debug:', error.response?.data || error.message);
    }
}

main().catch(err => {
    console.error('❌', err);
    process.exit(1);
});
