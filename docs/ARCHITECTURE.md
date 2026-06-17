# SevaQ Architecture

## Overview

Feature-first architecture with Riverpod state management, GoRouter navigation, and Material 3 design system.

## Layers

### Core
- `lib/core/theme/` - Design system tokens (colors, spacing, radius, theme)
- `lib/core/router/` - GoRouter configuration
- `lib/core/network/` - Dio API client

### Features

#### Auth (`/features/auth`)
- `presentation/screens/` - Login, OTP, Profile Setup
- `domain/entities/` - State models (LoginState, OtpState, ProfileSetupState)
- `providers/` - Riverpod providers (AuthNotifier, ProfileSetupNotifier)

#### Home (`/features/home`)
- `presentation/screens/` - Home dashboard
- `domain/entities/` - HomeState
- `providers/` - HomeNotifier

#### Cooking (`/features/cooking`)
- `presentation/screens/` - Service Details, Config, Schedule, Review, Checkout, Payment, Confirmation
- `domain/entities/` - State models for each screen
- `providers/` - CookingNotifier (unified state)

### Shared
- `lib/shared/components/` - Reusable UI components

## Navigation Flow

```
/login → /otp → /profile-setup → /home
/cooking → /cooking/subscription-config → /cooking/subscription-schedule
/cooking/review → /cooking/checkout → /cooking/payment → /cooking/confirmation
```

## State Management

Single `CookingNotifier` manages subscription flow state with nested state objects for each step.