# COOK_06_Payment Architecture Review (Final)

## 1. File Structure
```
lib/features/cooking/
├── presentation/
│   └── screens/
│       └── payment_screen.dart
├── domain/
│   └── entities/
│       └── payment_state.dart
└── providers/
    └── cooking_provider.dart (extend)
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Text ("Payment")
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("Complete your subscription payment.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Order Summary)
│     │  │  ├─ Text ("Order #12345")
│     │  │  ├─ Text ("Amount Due")
│     │  │  └─ Text ("₹X,XXX")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Payment Method)
│     │  │  ├─ Text ("Payment Method")
│     │  │  └─ Text ("UPI")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Container (Secure Payment)
│     │  │  ├─ Text ("Secure Payment")
│     │  │  └─ Text ("Your payment is processed securely through our payment partner.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ if (status == idle) AppButton ("Pay Now")
│     │  ├─ if (status == processing) Column
│     │  │  ├─ Text ("Processing payment...")
│     │  │  └─ CircularProgressIndicator
│     │  ├─ if (status == failed) Column
│     │  │  ├─ Text ("Payment failed. Please try again.")
│     │  │  └─ AppButton ("Retry Payment")
│     │  ├─ if (status == success) Column
│     │  │  ├─ Text ("Payment successful.")
│     │  │  └─ Text ("Redirecting...")
```

## 3. State Structure
```dart
enum PaymentStatus { idle, processing, success, failed }

class PaymentState {
  final String orderId;
  final PaymentMethod paymentMethod;
  final PaymentStatus status;
  final String? gatewayReference;
  final String? error;

  const PaymentState({
    required this.orderId,
    required this.paymentMethod,
    this.status = PaymentStatus.idle,
    this.gatewayReference,
    this.error,
  });

  bool get isProcessing => status == PaymentStatus.processing;
  bool get canRetry => status == PaymentStatus.failed;
  bool get isSuccess => status == PaymentStatus.success;

  PaymentState copyWith({
    PaymentStatus? status,
    String? gatewayReference,
    String? error,
  }) {
    return PaymentState(
      orderId: orderId,
      paymentMethod: paymentMethod,
      status: status ?? this.status,
      gatewayReference: gatewayReference ?? this.gatewayReference,
      error: error,
    );
  }
}
```

## 4. Gateway Strategy
- `initiatePayment(orderId, method)` → opens gateway
- Success callback → status = success, gatewayReference
- Failure callback → status = failed, error message
- Retry → calls `initiatePayment` again

## 5. Navigation Flow
```text
/cooking/payment?orderId=12345&method=upi
↓
[Pay Now]
↓
Gateway Handoff
↓
Success → /cooking/confirmation (after 1-2s)
Failure → Stay on screen with retry
```

## 6. Loading States
- `processing`: Show "Processing payment..." text + progress indicator
- Button disabled during processing

## 7. Error States
"Payment failed. Please try again." with Retry button

## 8. Success States
"Payment successful." → "Redirecting..." → navigate after delay

## Design Compliance
- ✅ Secure Payment trust block
- ✅ Success state visible before redirect
- ✅ No card/UPI forms
- ✅ Gateway handoff only