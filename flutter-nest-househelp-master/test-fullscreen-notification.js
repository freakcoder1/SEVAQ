/**
 * Test script to send a full-screen notification directly to Worker 19's FCM token
 * This verifies that full-screen notifications work on the worker app
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

async function testFullScreenNotification() {
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  // Worker 19's FCM token (from logs)
  const fcmToken = 'eJhFqMeWQoiiTSWh19dfXj:APA91bH';

  // Full-screen notification message
  const message = {
    token: fcmToken,
    data: {
      type: 'new_booking',
      bookingId: '99999',
      serviceName: 'Test Service',
      serviceDate: '2026-04-06',
      startTime: '10:00',
      assignmentType: 'test',
      notification_title: 'नई बुकिंग मिली! 🎉',
      notification_body: 'Test full-screen notification. Tap to open app.',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      id: '1',
      status: 'done',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'full_screen_booking_channel',
        defaultSound: true,
        defaultVibrateTimings: true,
        title: 'नई बुकिंग मिली! 🎉',
        body: 'Test full-screen notification. Tap to open app.',
        fullScreenIntent: true,
      },
    },
    apns: {
      payload: {
        aps: {
          contentAvailable: true,
          sound: 'default',
        },
      },
    },
  };

  try {
    console.log('Sending full-screen notification to Worker 19...');
    console.log(`FCM Token: ${fcmToken.substring(0, 20)}...`);
    
    const response = await admin.messaging().send(message);
    console.log(`✅ Successfully sent notification: ${response}`);
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
  }

  process.exit(0);
}

testFullScreenNotification();
