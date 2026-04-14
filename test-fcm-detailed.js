const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function testFCMToken() {
  try {
    console.log('🔍 Testing FCM token validity...\n');

    // Load environment variables from .env file
    const envPath = path.join(__dirname, 'flutter-nest-househelp-master', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && key.startsWith('FIREBASE_SERVICE_ACCOUNT')) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    // Get service account from environment
    const serviceAccountRaw = envVars.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountRaw) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable not found');
      return;
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch (e) {
      // Fallback: try to fix escaped newlines before parsing
      try {
        serviceAccount = JSON.parse(serviceAccountRaw.replace(/\\n/g, '\n'));
      } catch (e2) {
        console.error(`❌ Failed to parse service account JSON: ${e2.message}`);
        return;
      }
    }

    console.log('✅ Service account loaded');
    console.log('🔑 Private key length:', serviceAccount.private_key.length);
    console.log('🔑 Private key starts with:', serviceAccount.private_key.substring(0, 50));

    // Clean private key - use the same logic as backend
    if (serviceAccount.private_key) {
      // Handle any level of newline escaping
      let key = serviceAccount.private_key;
      while (key.includes('\\n')) {
        key = key.replace(/\\n/g, '\n');
      }

      // Ensure the key starts and ends properly with correct line breaks
      key = key.trim();

      // Remove any existing BEGIN/END markers to avoid duplication
      key = key.replace(/-----BEGIN PRIVATE KEY-----/g, '');
      key = key.replace(/-----END PRIVATE KEY-----/g, '');

      // Add proper PEM formatting with exactly one newline after BEGIN and before END
      key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;

      // Normalize line endings to just \n (Unix-style)
      key = key.replace(/\r\n/g, '\n');

      serviceAccount.private_key = key;
    }

    console.log('🔑 Formatted private key length:', serviceAccount.private_key.length);
    console.log('🔑 Formatted private key starts with:', serviceAccount.private_key.substring(0, 50));
    console.log('🔑 Formatted private key ends with:', serviceAccount.private_key.substring(serviceAccount.private_key.length - 50));

    // Generate JWT
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const assertion = jwt.sign(claim, serviceAccount.private_key, { algorithm: 'RS256' });
    console.log('✅ JWT assertion generated');

    // Get access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token obtained');

    // Test FCM token from database (replace with actual token)
    const testToken = 'eve47_C-Tt6v8aSOhQXTLq:APA91bH3-wl8wK37A1of2A6ZRIMOlzdrNrAgLC7paie4fnaEn7OHr2Io9dKI4LhRHrTcQ9EGWi062pfqCBMX73wGureBOQhsjdCQeb45nA3D-rLxUO-Jukk';

    console.log(`🎯 Testing FCM token: ${testToken.substring(0, 30)}...`);

    const payload = {
      message: {
        token: testToken,
        notification: {
          title: 'FCM Token Validation Test',
          body: 'Testing if this FCM token is valid and can receive messages'
        },
        data: {
          test: 'validation',
          timestamp: Date.now().toString()
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'default',
            priority: 'max',
            sound: 'default'
          }
        }
      }
    };

    console.log('📤 Sending test FCM message...');

    const response = await axios.post(
      'https://fcm.googleapis.com/v1/projects/sevaq-6fcc4/messages:send',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('✅ FCM Message Sent Successfully!');
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));

    if (response.data.name) {
      console.log('🎉 FCM accepted the message - token appears valid');
      console.log('📝 Message ID:', response.data.name);
    }

  } catch (error) {
    console.error('❌ FCM Test Failed!');
    console.error('Error:', error.message);

    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📄 Response Data:', JSON.stringify(error.response.data, null, 2));

      if (error.response.data.error) {
        console.error('🚨 FCM Error Details:');
        console.error('- Code:', error.response.data.error.code);
        console.error('- Message:', error.response.data.error.message);
        console.error('- Status:', error.response.data.error.status);

        if (error.response.data.error.details) {
          console.error('- Details:', JSON.stringify(error.response.data.error.details, null, 2));
        }
      }

      // Common FCM error codes
      const errorCode = error.response.data.error?.code;
      switch (errorCode) {
        case 400:
          console.error('💡 INVALID_ARGUMENT: Token format invalid or message malformed');
          break;
        case 401:
          console.error('💡 UNAUTHENTICATED: Invalid authentication credentials');
          break;
        case 403:
          console.error('💡 PERMISSION_DENIED: Service account lacks permission');
          break;
        case 404:
          console.error('💡 NOT_FOUND: FCM token not found/registered');
          break;
        case 429:
          console.error('💡 RESOURCE_EXHAUSTED: Rate limited');
          break;
        case 500:
          console.error('💡 INTERNAL: FCM server error');
          break;
        default:
          console.error('💡 Unknown error code:', errorCode);
      }
    } else {
      console.error('No response received from FCM');
    }
  }
}

testFCMToken();