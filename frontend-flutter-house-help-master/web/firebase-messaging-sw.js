// Firebase messaging service worker
// This file is required for Firebase Cloud Messaging to work on web

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyDvqqcSlnym-IQIrZQsp2Zkk1iDenO-oQg',
  appId: '1:787166049871:web:5374c26588514b0ac81c3a',
  messagingSenderId: '787166049871',
  projectId: 'sevaq-6fcc4',
  authDomain: 'sevaq-6fcc4.firebaseapp.com',
  storageBucket: 'sevaq-6fcc4.firebasestorage.app',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/Icon-192.png',
    data: payload.data,
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});