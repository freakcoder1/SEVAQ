# AUTH_03_Profile_Setup Architecture Review (Revised)

## 1. File Structure
```
lib/features/auth/
├── presentation/
│   └── screens/
│       └── profile_setup_screen.dart
├── domain/
│   └── entities/
│       └── profile_setup_state.dart
└── providers/
    ├── auth_providers.dart (exports)
    ├── login_provider.dart
    ├── otp_provider.dart
    └── profile_setup_provider.dart
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Text (SEVAQ wordmark)
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ Text ("Let's get started", headlineLarge)
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("Create your account...", bodyLarge, textSecondary)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppTextField (First Name, height: 56)
│     │  ├─ SizedBox (AppSpacing.lg)
│     │  ├─ AppTextField (Last Name, height: 56)
│     │  ├─ SizedBox (AppSpacing.lg)
│     │  ├─ AppTextField (Email, height: 56)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Trust benefits)
│     │  │  ├─ Text ("Why create an account?")
│     │  │  ├─ SizedBox (AppSpacing.sm)
│     │  │  ├─ Row (✓ + "Book trusted professionals")
│     │  │  ├─ SizedBox (AppSpacing.sm)
│     │  │  ├─ Row (✓ + "Manage subscriptions easily")
│     │  │  ├─ SizedBox (AppSpacing.sm)
│     │  │  └─ Row (✓ + "View service history")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  └─ AppButton ("Continue Setup", isLoading, isEnabled)
```

## 3. State Structure
```dart
class ProfileSetupState {
  final String firstName;
  final String lastName;
  final String email;
  final bool isLoading;
  final String? error;

  const ProfileSetupState({
    this.firstName = '',
    this.lastName = '',
    this.email = '',
    this.isLoading = false,
    this.error,
  });

  bool get canSubmit => 
    firstName.length >= 2 && firstName.length <= 50 &&
    lastName.length >= 2 && lastName.length <= 50 &&
    _isValidEmail(email);

  bool _isValidEmail(String email) {
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    return emailRegex.hasMatch(email);
  }

  ProfileSetupState copyWith({...})
}
```

## 4. Validation Rules
- First Name: 2-50 chars (required)
- Last Name: 2-50 chars (required)
- Email: Valid format via regex, required

## 5. API Integration
```dart
POST /users/profile
{
  "firstName": "...",
  "lastName": "...",
  "email": "..."
}

Success → updateUserProvider(state) → context.go(AppRoutes.home)
```

## 6. Navigation Flow
```text
/profile-setup
↓
[Continue Setup] valid form + POST success
↓
updateUserProvider with profile data
↓
context.go(/home)
```

## 7. Loading States
- Button shows loading spinner
- Fields disabled during loading

## 8. Error States
- Inline error below Email field on validation/API failure

## Design Compliance
- ✅ Uses AppCard for trust section
- ✅ Same SEVAQ header, typography, spacing as Login/OTP
- ✅ No illustrations, progress bars, house icons, gamification