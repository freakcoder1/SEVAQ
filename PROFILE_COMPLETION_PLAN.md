# Profile Completion Plan for First-Time OTP Users

## Problem Statement
When users log in for the first time using OTP, their profile is created with placeholder data:
- firstName: "User"
- lastName: phone number (without +)
- email: `user_${firebaseUid}@phone.auth`

We need to collect the user's actual name and email after their first OTP login.

## Solution Overview

### Approach: Post-Login Profile Completion Screen
After successful OTP login, check if the user needs profile completion and redirect to a profile completion screen if needed.

---

## Implementation Plan

### Step 1: Modify Backend - Return Profile Completion Flag

**File**: `flutter-nest-househelp-master/src/auth/firebase-auth.service.ts`

Modify the `verifyPhoneAndLogin` method to include a `needsProfileCompletion` flag in the response.

```typescript
// Check if profile needs completion (first-time phone auth user)
const needsProfileCompletion = 
  user.firstName === 'User' || 
  user.email?.endsWith('@phone.auth');

// Include in JWT payload or response
return {
  ...this.generateJwt(user),
  needsProfileCompletion,
};
```

### Step 2: Modify Frontend AuthProvider

**File**: `frontend-flutter-house-help-master/lib/providers/auth_provider.dart`

1. Parse the `needsProfileCompletion` flag from the login response
2. Store it in the provider state
3. Expose a method to check if profile needs completion

### Step 3: Create Profile Completion Screen

**File**: `frontend-flutter-house-help-master/lib/screens/profile_completion_screen.dart`

Create a new screen that:
- Shows a welcome message: "Welcome! Please complete your profile"
- Has fields for:
  - First Name (required)
  - Last Name (required)
  - Email Address (required)
- Has a "Continue" button
- Calls `PATCH /api/auth/profile` to update the user
- After successful update, navigates to MainScreen

### Step 4: Modify OTP Login Flow

**File**: `frontend-flutter-house-help-master/lib/screens/otp_login_screen.dart`

In `_handleVerificationSuccess()`:
```dart
if (success) {
  final authProvider = Provider.of<AuthProvider>(context, listen: false);
  
  // Check if profile needs completion
  if (authProvider.needsProfileCompletion) {
    // Navigate to profile completion screen
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const ProfileCompletionScreen()),
    );
  } else {
    // Navigate to home screen
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const MainScreen()),
      (route) => false,
    );
  }
}
```

---

## Files to Modify

1. **Backend**:
   - `flutter-nest-househelp-master/src/auth/firebase-auth.service.ts` - Add needsProfileCompletion flag

2. **Frontend**:
   - `frontend-flutter-house-help-master/lib/providers/auth_provider.dart` - Parse and store flag
   - `frontend-flutter-house-help-master/lib/screens/profile_completion_screen.dart` - NEW FILE
   - `frontend-flutter-house-help-master/lib/screens/otp_login_screen.dart` - Add navigation logic
   - `frontend-flutter-house-help-master/lib/main.dart` - Add route for profile completion

---

## API Endpoints Used

1. **POST /api/auth/otp/verify-login** - Already exists, will return new flag
2. **PATCH /api/auth/profile** - Already exists, accepts firstName, lastName, email

---

## Testing Checklist

- [ ] First-time OTP login shows profile completion screen
- [ ] Profile completion validates required fields
- [ ] Profile completion successfully updates user in database
- [ ] After completion, user can access main app
- [ ] Returning users (with complete profiles) skip the completion screen
- [ ] Profile data persists correctly in database
