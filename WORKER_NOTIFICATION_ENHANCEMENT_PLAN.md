# Worker Notification Enhancement Plan

## Executive Summary

Enhance the SEVAQ worker app with a robust notification system featuring:
- Push notifications for new bookings
- Sound alerts when booking arrives
- Visual popup/alert screens
- Simple, icon-based UI for non-educated workers

---

## 1. Current State Analysis

### What's Missing
| Feature | Current Status | Required |
|---------|---------------|----------|
| Push Notifications | ❌ Not implemented | ✅ FCM needed |
| Sound Alerts | ❌ No sound on new booking | ✅ Local notification |
| Visual Popups | ❌ Manual refresh only | ✅ Auto-popup |
| Simple UI | ⚠️ Text-heavy | ✅ Icon-based |

### Firebase Already Present
- `firebase_core: ^3.8.0`
- `firebase_auth: ^5.3.4`
- Project: `sevaq-6fcc4`

---

## 2. Recommended Implementation

### 2.1 Push Notifications (FCM)
Add Firebase Cloud Messaging for real-time booking notifications.

**Packages to add:**
```yaml
firebase_messaging: ^15.1.6
flutter_local_notifications: ^18.0.1
```

**Backend changes:**
- Register FCM token when worker logs in
- Send push notification when booking is assigned
- Handle notification tap to open booking details

### 2.2 Sound Alerts
Play distinct sounds for different events.

**Sound types:**
| Event | Sound | Duration |
|-------|-------|----------|
| New Booking | Loud beep/ding | 3 seconds |
| Booking Confirmed | Success chime | 2 seconds |
| Payment Received | Money sound | 2 seconds |

### 2.3 Visual Popup/Alert
Create full-screen popup for new bookings even when app is closed.

**Popup content:**
- Large icons (no text needed)
- Service type icon (broom for cleaning, etc.)
- Customer photo or placeholder
- Two big buttons: ✅ Accept | ❌ Reject
- Location shown as map pin icon

### 2.4 Simple UI for Non-Educated Workers

**Design Principles:**
1. **Big Icons, Minimal Text**
2. **Color-coded actions**
3. **One action per screen**

**Navigation Icons:**
| Icon | Meaning |
|------|---------|
| 🧹 | Jobs/Bookings |
| 💰 | Earnings |
| 👤 | Profile |
| ⚙️ | Settings |

---

## 3. Technical Implementation

### 3.1 Flutter App Changes

```
worker_app_flutter/
├── lib/
│   ├── services/
│   │   ├── notification_service.dart    # NEW - FCM handling
│   │   └── sound_service.dart            # NEW - Sound playback
│   ├── widgets/
│   │   ├── new_booking_popup.dart         # NEW - Booking alert popup
│   │   └── simple_button.dart             # NEW - Big icon button
│   └── providers/
│       └── booking_provider.dart         # MODIFY - Add polling
```

### 3.2 Notification Flow

```
Backend assigns worker
        ↓
FCM sends push notification
        ↓
Worker phone shows popup + plays sound
        ↓
Worker taps Accept/Reject
        ↓
Backend updates booking status
        ↓
Worker sees updated list
```

### 3.3 Backend Changes

**New endpoint to add:**
```
POST /api/notifications/worker/:workerId
- Trigger push notification
- Include booking details
- Include action buttons
```

---

## 4. Industry Best Practices

### 4.1 Notification Best Practices (Gig Economy)

| Practice | Implementation |
|----------|----------------|
| **Immediate feedback** | Sound plays within 1 second |
| **Hard to miss** | Full-screen popup, vibration |
| **One-tap action** | Big Accept button |
| **Offline capable** | Local notification if no internet |
| **Respect quiet hours** | Worker can set "Do Not Disturb" |

### 4.2 Worker-Friendly UX

| Problem | Solution |
|---------|----------|
| Can't read text | Use icons only |
| Can't understand English | **Add Hindi language support** |
| Too many steps | One-tap accept |
| Misses notifications | Repeat sound every 30s until action |
| Doesn't check app | Auto-popup on new booking |

### 4.3 Safety & Reliability

- **Confirm before action**: Long-press to reject (prevent accidental)
- **Undo option**: 10-second window to cancel accept
- **Backup plan**: If no response in 5 min, auto-assign next worker

---

## 5. Implementation Priority

### Phase 1: Basic Notifications
- [ ] Add `firebase_messaging` package
- [ ] Configure FCM in app
- [ ] Test push notifications

### Phase 2: Sound & Popup
- [ ] Add sound service
- [ ] Create booking popup widget
- [ ] Implement vibration

### Phase 3: Worker-Friendly UI
- [ ] Redesign home screen with big icons
- [ ] **Add Hindi language support - all UI labels in Hindi**
- [ ] One-tap accept button

### Phase 4: Polish
- [ ] Add "Do Not Disturb" setting
- [ ] Add notification history
- [ ] Test end-to-end flow

---

## 6. Files to Modify

1. `worker_app_flutter/pubspec.yaml` - Add packages
2. `worker_app_flutter/lib/main.dart` - Initialize FCM
3. `worker_app_flutter/lib/services/notification_service.dart` - NEW
4. `worker_app_flutter/lib/widgets/new_booking_popup.dart` - NEW
5. `worker_app_flutter/lib/screens/home_screen.dart` - Add polling
6. `flutter-nest-househelp-master/src/notifications/` - Add push sending

---

## 7. Questions Before Implementation

1. **Sound preference**: Should we use default system sound or custom?
2. **Hindi support**: Should we add Hindi as primary language option? ✅ **YES - User requested**
3. **Quiet hours**: Do you want workers to set "Do Not Disturb" times?
4. **Rejection reason**: Should we ask for rejection reason? (optional)

---

## 8. Hindi Localization (For Non-English Speaking Workers)

### UI Text Translation Plan

| English | Hindi (हिंदी) | Icon |
|---------|--------------|------|
| Jobs | काम | 🧹 |
| Earnings | कमाई | 💰 |
| Profile | प्रोफ़ाइल | 👤 |
| Settings | सेटिंग्स | ⚙️ |
| Accept | स्वीकार करें | ✅ |
| Reject | मना करें | ❌ |
| New Job! | नया काम! | 🔔 |
| Start Job | काम शुरू करें | ▶️ |
| Complete Job | काम पूरा करें | ✔️ |
| Online | ऑनलाइन (काम मिलेगा) | 🟢 |
| Offline | ऑफ़लाइन (काम नहीं मिलेगा) | 🔴 |

### Notification Messages (Hindi)

| Event | Hindi Message |
|-------|---------------|
| New Booking | "नया काम मिला! जल्दी देखें" |
| Booking Accepted | "काम स्वीकार हो गया!" |
| Job Started | "काम शुरू हो गया" |
| Job Completed | "काम पूरा! पैसे मिलेंगे" |
| Payment Received | "पैसे मिल गए!" |

---

## 9. Summary

This plan transforms the worker app to be notification-first, with:
- **Real-time push notifications** for instant booking alerts
- **Loud sounds** so workers don't miss jobs
- **Big visual popups** that are hard to ignore
- **Simple icon-based UI** for easy use by non-educated workers

The implementation can be done in 4 phases over 1-2 weeks.
