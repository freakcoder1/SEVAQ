# AUTH_02_OTP_Architecture - Final

## File Structure
```
lib/features/auth/
├── presentation/
│   └── screens/
│       └── otp_screen.dart
├── domain/
│   └── entities/
│       └── otp_state.dart
├── providers/
│   └── auth_providers.dart (extended)
└── widgets/
    └── otp_input_field.dart (hidden field + 6 visual boxes)
```

## Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding
│     ├─ Column
│     │  ├─ Text (SEVAQ wordmark, uppercase, letter-spacing: 2)
│     │  ├─ SizedBox (spacing: 8)
│     │  ├─ Text (title: "Verify your mobile number")
│     │  ├─ SizedBox (spacing: 8)
│     │  ├─ Text ("We sent a 6-digit code to")
│     │  ├─ Text ("+91 XXXXX XXXXX")
│     │  ├─ SizedBox (spacing: 8)
│     │  ├─ TextButton ("Change number")
│     │  ├─ SizedBox (spacing: 32)
│     │  ├─ OTPInputField (hidden TextFormField + 6 styled boxes)
│     │  ├─ SizedBox (spacing: 8)
│     │  ├─ Text (inline error, if error)
│     │  ├─ Text (expired message, if expired)
│     │  ├─ SizedBox (spacing: 32)
│     │  ├─ AppButton (Verify, FULL-width, auto-hidden when loading)
│     │  ├─ SizedBox (spacing: 16)
│     │  └─ Resend section
```

## Resend Section States
```text
Before expiry (timer > 0):
  Text: "Resend OTP in 0:${timer.toString().padLeft(2, '0')}"

After expiry (timer == 0):
  Text: "Didn't receive code?")
  SizedBox (spacing: 4)
  TextButton: "Resend OTP"
```

## State Machine
```dart
enum OtpStatus {
  idle,        // Waiting for input
  verifying,   // API call in progress
  verified,    // Success, waiting for navigation
  failed,      // Invalid OTP or network error
  expired,     // OTP expired, can resend
}

class OtpState {
  final String phoneNumber;
  final String otp;
  final OtpStatus status;
  final String? error;
  final int resendTimer;
}

// Derived states
bool get canSubmit => otp.length == 6 && status == OtpStatus.idle;
bool get canResend => resendTimer == 0 && (status == OtpStatus.expired || status == OtpStatus.failed);
bool get isVerifying => status == OtpStatus.verifying;
bool get isExpired => status == OtpStatus.expired;
```

## Auto-Fill Strategy
```text
Android: SmsRetriever API (Firebase)
       ↓
autoSubmitOtp(String code)
       ↓
Provider sets otp value
       ↓
6 digits reached
       ↓
150ms debounce
       ↓
Auto-verify triggered
```

## Paste Handling
```text
User pastes "123456"
↓
onChanged callback receives full string
↓
Visual boxes update instantly (each digit in cell)
↓
If 6 digits → 150ms debounce → verify
```

## OTP Expired Recovery
```text
OTP expires
↓
Status = expired
↓
OTP boxes remain visible (unchanged)
↓
Inline message below boxes: "Your code has expired."
↓
Resend becomes available (timer at 0)
```

## Verification Debounce
```text
Digit 6 entered
↓
150ms debounce (Timer in provider)
↓
Prevent duplicate API calls
↓
Verify
```

## Change Number Flow
```text
onTap: "Change number"
↓
context.pop() // Removes /otp route
↓
Returns to /login
↓
LoginScreen restores via ref.read(loginProvider).phoneNumber
```

## Navigation Flow
```text
6 digits entered + auto-verify
↓
POST /auth/verify-otp
↓
Response: {"token": "...", "user": {"newUser": true/false}}
↓
If newUser == true:
  context.go(AppRoutes.profileSetup)
↓
If newUser == false:
  context.go(AppRoutes.home)
```

## Validation Rules
- OTP: Exactly 6 digits (regex: `^\d{6}$`)
- Auto-submit when 6 digits entered AND status == idle
- Real-time validation per digit change

## Error Display
```text
Inline below OTP boxes:
Text(
  error,
  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
    color: AppColors.error,
  ),
)
```

## Expired Message Display
```text
Inline below OTP boxes (when expired):
Text(
  "Your code has expired.",
  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
    color: AppColors.warning,
  ),
)
```

## Loading States
- Button hidden when `status == OtpStatus.verifying`
- `AppLoading` shown centered during verification
- OTP boxes disabled during loading

## Design Compliance
- Minimal layout (no illustrations)
- Primary green (#1A5D49) for Verify button
- 32px vertical rhythm between sections
- Trust messaging with phone number display
- Uppercase SEVAQ wordmark