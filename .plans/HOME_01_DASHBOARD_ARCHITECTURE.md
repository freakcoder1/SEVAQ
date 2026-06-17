# HOME_01_Dashboard Architecture Review (Final)

## 1. File Structure
```
lib/features/home/
├── presentation/
│   └── screens/
│       └── home_screen.dart
├── domain/
│   └── entities/
│       └── home_state.dart
└── providers/
    └── home_provider.dart
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Text ("Good morning, [Name]")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ Text ("How can we help today?")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ KitchenOperationsCard
│     │  │  ├─ Text ("Kitchen Operations")
│     │  │  ├─ Text ("Daily cooking support")
│     │  │  └─ TextButton ("Explore")
│     │  ├─ SizedBox (AppSpacing.lg)
│     │  ├─ HomeMaintenanceCard
│     │  │  ├─ Text ("Home Maintenance")
│     │  │  ├─ Text ("Cleaning & upkeep")
│     │  │  └─ TextButton ("Explore")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ UpcomingServiceSection
│     │  │  ├─ Text ("Your Upcoming Service")
│     │  │  ├─ If booking:
│     │  │  │  ├─ Text ("[Service Type] Visit")
│     │  │  │  ├─ Text ("Tomorrow • 8:00 AM")
│     │  │  │  └─ Assigned Professional info
│     │  │  └─ If empty:
│     │  │     ├─ Text ("No services scheduled.")
│     │  │     └─ TextButton ("Explore Services")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  └─ ActiveSubscriptionSection
│     │     ├─ If subscription:
│     │     │  ├─ Text ("[Plan Name]")
│     │     │  ├─ Text ("Next Visit: Tomorrow")
│     │     │  └─ Text ("Renewal: 15 Jul")
│     │     └─ If empty:
│     │        ├─ Text ("No active subscriptions")
│     │        └─ TextButton ("Explore Plans")
```

## 3. State Structure
```dart
class HomeState {
  final String userName;
  final Booking? nextBooking;
  final int activeServiceCount;
  final int subscriptionCount;
  final bool hasActivePlan;
  final bool isLoading;
  final String? error;
}
```

## 4. API Requirements
- GET `/users/me` → userName
- GET `/bookings?status=upcoming&limit=1` → nextBooking
- GET `/subscriptions/me` → subscription data
- GET `/services/stats` → activeServiceCount

## 5. Loading States
- Static skeleton cards (no shimmer)
- Calm, minimal loading experience

## 6. Empty States
- Upcoming Service: "No services scheduled." + Explore Services button
- Subscriptions: "No active subscriptions" + Explore Plans button

## 7. Error States
- Inline error banner at top
- Retry button per section

## 8. Personalization Strategy
- Time-based greeting (morning/afternoon/evening)
- Next booking shows professional name + date/time
- Subscription card shows plan name + renewal date

## Design Compliance
- ✅ Two primary service cards with subtitles
- ✅ Upcoming service hero section
- ✅ Subscription summary section  
- ✅ No horizontal carousel
- ✅ No promotional banners
- ✅ Skeleton placeholders (no shimmer)
- ✅ Managed home operations feel