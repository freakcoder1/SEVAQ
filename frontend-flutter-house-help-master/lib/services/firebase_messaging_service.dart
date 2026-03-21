import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_house_help/providers/booking_provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../firebase_options.dart';

class FirebaseMessagingService {
  static final FirebaseMessaging _firebaseMessaging =
      FirebaseMessaging.instance;
  static final FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  static Future<void> initialize() async {
    try {
      // Initialize Firebase with platform-specific options
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    } catch (e) {
      print('Failed to initialize Firebase: $e');
      return;
    }

    // Request notification permissions
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    print('User granted permission: ${settings.authorizationStatus}');

    // Get FCM token and send to backend
    String? token = await _firebaseMessaging.getToken();
    print('FCM Token: $token');
    if (token != null) {
      await _sendFcmTokenToBackend(token);
    }

    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen((String newToken) async {
      print('FCM Token refreshed: $newToken');
      await _sendFcmTokenToBackend(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      print('Message data: ${message.data}');

      if (message.notification != null) {
        print('Message also contained a notification: ${message.notification}');
        _showNotification(message);
      }
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle message when app is opened from terminated state
    FirebaseMessaging.instance.getInitialMessage().then((
      RemoteMessage? message,
    ) {
      if (message != null) {
        _handleMessage(message);
      }
    });

    // Handle message when app is in background and user taps on notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('On message opened app');
      _handleMessage(message);
    });
  }

  static Future<void> _sendFcmTokenToBackend(String fcmToken) async {
    try {
      // Get the auth token from secure storage
      String? authToken = await _secureStorage.read(key: 'auth_token');

      if (authToken == null) {
        print('No auth token found, skipping FCM token registration');
        return;
      }

      // Make API call to register FCM token
      final response = await http.post(
        Uri.parse('http://localhost:3000/users/register-fcm-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: '{"fcmToken": "$fcmToken"}',
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('FCM token registered successfully');
      } else {
        print(
          'Failed to register FCM token: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      print('Error sending FCM token to backend: $e');
    }
  }

  static Future<void> _firebaseMessagingBackgroundHandler(
    RemoteMessage message,
  ) async {
    print('Handling a background message: ${message.messageId}');
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  static void _handleMessage(RemoteMessage message) {
    print('Handling message: ${message.data}');
    // Handle different types of messages
    if (message.data['type'] == 'pre_service_reminder') {
      // Navigate to bookings or specific booking screen
    }
  }

  static void _showNotification(RemoteMessage message) {
    // Show local notification when app is in foreground
    print('Showing notification: ${message.notification?.title}');
  }

  static Future<String?> getToken() async {
    return await _firebaseMessaging.getToken();
  }
}
