import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Notification channel ID for new booking alerts
  static const String newBookingChannelId = 'new_booking_channel';

  /// Full-screen notification channel ID for critical booking alerts
  static const String fullScreenChannelId = 'full_screen_booking_channel';

  // Stream controller for new booking events
  static final StreamController<Map<String, dynamic>> _bookingStreamController =
      StreamController<Map<String, dynamic>>.broadcast();

  static Stream<Map<String, dynamic>> get onNewBooking =>
      _bookingStreamController.stream;

  // FCM token for this device
  String? _fcmToken;
  bool _tokenRegistered = false;

  // Store initial message for later processing (after stream listener is set up)
  RemoteMessage? _initialMessage;

  // Track processed message IDs to prevent duplicate processing
  static final Set<String> _processedMessageIds = {};
  static const Duration _messageDedupWindow = Duration(seconds: 30);

  /// Initialize notification service
  Future<void> initialize() async {
    try {
      debugPrint('=== NotificationService: Starting initialization ===');

      // Initialize local notifications for Android channel with sound
      await _initializeLocalNotifications();

      // Request permission for iOS
      final settings = await _firebaseMessaging.requestPermission();

      debugPrint(
          'Notification permission status: ${settings.authorizationStatus}');

      // Get FCM token
      debugPrint('NotificationService: Requesting FCM token from Firebase...');
      _fcmToken = await _firebaseMessaging.getToken();

      if (_fcmToken != null) {
        debugPrint(
            'FCM Token obtained successfully: ${_fcmToken!.substring(0, 20)}...');
      } else {
        debugPrint(
            'WARNING: FCM Token is NULL - Firebase may not be configured correctly');
      }

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle background messages
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

      // Store initial message for later processing (after stream listener is set up)
      _initialMessage = await _firebaseMessaging.getInitialMessage();
      if (_initialMessage != null) {
        debugPrint(
            'Initial message stored for later processing: ${_initialMessage!.messageId}');
      }

      debugPrint('=== NotificationService: Initialization complete ===');
    } catch (e) {
      debugPrint('Error initializing notifications: $e');
    }
  }

  /// Initialize local notifications and create the new_booking_channel with sound
  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
    );

    // Create the new_booking_channel with sound for Android 8.0+
    const androidChannel = AndroidNotificationChannel(
      newBookingChannelId,
      'New Booking Alerts',
      description: 'High priority notifications for new booking assignments',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      // Use default system notification sound
      // For custom sound, place file in android/app/src/main/res/raw/booking_alert.mp3
      // and use: sound: RawResourceAndroidNotificationSound('booking_alert'),
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Create the full-screen booking channel with IMPORTANCE_MAX
    const fullScreenChannel = AndroidNotificationChannel(
      fullScreenChannelId,
      'Critical Booking Alerts',
      description:
          'Full-screen notifications for new booking assignments requiring immediate attention',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      showBadge: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(fullScreenChannel);

    debugPrint('=== Created notification channel: $newBookingChannelId ===');
    debugPrint('=== Created full-screen channel: $fullScreenChannelId ===');
  }

  /// Show a full-screen notification for critical booking alerts
  Future<void> showFullScreenNotification({
    required String title,
    required String body,
    required String bookingId,
    required String serviceName,
    required String serviceDate,
    required String startTime,
    required String customerName,
    String? customerAddress,
    required String price,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      fullScreenChannelId,
      'Critical Booking Alerts',
      channelDescription: 'Full-screen notifications for new bookings',
      importance: Importance.max,
      priority: Priority.max,
      category: AndroidNotificationCategory.alarm,
      visibility: NotificationVisibility.public,
      autoCancel: true,
      ongoing: false,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      ticker: 'New booking assigned!',
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
        interruptionLevel: InterruptionLevel.critical,
      ),
    );

    final payload = jsonEncode({
      'type': 'full_screen_booking',
      'bookingId': bookingId,
      'serviceName': serviceName,
      'serviceDate': serviceDate,
      'startTime': startTime,
      'customerName': customerName,
      'customerAddress': customerAddress ?? '',
      'price': price,
    });

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      notificationDetails,
      payload: payload,
    );

    debugPrint(
        '=== Full-screen notification shown for booking: $bookingId ===');
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
    debugPrint('=== App opened from notification ===');
    debugPrint('Message data: ${message.data}');
    debugPrint('Message notification: ${message.notification?.title}');

    // Check if this is a new booking notification
    final data = Map<String, dynamic>.from(message.data);
    final isFullScreen = data['fullScreen'] == 'true' ||
        data['full_screen'] == 'true' ||
        data['type'] == 'full_screen_booking' ||
        data['type'] == 'new_booking' ||
        data['type'] == 'booking_assigned';

    if (isFullScreen ||
        data['type'] == 'new_booking' ||
        data['type'] == 'booking_assigned') {
      debugPrint('=== Full-screen booking notification tapped ===');
      // Add to stream to trigger full-screen dialog
      _bookingStreamController.add(data);
    } else {
      _handleMessage(message);
    }
  }

  /// Process incoming message with deduplication
  void _handleMessage(RemoteMessage message) {
    // Deduplicate: skip if we've already processed this message
    final messageId = message.messageId;
    if (messageId != null && _processedMessageIds.contains(messageId)) {
      debugPrint('=== FCM Message SKIPPED (duplicate): $messageId ===');
      return;
    }

    // Mark this message as processed
    if (messageId != null) {
      _processedMessageIds.add(messageId);
      // Clean up old message IDs after the dedup window
      Future.delayed(_messageDedupWindow, () {
        _processedMessageIds.remove(messageId);
      });
    }

    final data = Map<String, dynamic>.from(message.data);

    debugPrint('=== FCM Message Received ===');
    debugPrint('Message ID: ${message.messageId}');
    debugPrint('Notification title: ${message.notification?.title}');
    debugPrint('Notification body: ${message.notification?.body}');
    debugPrint('Data payload: $data');

    // Check if it's a new booking notification
    // Backend may send bookingId in various fields
    String? bookingId = data['bookingId']?.toString() ??
        data['booking_id']?.toString() ??
        data['id']?.toString();

    // If no bookingId in data, try to extract from notification body
    if (bookingId == null && message.notification?.body != null) {
      final body = message.notification!.body!;
      // Try to find a booking ID pattern in the body
      final idMatch = RegExp(r'#?(\d+)').firstMatch(body);
      if (idMatch != null) {
        bookingId = idMatch.group(1);
      }
    }

    // Add bookingId to data if found
    if (bookingId != null) {
      data['bookingId'] = bookingId;
    }

    // Check if it's a new booking notification
    if (data['type'] == 'new_booking' ||
        data['type'] == 'booking_assigned' ||
        bookingId != null) {
      _bookingStreamController.add(data);

      debugPrint('New booking notification added to stream: $bookingId');
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
    debugPrint('=== registerTokenWithBackend: Starting ===');

    if (_fcmToken == null) {
      debugPrint('ERROR: No FCM token to register - _fcmToken is null');
      return;
    }

    debugPrint('FCM Token to register: ${_fcmToken!.substring(0, 30)}...');

    try {
      // Get token from secure storage
      final token = await _storage.read(key: 'worker_jwt_token');

      debugPrint(
          'JWT token from storage: ${token != null ? "Found" : "NOT FOUND"}');
      if (token != null) {
        debugPrint('JWT token preview: ${token.substring(0, 20)}...');
      }

      if (token == null) {
        debugPrint(
            'ERROR: No JWT token found in secure storage - cannot register FCM token');
        debugPrint(
            'This means user is not logged in or token was not saved properly');
        return;
      }

      // Retry logic with multiple attempts
      const maxRetries = 5;
      const retryDelayMs = 2000;

      for (int attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          debugPrint('FCM token registration attempt $attempt of $maxRetries');

          final response = await http
              .patch(
                Uri.parse('${AppConfig.apiBaseUrl}/workers/me/fcm-token'),
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer $token',
                },
                body: jsonEncode({'fcmToken': _fcmToken}),
              )
              .timeout(const Duration(seconds: 10));

          debugPrint('Response status code: ${response.statusCode}');
          debugPrint('Response body: ${response.body}');

          if (response.statusCode == 200) {
            _tokenRegistered = true;
            debugPrint('SUCCESS: FCM token registered successfully');
            return;
          } else {
            debugPrint(
                'ERROR: Failed to register FCM token - status ${response.statusCode}');
          }
        } catch (e) {
          debugPrint('ERROR on attempt $attempt: $e');
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await Future.delayed(Duration(milliseconds: retryDelayMs * attempt));
        }
      }

      debugPrint(
          'ERROR: FCM token registration failed after $maxRetries attempts');
    } catch (e, stackTrace) {
      debugPrint('ERROR registering FCM token: $e');
      debugPrint('Stack trace: $stackTrace');
    }
  }

  /// Retry registration - call this when network becomes available
  Future<void> retryRegisterToken() async {
    debugPrint('=== retryRegisterToken: Called ===');
    _tokenRegistered = false;

    // Check current token state
    final currentFcmToken = await _firebaseMessaging.getToken();
    if (currentFcmToken != null && currentFcmToken != _fcmToken) {
      debugPrint(
          'FCM token has changed, updating from ${_fcmToken?.substring(0, 20) ?? "null"} to ${currentFcmToken.substring(0, 20)}...');
      _fcmToken = currentFcmToken;
    }

    await registerTokenWithBackend();
  }

  /// Get stored initial message and process it (call this after stream listener is set up)
  void processInitialMessage() {
    if (_initialMessage != null) {
      debugPrint(
          '=== Processing stored initial message: ${_initialMessage!.messageId} ===');
      _handleMessage(_initialMessage!);
      _initialMessage = null; // Clear after processing
    }
  }

  /// Cleanup
  void dispose() {
    _bookingStreamController.close();
  }
}
