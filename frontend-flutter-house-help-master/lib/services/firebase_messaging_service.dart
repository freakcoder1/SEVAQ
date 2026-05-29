import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_house_help/providers/booking_provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../config/app_config.dart';
import '../firebase_options.dart';
import 'api_service.dart';

/// Annotation to prevent tree-shaking by Dart compiler
/// This class is accessed from native code (Android/iOS)
@pragma('vm:entry-point')
class FirebaseMessagingService {
  static final FirebaseMessaging _firebaseMessaging =
      FirebaseMessaging.instance;
  static final FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  /// Get user role from storage (uses shared_preferences on web, secure storage on mobile)
  static Future<String?> _getUserRole() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('user_role');
    }
    return await _secureStorage.read(key: 'user_role');
  }

  /// Store user role (uses shared_preferences on web, secure storage on mobile)
  static Future<void> _storeUserRole(String role) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_role', role);
    } else {
      await _secureStorage.write(key: 'user_role', value: role);
    }
  }

  /// Get pending FCM token from storage (uses shared_preferences on web, secure storage on mobile)
  static Future<String?> _getPendingFcmToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('pending_fcm_token');
    }
    return await _secureStorage.read(key: 'pending_fcm_token');
  }

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

    // Set foreground notification presentation options (so notifications show when app is in foreground)
    await _firebaseMessaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Request notification permissions
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    print('Notification permission status: ${settings.authorizationStatus}');

    // Check if permission was denied
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      print('Notification permission DENIED - user must enable in Settings');
    } else if (settings.authorizationStatus ==
        AuthorizationStatus.provisional) {
      print('Notification permission PROVISIONAL');
    } else if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('Notification permission AUTHORIZED');
    }

    // Get FCM token and send to backend
    String? token = await _firebaseMessaging.getToken();
    print('FCM Token: $token');
    if (token != null) {
      await _sendFcmTokenToBackend(token);
    } else {
      print('WARNING: No FCM token received - check Firebase configuration');
    }

    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen((String newToken) async {
      print('FCM Token refreshed: $newToken');
      await _sendFcmTokenToBackend(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('=== FOREGROUND MESSAGE RECEIVED ===');
      print('Message data: ${message.data}');
      print('Notification title: ${message.notification?.title}');
      print('Notification body: ${message.notification?.body}');

      // With setForegroundNotificationPresentationOptions, notification should show automatically
      // But we can still handle it here for custom behavior
      if (message.notification != null) {
        _handleForegroundNotification(message);
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

  /// Generate a stable device identifier for guest FCM token storage.
  static Future<String?> _getDeviceId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String? id = prefs.getString('device_id');
      if (id == null) {
        id = const Uuid().v4();
        await prefs.setString('device_id', id);
        debugPrint('FCM: Generated new deviceId: $id');
      }
      return id;
    } catch (e) {
      debugPrint('FCM: Error generating deviceId: $e');
      return null;
    }
  }

  static Future<void> _sendFcmTokenToBackend(String fcmToken) async {
    try {
      final apiService = ApiService();
      String? userRole = await _getUserRole();
      final deviceId = await _getDeviceId();

      if (userRole == 'worker') {
        print('FCM: User is worker, trying worker endpoint');
        try {
          await apiService.patch('/workers/me/fcm-token', {
            'fcmToken': fcmToken,
          });
          print('FCM: Worker token registered successfully!');
          return;
        } catch (e) {
          print('FCM: Worker endpoint failed, will try user endpoint: $e');
        }
      }

      // Try user endpoint (for customers or workers without profile yet)
      print('FCM: Trying user endpoint');
      try {
        await apiService.post('/users/register-fcm-token', {
          'fcmToken': fcmToken,
          if (deviceId != null) 'deviceId': deviceId,
        });
        print('FCM: User token registered successfully!');
      } catch (e) {
        print('FCM: User endpoint exception: $e');
      }
    } catch (e) {
      print('FCM: Error sending token to backend: $e');
    }
  }

  /// Public method to manually trigger FCM token registration
  /// Call this after user logs in to ensure token is registered
  static Future<void> registerFcmToken() async {
    try {
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        print(
          'Manually triggering FCM token registration: ${token.substring(0, 20)}...',
        );
        await _sendFcmTokenToBackend(token);
      } else {
        // Try to use pending token from storage (stored during pre-login initialization)
        String? pendingToken = await _getPendingFcmToken();
        if (pendingToken != null) {
          print(
            'Using pending FCM token from storage: ${pendingToken.substring(0, 20)}...',
          );
          await _sendFcmTokenToBackend(pendingToken);
        } else {
          print('Cannot register FCM token - no token available');
        }
      }
    } catch (e) {
      print('Error in registerFcmToken: $e');
    }
  }

  static Future<void> _firebaseMessagingBackgroundHandler(
    RemoteMessage message,
  ) async {
    print('=== BACKGROUND MESSAGE RECEIVED ===');
    print('Message ID: ${message.messageId}');
    print('Message data: ${message.data}');
    print(
      'Notification: ${message.notification?.title} - ${message.notification?.body}',
    );

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

  static void _handleForegroundNotification(RemoteMessage message) {
    // With setForegroundNotificationPresentationOptions, notifications show automatically
    // This handles custom actions if needed
    print('Handling foreground notification: ${message.notification?.title}');

    // Handle different notification types
    final data = message.data;
    if (data['type'] == 'pre_service_reminder') {
      print('Pre-service reminder received');
    } else if (data['type'] == 'new_booking') {
      print('New booking notification received');
    } else if (data['type'] == 'booking_update') {
      print('Booking update notification received');
    }
  }

  static Future<String?> getToken() async {
    return await _firebaseMessaging.getToken();
  }
}
