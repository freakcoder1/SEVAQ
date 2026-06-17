# COOK_05_Checkout Architecture Review (Final)

## 1. File Structure
```
lib/features/cooking/
├── presentation/
│   └── screens/
│       └── checkout_screen.dart
├── domain/
│   └── entities/
│       └── checkout_state.dart
└── providers/
    └── cooking_provider.dart (extend)
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Text ("Checkout")
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("Complete your subscription setup.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Order Summary)
│     │  │  ├─ Text ("Order Summary")
│     │  │  ├─ Text ("Persons: 3")
│     │  │  ├─ Text ("Meals:") with ✓ checkmarks
│     │  │  ├─ Text ("Start Date:")
│     │  │  └─ Text ("Time Window:")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Pricing Summary)
│     │  │  ├─ Text ("Pricing Summary")
│     │  │  ├─ Text ("Monthly Subscription")
│     │  │  ├─ Text ("₹X,XXX / month")
│     │  │  ├─ Text ("Setup Fee") + Text ("₹XXX")
│     │  │  ├─ Divider
│     │  │  ├─ Text ("Due Today") large + Text ("₹X,XXX")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Container (Reassurance Block)
│     │  │  ├─ Text ("You're almost done.")
│     │  │  └─ Text ("Your subscription will be activated after successful payment.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Text ("Payment Method")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ GridView (Payment cards: UPI, Credit/Debit Card)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Trust)
│     │  │  ├─ Text ("Secure Payments")
│     │  │  ├─ Row (✓ Secure payments)
│     │  │  ├─ Row (✓ Managed replacements)
│     │  │  └─ Row (✓ Quality monitoring)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ if (state.error != null) Error Text
│     │  └─ AppButton ("Complete Subscription")
```

## 3. State Structure
```dart
enum PaymentMethod { upi, creditDebitCard }

class CheckoutState {
  final PaymentMethod? selectedPaymentMethod;
  final bool isCreatingOrder;
  final String? error;

  const CheckoutState({
    this.selectedPaymentMethod,
    this.isCreatingOrder = false,
    this.error,
  });

  bool get canComplete => selectedPaymentMethod != null && !isCreatingOrder;

  CheckoutState copyWith({
    PaymentMethod? selectedPaymentMethod,
    bool? isCreatingOrder,
    String? error,
  }) {
    return CheckoutState(
      selectedPaymentMethod: selectedPaymentMethod ?? this.selectedPaymentMethod,
      isCreatingOrder: isCreatingOrder ?? this.isCreatingOrder,
      error: error,
    );
  }
}
```

## 4. Payment Method Strategy
- Card-based selection (matching COOK_01/02/03 pattern)
- UPI card with "Recommended" badge
- Credit/Debit Card card
- Selected: #EAF5F1 background, 2px border, check indicator

## 5. Pricing Presentation
- Monthly Subscription: "₹X,XXX / month" (secondary)
- Setup Fee: "₹XXX" (secondary)
- Divider visual separator
- Due Today: "₹X,XXX" (primary, larger text)

## 6. Validation Rules
- Payment method must be selected
- Error displayed inline if order creation fails

## 7. Navigation Flow
```text
/cooking/checkout
↓
[Complete Subscription] valid
↓
API: Create subscription order
↓
/cooking/payment
```

## 8. Loading States
- Button shows loading during order creation
- No skeleton loaders

## 9. Error States
```dart
Text(
  'Unable to create subscription. Please try again.',
  style: TextStyle(color: Colors.red),
)
```
Displayed above CTA when `error != null`