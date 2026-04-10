# Worker App Crash & Background Notification Sound Fix Plan

## Issue 1: Worker App Crash on "View Details" Button

### Root Cause Analysis
The crash is caused by a **redundant `Navigator.pop()` call** that corrupts the navigation stack:

1. In [`new_booking_dialog.dart:133-137`](worker_app_flutter/lib/widgets/new_booking_dialog.dart:133), the `_viewDetails()` method:
   ```dart
   void _viewDetails() {
     _stopAudio();
     Navigator.of(context).pop();  // <-- Dialog dismisses itself here
     widget.onViewDetails();       // <-- Then calls the callback
   }
   ```

2. In [`main.dart:192-195`](worker_app_flutter/lib/main.dart:192), the `onViewDetails` callback:
   ```dart
   onViewDetails: () {
     Navigator.of(context).pop();  // <-- REDUNDANT! Dialog already popped
     // Navigate to booking details
   },
   ```

### Fix
**Remove the redundant `Navigator.of(context).pop()` from the callback in `main.dart`**:

```dart
// Before (broken):
onViewDetails: () {
  Navigator.of(context).pop();
  // Navigate to booking details
},

// After (fixed):
onViewDetails: () {
  // Dialog already dismisses itself in _viewDetails()
  // Navigate to booking details
  Navigator.of(context).pushNamed('/booking-details', arguments: dialogData.bookingId);
},
```

---

## Issue 2: Notification Sound Not Playing in Background

### Root Cause Analysis
The background notification sound relies on `flutter_local_notifications` with `playSound: true` and `Importance.max`. The issue may be:

1. **Missing `POST_NOTIFICATIONS` permission** on Android 13+
2. **Notification channel not properly initialized** before showing notifications
3. **System sound settings** blocking notification audio

### Fix
1. Ensure `AndroidNotificationChannel` is created with correct sound settings:
   ```dart
   const AndroidNotificationChannel channel = AndroidNotificationChannel(
     'new_booking_channel',
     'New Booking Notifications',
     description: 'Notifications for new booking assignments',
     importance: Importance.max,
     playSound: true,
     enableVibration: true,
     showBadge: true,
   );
   ```

2. Request `POST_NOTIFICATIONS` permission at app startup for Android 13+

---

## Issue 3: Worker App Network Configuration (localhost issue)

### Root Cause Analysis
The worker app logs show:
```
AppConfig: apiBaseUrl = http://localhost:45357/api (Android USB debugging — localhost)
```

When the USB connection is unstable or the device is on a different network, `localhost` resolution fails with:
```
SocketException: Failed host lookup: 'localhost'
```

### Fix
The worker app should use `10.0.2.2` (Android emulator loopback) or the machine's WiFi IP for physical devices. Update [`worker_app_flutter/lib/config/app_config.dart`](worker_app_flutter/lib/config/app_config.dart) to detect the platform and use the appropriate address.

---

## Implementation Steps

1. **Fix Navigation Crash** - Remove redundant `pop()` in `main.dart`
2. **Verify Background Notification Sound** - Check notification channel configuration
3. **Fix Network Configuration** - Update API base URL detection logic
