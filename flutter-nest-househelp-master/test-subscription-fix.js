const axios = require('axios');

async function testSubscriptionFix() {
    try {
        // Test creating a subscription with location
        const createResponse = await axios.post('http://127.0.0.1:45357/api/subscriptions', {
            serviceProfileId: 1,
            frequency: 'DAILY',
            timeWindowStart: '08:00',
            timeWindowEnd: '12:00',
            startDate: '2024-01-29',
            location: {
                lat: 28.5804,
                lng: 77.4393,
                address: '123 Main Street, Delhi'
            },
            customDays: [1, 3, 5]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTYwMzc2OSwiZXhwIjoxNzcyMTk1NzY5fQ.jp7kgDT_cViHbsE5D2-uUxXywsHJx74awkmWyuCdr20'
            }
        });

        console.log('✅ Subscription created successfully:');
        console.log(createResponse.data);
        
        // Test getting subscriptions for user
        const getResponse = await axios.get('http://localhost:45357/api/subscriptions/user/1', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTYwMzc2OSwiZXhwIjoxNzcyMTk1NzY5fQ.jp7kgDT_cViHbsE5D2-uUxXywsHJx74awkmWyuCdr20'
            }
        });

        console.log('\n✅ User subscriptions:');
        console.log(getResponse.data);

    } catch (error) {
        console.error('❌ Error testing subscription fix:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testSubscriptionFix();
