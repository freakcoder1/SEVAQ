# COOK_01_Service_Details Architecture Review (Revised)

## 1. File Structure
```
lib/features/cooking/
├── presentation/
│   └── screens/
│       └── service_details_screen.dart
├── domain/
│   └── entities/
│       └── service_details_state.dart
└── providers/
    └── cooking_provider.dart
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Text ("Kitchen Operations")
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("Professional cooking support tailored to your home.")
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("Whether you need help occasionally or daily support...")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ OneTimeServiceCard (tappable)
│     │  ├─ SizedBox (AppSpacing.lg)
│     │  ├─ SubscriptionCard (tappable)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ ServiceGuaranteeCard
│     │  │  ├─ Text ("Service Guarantee")
│     │  │  ├─ Row (✓ Verified professionals)
│     │  │  ├─ SizedBox (AppSpacing.sm)
│     │  │  ├─ Row (✓ Managed replacements)
│     │  │  ├─ SizedBox (AppSpacing.sm)
│     │  │  └─ Row (✓ Quality monitoring)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  └─ AppButton ("Continue")
```

## 3. State Structure
```dart
enum ServiceSelection { none, oneTime, subscription }

class ServiceDetailsState {
  final ServiceSelection selectedService;

  const ServiceDetailsState({
    this.selectedService = ServiceSelection.none,
  });

  bool get canContinue => selectedService != ServiceSelection.none;

  ServiceDetailsState copyWith({ServiceSelection? selectedService}) {
    return ServiceDetailsState(
      selectedService: selectedService ?? this.selectedService,
    );
  }
}
```

## 4. Navigation Flow
```text
/cooking
↓
One-Time selected
→ /cooking/one-time-schedule

Subscription selected
→ /cooking/subscription-config

Continue enabled
→ Navigate to selection-specific route
```

## 5. CTA Logic
- Cards: Tappable to select service type
- Continue: Single CTA navigates to appropriate flow

## 6. Empty/Loading/Error States
None needed - static informational screen

## 7. Design Compliance
- ✅ Service description block before selection
- ✅ Cards have context with bullet points
- ✅ No Select buttons on cards - tap-to-select
- ✅ Service Guarantee in AppCard
- ✅ No pricing, no scheduling, no configuration
- ✅ Selection + education focused