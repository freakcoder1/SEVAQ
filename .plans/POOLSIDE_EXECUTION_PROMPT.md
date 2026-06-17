# POOLSIDE EXECUTION PROMPT - PHASE 1 FOUNDATION

## First Message for New Session

```text
Read and follow these files:

.plans/SEVAQ_MASTER_RECOVERY.md
.plans/SEVAQ_SCREEN_INVENTORY.md
.plans/SEVAQ_DESIGN_SYSTEM.md
.plans/SEVAQ_COMPONENT_LIBRARY.md
.plans/SEVAQ_API_MAPPING.md
.plans/SEVAQ_REBUILD_ROADMAP.md
.plans/SEVAQ_FOUNDATION_BUILD_PROMPT.md

Before writing any code, respond with:

1. Your understanding of SevaQ
2. The architecture you will create
3. The folder structure you will implement
4. All dependencies required
```

---

## Expected Poolside Response

```text
Understanding of SevaQ
```

SevaQ is a premium home service app offering:
- **Cooking subscriptions** - meal preparation services with persons/meal coverage configuration
- **Cleaning subscriptions** - home maintenance with apartment size/cleaning coverage configuration
- **One-time services** - occasional bookings for both cooking and cleaning
- **Managed service model** - verified professionals, replacement support, quality monitoring
- **Trust-first design** - calm, professional, premium aesthetic with green (#1A5D49) as primary color

Target screens (30 total): Login, OTP, Profile setup, Home dashboard, Cooking/Cleaning service details, subscriptions, scheduling, review, payment, bookings management, profile settings.

```text
Folder structure
```

```
lib/
├── core/
│   ├── theme/
│   │   ├── app_colors.dart
│   │   ├── app_typography.dart
│   │   ├── app_spacing.dart
│   │   ├── app_radius.dart
│   │   └── app_theme.dart
│   ├── router/
│   │   └── app_router.dart
│   ├── network/
│   │   └── api_client.dart
│   ├── constants/
│   │   └── app_constants.dart
│   └── utils/
├── shared/
│   ├── widgets/
│   ├── components/
│   └── models/
├── features/
│   ├── auth/
│   ├── home/
│   ├── cooking/
│   ├── cleaning/
│   ├── bookings/
│   └── profile/
└── main.dart
```

```text
Dependencies
```

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.0
  go_router: ^15.0.0
  http: ^1.2.0
  dio: ^5.7.0
  flutter_secure_storage: ^9.2.0
  shared_preferences: ^2.3.0
  intl: ^0.19.0
  google_fonts: ^6.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
```

```text
Architecture plan
```

1. **Core Layer** - Framework-independent utilities, theme, routing, network
2. **Shared Layer** - Reusable widgets and components across features
3. **Features Layer** - Feature-first organization with Riverpod providers
4. **Material 3** - Configured with SevaQ design system tokens
5. **GoRouter** - Declarative routing with typed route parameters
6. **Riverpod** - State management replacing existing provider package

```

---

## Confirmation Prompt (Send after Poolside responds correctly)

```text
Proceed with implementation.
```

---

## Verification Checklist

- [ ] Theme uses #1A5D49 as Primary Green
- [ ] Typography uses Inter font family
- [ ] Spacing follows 4, 8, 12, 16, 20, 24, 32, 40, 48 scale
- [ ] Border radius: Cards 20, Inputs 16, Buttons 16, Chips 14
- [ ] GoRouter configured with Material 3 transitions
- [ ] Riverpod ProviderScope in main.dart
- [ ] No UI screens created
- [ ] No business logic created