# Worker Login & Registration Implementation Plan

## Overview
Implement full production-ready login and registration for the worker app, removing demo mode and fixing API integration issues.

## Issues Identified from Logs

1. **Worker Registration Fails** - `POST /api/auth/workers/register` returns **404**
   - But backend code shows the endpoint exists at `/auth/workers/register`
   - Likely routing issue or missing route configuration

2. **OTP Verification Fails** - `POST /api/auth/otp/verify-login` returns **400 Bad Request**
   - The request body format might be incorrect

3. **Worker Endpoints Return 404**:
   - `GET /workers/me` - Worker profile
   - `GET /workers/me/bookings` - Worker bookings  
   - `GET /workers/me/earnings` - Worker earnings

4. **Demo Login Bypasses Real Auth** - Currently just does `Future.delayed` and navigates directly

---

## Implementation Tasks

### Phase 1: Fix Login Screen (`worker_app_flutter/lib/screens/login_screen.dart`)

#### Task 1.1: Remove Demo Login
- Remove the `_demoLogin()` method completely
- Remove the "Demo Login (Skip Auth)" button
- This forces users to use real authentication

#### Task 1.2: Fix Email Login
- Use `POST /auth/login` with `{email, password}`
- Handle success: save JWT token, fetch worker profile, navigate to main screen
- Handle errors: display user-friendly messages
- Handle 401: "Invalid email or password"
- Handle network errors: "Please check your internet connection"

#### Task 1.3: Fix OTP Login
- The current OTP flow sends phone number then verifies OTP
- Need to properly handle Firebase OTP flow:
  - Send phone → Firebase sends OTP → User enters OTP → Get Firebase ID token → Call backend
- Fix the request body format for `auth/otp/verify-login`:
  ```json
  {
    "phone": "+919999999999",
    "idToken": "firebase_id_token_here"
  }
  ```
- Handle 400 errors properly

### Phase 2: Fix Registration Screen (`worker_app_flutter/lib/screens/signup_screen.dart`)

#### Task 2.1: Fix Registration API Call
- The endpoint is `POST /auth/workers/register`
- Request body needs to match backend DTO:
  ```json
  {
    "phone": "+919999999999",
    "email": "worker@example.com", 
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe",
    "serviceCategories": ["CLEANING", "COOKING"],
    "serviceArea": {
      "latitude": 28.5804,
      "longitude": 77.4392,
      "address": "Address here",
      "radiusKm": 5
    }
  }
  ```

#### Task 2.2: Handle Registration Errors
- 409 Conflict: "Email already registered" or "Phone already registered"
- 400 Bad Request: Show specific validation errors
- Network errors: "Please check your internet connection"

#### Task 2.3: Remove Demo Fallback
- Currently, on OTP verification error, it forces `_isPhoneVerified = true`
- Remove this demo behavior
- Show proper error message on OTP failure

### Phase 3: Update AuthProvider (`worker_app_flutter/lib/providers/auth_provider.dart`)

#### Task 3.1: Fix login() Method
- Ensure it calls `POST /auth/login`
- Parse response correctly: `response['access_token']`
- Store token properly

#### Task 3.2: Fix verifyOtp() Method  
- Ensure it calls `POST /auth/otp/verify-login`
- Fix request body format
- Handle response correctly

#### Task 3.3: Fix registerWorker() Method
- Ensure it calls `POST /auth/workers/register`
- Fix request body format
- Handle errors properly

#### Task 3.4: Add fetchWorkerProfile()
- This should call `GET /workers/me`
- Need to check if this endpoint exists in backend

### Phase 4: Backend Investigation

#### Task 4.1: Check Workers Module Routes
- Verify `/workers/me` endpoint exists
- Verify `/workers/me/bookings` endpoint exists
- Verify `/workers/me/earnings` endpoint exists
- If missing, they need to be created

---

## Implementation Order

```
1. Fix AuthProvider (backend communication)
2. Fix Login Screen (remove demo, fix real auth)
3. Fix Signup Screen (remove demo, fix registration)
4. Test and verify
5. If backend routes missing, create them
```

## Files to Modify

1. `worker_app_flutter/lib/providers/auth_provider.dart`
2. `worker_app_flutter/lib/screens/login_screen.dart` 
3. `worker_app_flutter/lib/screens/signup_screen.dart`
4. `worker_app_flutter/lib/services/api_service.dart` (if needed)

## Backend Files to Check/Create

1. `flutter-nest-househelp-master/src/workers/workers.controller.ts`
2. `flutter-nest-househelp-master/src/workers/workers.service.ts`
3. `flutter-nest-househelp-master/src/workers/workers.module.ts`

---

## Success Criteria

1. Worker can login with email/password and get JWT token
2. Worker can register and create worker profile
3. OTP login works (if Firebase configured)
4. No demo bypass - all auth is real
5. Proper error messages displayed for all failure cases
6. After login, worker sees their dashboard with bookings/earnings
