const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTYwMzc2OSwiZXhwIjoxNzcyMTk1NzY5fQ.jp7kgDT_cViHbsE5D2-uUxXywsHJx74awkmWyuCdr20';

async function checkSubscription() {
    try {
        console.log('Checking user subscriptions...');
        
        const response = await axios.get('http://127.0.0.1:45357/api/subscriptions/user/18', {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        
        console.log('Subscriptions found:', response.data.length);
        
        response.data.forEach(sub => {
            console.log(`\nSubscription ID: ${sub.id}`);
            console.log('Location:', JSON.stringify(sub.location));
            console.log('Service Profile ID:', sub.serviceProfileId);
        });
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkSubscription();
