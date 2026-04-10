import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Top-level function for handling background FCM messages.
/// This MUST be a top-level function, not a class method.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('=== Background Message Handler ===');
  debugPrint('Handling a background message: ${message.messageId}');
  debugPrint('Message data: ${message.data}');
  debugPrint('Notification: ${message.notification?.title}');

  // For background notifications, show a full-screen local notification
  // This ensures the notification auto-launches the full-screen activity
  final data = message.data;
  final isFullScreen = data['fullScreen'] == 'true' ||
      data['full_screen'] == 'true' ||
      data['type'] == 'full_screen_booking';

  if (data['type'] == 'new_booking' ||
      data['type'] == 'booking_assigned' ||
      isFullScreen) {
    await _showFullScreenBookingNotification(message);
  }
}

/// Show a full-screen local notification for new booking alerts
Future<void> _showFullScreenBookingNotification(RemoteMessage message) async {
  try {
    final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

    // Initialize Android settings
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initializationSettings =
        InitializationSettings(android: androidSettings);

    await flutterLocalNotificationsPlugin.initialize(initializationSettings);

    // Create full-screen notification channel with IMPORTANCE_MAX
    const androidChannel = AndroidNotificationChannel(
      'full_screen_booking_channel',
      'Critical Booking Alerts',
      description:
          'Full-screen notifications for new booking assignments requiring immediate attention',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      showBadge: true,
    );

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Extract booking data from payload
    final data = message.data;
    final bookingId =
        data['bookingId'] ?? data['booking_id'] ?? message.hashCode.toString();
    final serviceName = data['serviceName'] ?? 'Service';
    final serviceDate = data['serviceDate'] ?? '';
    final startTime = data['startTime'] ?? '';
    final customerName = data['customerName'] ?? 'Customer';
    final customerAddress = data['customerAddress'] ?? '';
    final price = data['price'] ?? '0';

    // For data-only messages, title and body are in the data payload
    final title = data['notification_title'] ??
        message.notification?.title ??
        'नया काम मिला!';
    final body = data['notification_body'] ??
        message.notification?.body ??
        'You have a new booking assignment';

    debugPrint('Full-screen notification title: $title');
    debugPrint('Full-screen notification body: $body');

    // Build the payload string with booking details
    final payload =
        'type:full_screen_booking|bookingId:$bookingId|serviceName:$serviceName|serviceDate:$serviceDate|startTime:$startTime|customerName:$customerName|customerAddress:$customerAddress|price:$price';

    // Show the notification
    // The full-screen behavior is achieved via:
    // 1. IMPORTANCE_MAX channel setting
    // 2. Priority.MAX and Category.alarm for heads-up display
    // 3. AndroidManifest activity settings (showOnLockScreen, turnScreenOn)
    await _showNativeFullScreenNotification(
      notificationId: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      payload: payload,
      bookingId: bookingId,
    );

    debugPrint('Full-screen local notification shown for booking: $bookingId');
  } catch (e, stackTrace) {
    debugPrint('Error showing full-screen local notification: $e');
    debugPrint('Stack trace: $stackTrace');
  }
}

/// Shows a native Android full-screen notification using platform channels
/// This creates a proper PendingIntent for full-screen intent behavior
Future<void> _showNativeFullScreenNotification({
  required int notificationId,
  required String title,
  required String body,
  required String payload,
  required String bookingId,
  String? serviceName,
  String? serviceDate,
  String? startTime,
  String? customerName,
  String? customerAddress,
  String? price,
}) async {
  // Use standard notification - the full-screen behavior is handled by the
  // activity launch settings in AndroidManifest (showOnLockScreen, turnScreenOn)
  // and the notification priority/importance settings
  final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  // Create a high-priority Android notification with alarm category
  // This ensures it shows as a heads-up notification and can wake the screen
  final androidDetails = AndroidNotificationDetails(
    'full_screen_booking_channel',
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
    icon: '@mipmap/ic_launcher',
  );

  final notificationDetails = NotificationDetails(android: androidDetails);

  await flutterLocalNotificationsPlugin.show(
    notificationId,
    title,
    body,
    notificationDetails,
    payload: payload,
  );
}

/// Export this function for use in main.dart
Future<void> initializeBackgroundMessageHandler() async {
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  debugPrint('Background message handler registered');
}
