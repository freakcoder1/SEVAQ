# COOK_03_Subscription_Schedule Architecture Review (Final)

## 1. File Structure
```
lib/features/cooking/
├── presentation/
│   └── screens/
│       └── subscription_schedule_screen.dart
├── domain/
│   └── entities/
│       └── subscription_schedule_state.dart
└── providers/
    └── cooking_provider.dart (extend)
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Text ("Monthly Cooking Subscription")
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("When would you like service to begin?")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ GridView (Start Date cards: Today, Tomorrow, Choose Date)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Text ("Preferred Cooking Time")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ GridView (Time Window cards: Morning, Daytime, Afternoon, Evening)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Schedule Summary)
│     │  │  ├─ Text ("Plan Summary")
│     │  │  ├─ Text ("Persons: 3")
│     │  │  ├─ Text ("Meals:") with ✓ checkmarks
│     │  │  ├─ Text ("Service Starts:") with date + time
│     │  │  └─ etc
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Service Guarantee)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  └─ AppButton ("Continue")
```

## 3. State Structure
```dart
enum StartDateOption { today, tomorrow, custom }

class TimeWindow {
  final String label;
  final String range;
  const TimeWindow(this.label, this.range);
}

class SubscriptionScheduleState {
  final StartDateOption startDate;
  final DateTime? customDate;
  final TimeWindow? timeWindow;
  
  const SubscriptionScheduleState({
    this.startDate = StartDateOption.today,
    this.customDate,
    this.timeWindow,
  });

  bool get selectedStartDateIsValid =>
    startDate != StartDateOption.custom || customDate != null;

  bool get canContinue =>
    selectedStartDateIsValid &&
    timeWindow != null;

  SubscriptionScheduleState copyWith({
    StartDateOption? startDate,
    DateTime? customDate,
    TimeWindow? timeWindow,
  }) {
    return SubscriptionScheduleState(
      startDate: startDate ?? this.startDate,
      customDate: customDate ?? this.customDate,
      timeWindow: timeWindow ?? this.timeWindow,
    );
  }
}

class TimeWindows {
  static const morning = TimeWindow('Morning', '6 AM – 9 AM');
  static const daytime = TimeWindow('Daytime', '9 AM – 1 PM');
  static const afternoon = TimeWindow('Afternoon', '1 PM – 5 PM');
  static const evening = TimeWindow('Evening', '5 PM – 8 PM');
  static const all = [morning, daytime, afternoon, evening];
}
```

## 4. Validation Rules
- Time window required
- Custom date required only when `startDate == custom`
- Custom date must be valid future date

## 5. Navigation Flow
```text
/cooking/schedule
↓
[Continue] valid form
↓
/cooking/review
```

## 6. CTA Logic
- Continue disabled until valid start date AND time window selected
- Date picker modal opens on "Choose Date" tap

## 7. Empty States
No empty states - defaults: Today + Morning pre-selected

## 8. Error States
None - scheduling screen only

## Design Compliance
- ✅ Start Date as cards (Today, Tomorrow, Choose Date)
- ✅ Time windows: Morning (6–9 AM), Daytime (9 AM–1 PM), Afternoon (1–5 PM), Evening (5–8 PM)
- ✅ Schedule summary with Service Starts section
- ✅ Service Guarantee in AppCard
- ✅ No pricing, payment, checkout, calendar (date picker only on demand)
- ✅ Uses AppCard, AppButton, AppSpacing