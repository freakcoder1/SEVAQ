import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Stream controller for new booking events
  static final StreamController<Map<String, dynamic>> _bookingStreamController =
      StreamController<Map<String, dynamic>>.broadcast();

  static Stream<Map<String, dynamic>> get onNewBooking =>
      _bookingStreamController.stream;

  // FCM token for this device
  String? _fcmToken;
  bool _tokenRegistered = false;

  /// Initialize notification service
  Future<void> initialize() async {
    try {
      // Request permission for iOS
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: true,
        badge: true,
        sound: true,
      );

      if (kDebugMode) {
        print(
            'Notification permission status: ${settings.authorizationStatus}');
      }

      // Get FCM token
      _fcmToken = await _firebaseMessaging.getToken();
      if (kDebugMode) {
        print('FCM Token: $_fcmToken');
      }

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle background messages
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

      // Check if app was opened from notification
      final initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessage(initialMessage);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing notifications: $e');
      }
    }
  }

  /// Handle foreground messages (when app is open)
  void _handleForegroundMessage(RemoteMessage message) {
    if (kDebugMode) {
      print('Foreground message received: ${message.notification?.title}');
    }

    _handleMessage(message);
  }

  /// Handle when app is opened from notification
  void _handleMessageOpenedApp(RemoteMessage message) {
    _handleMessage(message);
  }

  /// Process incoming message
  void _handleMessage(RemoteMessage message) {
    final data = message.data;

    // Check if it's a new booking notification
    if (data['type'] == 'new_booking' || data['bookingId'] != null) {
      _bookingStreamController.add(data);

      if (kDebugMode) {
        print('New booking notification: ${data['bookingId']}');
      }
    }
  }

  /// Get FCM token
  String? get fcmToken => _fcmToken;

  /// Subscribe to topic (for worker notifications)
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      if (kDebugMode) {
        print('Subscribed to topic: $topic');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error subscribing to topic: $e');
      }
    }
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
    } catch (e) {
      if (kDebugMode) {
        print('Error unsubscribing from topic: $e');
      }
    }
  }

  /// Send FCM token to backend for this worker
  Future<void> registerTokenWithBackend() async {
    // Always try to register - remove the check to ensure FCM token is always sent
    // We check inside the function to handle auth/jwt token, not the in-memory flag
    if (kDebugMode) {
      print('Attempting to register FCM token with backend...');
    }

    if (_fcmToken == null) {
      if (kDebugMode) {
        print('No FCM token to register');
      }
      return;
    }

    try {
      // Get token from secure storage
      final token = await _storage.read(key: 'worker_jwt_token');
      if (token == null) {
        if (kDebugMode) {
          print('No JWT token found, cannot register FCM token');
        }
        return;
      }

      // Retry logic with multiple attempts
      const maxRetries = 5;
      const retryDelayMs = 2000;

      for (int attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (kDebugMode) {
            print('FCM token registration attempt $attempt of $maxRetries');
          }

          final response = await http
              .patch(
                Uri.parse('${AppConfig.apiBaseUrl}/workers/me/fcm-token'),
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer $token',
                },
                body: jsonEncode({'fcmToken': _fcmToken}),
              )
              .timeout(Duration(seconds: 10));

          if (response.statusCode == 200) {
            _tokenRegistered = true;
            if (kDebugMode) {
              print('FCM token registered successfully');
            }
            return;
          } else {
            if (kDebugMode) {
              print('Failed to register FCM token: ${response.statusCode}');
            }
          }
        } catch (e) {
          if (kDebugMode) {
            print('Error on attempt $attempt: $e');
          }
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await Future.delayed(Duration(milliseconds: retryDelayMs * attempt));
        }
      }

      if (kDebugMode) {
        print('FCM token registration failed after $maxRetries attempts');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error registering FCM token: $e');
      }
    }
  }

  /// Retry registration - call this when network becomes available
  Future<void> retryRegisterToken() async {
    _tokenRegistered = false;
    await registerTokenWithBackend();
  }

  /// Cleanup
  void dispose() {
    _bookingStreamController.close();
  }
}
