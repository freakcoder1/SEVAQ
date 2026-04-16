# Customer Notifications Complete Fix Plan

## Problem Summary
✅ **Backend notifications are 100% implemented and working**
❌ **Customer Flutter app has ZERO FCM implementation** - this is the primary cause of 100% notification delivery failure
❌ Hardcoded Hindi notification text
❌ No token invalidation
❌ No retry logic
❌ No delivery metrics

---

## Implementation Plan

### Phase 1: Backend Fixes

#### 1.1 Update Notification Language
File: `flutter-nest-househelp-master/src/notifications/notifications.service.ts`

| Original Hindi | New English |
|---|---|
| `'बुकिंग पुष्टि!'` | `'Booking Confirmed!'` |
| `'आपकी ${serviceName} बुकिंग पुष्टि हो गई है!'` | `'Your ${serviceName} booking has been confirmed successfully!'` |
| `'नया काम मिला!'` | `'New Booking Assigned!'` |
| `'नया बुकिंग मिली है - ${serviceName}'` | `'You have been assigned a new booking - ${serviceName}'` |
| `'नई बुकिंग मिली! 🎉'` | `'New Booking Received! 🎉'` |

#### 1.2 Add FCM Token Invalidation
Add logic in `fcm-http.service.ts` to handle error codes:
- `InvalidRegistration` → delete user token
- `NotRegistered` → delete user token
- `InvalidApnsToken` → delete user token

#### 1.3 Add Delivery Tracking
Add `notification_logs` table with:
- User/Worker ID
- Booking ID
- FCM token used
- Status (success/failed)
- Error message
- Timestamp

#### 1.4 Add Retry Logic
Implement exponential backoff retry for failed notifications (max 3 attempts)

---

### Phase 2: Flutter Customer App Implementation

#### 2.1 Add Dependencies
Add to `pubspec.yaml`:
```yaml
firebase_messaging: ^15.0.0
firebase_core: ^3.0.0
flutter_local_notifications: ^17.0.0
```

#### 2.2 FCM Integration Steps
1.  Initialize Firebase on app startup
2.  Request POST_NOTIFICATIONS permission for Android 13+
3.  Get FCM token on login / app launch
4.  Send token to backend endpoint `/users/register-fcm-token`
5.  Listen for token refresh events and update backend automatically

#### 2.3 Message Handlers
```dart
// Foreground messages (app open)
FirebaseMessaging.onMessage.listen((message) {
  // Show in-app notification / snackbar
});

// Background messages (app minimized)
FirebaseMessaging.onBackgroundMessage(_backgroundMessageHandler);

// App opened from notification
FirebaseMessaging.onMessageOpenedApp.listen((message) {
  // Navigate to appropriate screen
});
```

#### 2.4 Notification Channels
Create Android notification channels with proper importance levels:
- Default channel for general notifications
- High priority channel for booking updates

---

### Phase 3: Testing & Verification

1.  Test notification delivery when app is in foreground
2.  Test notification delivery when app is in background
3.  Test notification delivery when app is terminated
4.  Test notification navigation works correctly
5.  Verify all 6 customer notification types work:
    - ✅ Booking confirmation
    - ✅ Worker assigned
    - ✅ Worker en-route
    - ✅ Service started
    - ✅ Service completed
    - ✅ Pre-service reminder

---

### Estimated Implementation Order
1.  Backend language fix (5 mins)
2.  Flutter FCM base integration (1 hour)
3.  Token registration (30 mins)
4.  Message handlers (1 hour)
5.  Backend token invalidation (30 mins)
6.  Notification navigation (30 mins)
7.  Testing & verification (1 hour)

---

### Success Criteria
✅ 100% of customers who open the app will receive notifications
✅ All notifications are in English language
✅ Notifications work in all app states
✅ Failed notifications are automatically retried
✅ Bad tokens are automatically cleaned up
✅ Full visibility into delivery success rates
