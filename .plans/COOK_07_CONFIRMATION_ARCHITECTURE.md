# COOK_07_Confirmation Architecture Review

## 1. File Structure
```
lib/features/cooking/
├── presentation/
│   └── screens/
│       └── confirmation_screen.dart
├── domain/
│   └── entities/
│       └── confirmation_state.dart
└── providers/
    └── cooking_provider.dart (extend)
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Icon (Icons.check_circle, primaryGreen, large)
│     │  ├─ SizedBox (AppSpacing.lg)
│     │  ├─ Text ("Subscription Confirmed")
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("Your cooking subscription is active.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Subscription Details)
│     │  │  ├─ Text ("Reference")
│     │  │  └─ Text ("SUB-12345")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ Text ("Start Date") + Text ("Tomorrow")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ Text ("Time Window") + Text ("Morning (6–9 AM)")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Text ("What Happens Next")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ _buildNextStepRow(context, "Professional matching begins")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ _buildNextStepRow(context, "Confirmation updates will appear in app")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ _buildNextStepRow(context, "Support available if needed")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Support)
│     │  │  ├─ Text ("Need help?")
│     │  │  └─ TextButton ("Contact Support")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppButton ("Return Home")
│     │  ├─ SizedBox (AppSpacing.lg)
│     │  └─ TextButton ("View Subscription")
```

## 3. State Structure
```dart
class ConfirmationState {
  final String subscriptionId;
  final String startDate;
  final String timeWindow;
  final String persons;
  final List<String> meals;

  const ConfirmationState({
    required this.subscriptionId,
    required this.startDate,
    required this.timeWindow,
    required this.persons,
    required this.meals,
  });

  ConfirmationState copyWith({
    String? subscriptionId,
    String? startDate,
    String? timeWindow,
    String? persons,
    List<String>? meals,
  }) {
    return ConfirmationState(
      subscriptionId: subscriptionId ?? this.subscriptionId,
      startDate: startDate ?? this.startDate,
      timeWindow: timeWindow ?? this.timeWindow,
      persons: persons ?? this.persons,
      meals: meals ?? this.meals,
    );
  }
}
```

## 4. Success Messaging
- Large check circle icon (primaryGreen)
- "Subscription Confirmed" (headlineLarge)
- "Your cooking subscription is active." (bodyLarge, secondary)

## 5. What Happens Next Section
- "Professional matching begins" with check icon
- "Confirmation updates will appear in app" with check icon
- "Support available if needed" with check icon

## 6. Support Strategy
- AppCard with "Need help?" heading
- "Contact Support" text button (triggers support flow)
- No phone numbers or emails inline (handled by support flow)

## 7. Navigation Flow
```text
/cooking/confirmation
↓
[Return Home] → /home
↓
[View Subscription] → /subscriptions/details
```

## 8. CTA Logic
- Return Home: Always enabled, navigates to /home
- View Subscription: Always enabled, navigates to subscription details (pending route)

## Design Compliance
- ✅ No confetti/animations
- ✅ No gamification
- ✅ Calm, premium, trustworthy aesthetic
- ✅ Uses AppCard, AppButton, AppSpacing
- ✅ Check icon throughout for trust