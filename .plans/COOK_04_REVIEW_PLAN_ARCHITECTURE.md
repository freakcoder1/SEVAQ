# COOK_04_Review_Plan Architecture Review (Final)

## 1. File Structure
```
lib/features/cooking/
├── presentation/
│   └── screens/
│       └── review_plan_screen.dart
├── domain/
│   └── entities/
│       └── review_plan_state.dart
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
│     │  ├─ Text ("Review your subscription before checkout.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Plan Summary)
│     │  │  ├─ Text ("Plan Summary")
│     │  │  ├─ Text ("Persons: 3")
│     │  │  ├─ Text ("Meals:") with ✓ checkmarks
│     │  │  ├─ Text ("Service Starts:") with date
│     │  │  ├─ Text ("Time:") with range
│     │  │  └─ TextButton ("Edit") → /cooking/subscription-config
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Container (Reassurance block)
│     │  │  ├─ Text ("You're all set.")
│     │  │  └─ Text ("We'll match you with a verified cooking professional based on your preferences.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Pricing Summary)
│     │  │  ├─ Text ("Monthly Subscription")
│     │  │  └─ Text ("₹X,XXX / month")
│     │  │  └─ Optional: Text ("One-time onboarding fee") + Text ("₹XXX")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Flexible Subscription)
│     │  │  ├─ Text ("Flexible Subscription")
│     │  │  ├─ Row (✓ Pause when needed)
│     │  │  ├─ Row (✓ Easily reschedule visits)
│     │  │  └─ Row (✓ Managed replacement support)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Service Guarantee)
│     │  │  ├─ Text ("Service Guarantee")
│     │  │  ├─ Text (✓ Verified professionals)
│     │  │  ├─ Text (✓ Managed replacements)
│     │  │  └─ Text (✓ Quality monitoring)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  └─ AppButton ("Continue to Checkout")
```

## 3. State Structure
```dart
class ReviewPlanState {
  final double monthlyCost;
  final double? setupFee; // Optional

  const ReviewPlanState({
    required this.monthlyCost,
    this.setupFee,
  });

  bool get canContinue => true; // Always enabled

  ReviewPlanState copyWith({
    double? monthlyCost,
    double? setupFee,
  }) {
    return ReviewPlanState(
      monthlyCost: monthlyCost ?? this.monthlyCost,
      setupFee: setupFee ?? this.setupFee,
    );
  }
}
```

## 4. Pricing Structure
Pricing read from cooking flow state (config + schedule). Display only:
- Monthly cost formatted as "₹X,XXX / month"
- Optional setup fee

## 5. Validation Rules
None - Review screen is read-only summary

## 6. Navigation Flow
```text
/cooking/review
↓
[Edit] → /cooking/subscription-config
↓
[Continue to Checkout] → /cooking/checkout
```

## 7. CTA Logic
- Continue always enabled
- Navigate to checkout/payment screen

## 8. Error States
None - Review screen is read-only

## Design Compliance
- ✅ Plan Summary with Edit button
- ✅ You're all set reassurance block
- ✅ Pricing Summary (simple, no logic exposure)
- ✅ Flexible Subscription card (customer-focused copy)
- ✅ Service Guarantee card
- ✅ No payment methods, coupons, taxes, order confirmation
- ✅ Uses AppCard, AppButton, AppSpacing