# Worker App Login & Registration - Requirements Analysis

## Current State

The worker app at `worker_app_flutter/` has login and registration screens but they are **not working** due to backend API issues.

### Issues Found

1. **Registration Endpoint 404**: The worker app tries to call `POST /api/auth/workers/register` but this returns 404 on the production server.

2. **Worker Endpoints Require Authentication**: The worker app tries to call:
   - `GET /api/workers/me/bookings` → Returns 404 (requires JWT auth)
   - `GET /api/workers/me/earnings` → Returns 404 (requires JWT auth)

3. **OTP Login Returns 400**: The verify-login endpoint returns 400 Bad Request even with valid parameters.

---

## Required Backend Fixes

### 1. Enable Worker Registration Endpoint
**Issue**: `POST /api/auth/workers/register` returns 404

**Expected**: Should create new worker with user account and worker profile

**Required DTO Fields**:
```typescript
{
  phone: string;        // e.g., "+919999999999"
  email: string;        // e.g., "worker@example.com"
  password: string;    // min 8 chars
  firstName: string;
  lastName: string;
  address?: string;
  serviceCategories?: string[];  // e.g., ["CLEANING", "COOKING"]
  serviceArea?: {
    latitude: number;
    longitude: number;
    address: string;
    radiusKm?: number;
  };
}
```

**Response**:
```typescript
{
  access_token: string;  // JWT token for authentication
  user: { id, email, phone, role };
  worker: { id, name, services, isAvailable };
}
```

---

### 2. Fix OTP Login Endpoint
**Issue**: `POST /api/auth/otp/verify-login` returns 400 Bad Request

**Required DTO**:
```typescript
{
  phone: string;    // e.g., "+919999999999"
  idToken: string; // Firebase ID token or "dev_test_token" for dev
}
```

**Response**:
```typescript
{
  access_token: string;  // JWT token
  user: { id, email, phone, role };
}
```

---

### 3. Enable Worker-Specific Endpoints
**Current Issue**: `/api/workers/me/*` endpoints don't work after login

**Expected Endpoints** (all require JWT auth):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workers/me` | Get worker profile |
| GET | `/api/workers/me/bookings` | Get assigned bookings |
| GET | `/api/workers/me/earnings` | Get earnings summary |
| PATCH | `/api/workers/me/availability` | Toggle availability |
| POST | `/api/workers/bookings/:id/accept` | Accept booking |
| POST | `/api/workers/bookings/:id/reject` | Reject booking |
| POST | `/api/workers/bookings/:id/start` | Start job |
| POST | `/api/workers/bookings/:id/complete` | Complete job |

---

## Worker App Frontend Requirements

### Login Screen (`login_screen.dart`)
✅ Already implemented:
- Email/Password login
- OTP login with Firebase
- Demo mode (dev_test_token)

**Needs**: Backend endpoint to work

### Signup Screen (`signup_screen.dart`)
✅ Already implemented (5-step wizard):
1. Phone number → OTP verification
2. Personal details (name, email, password)
3. Service selection (CLEANING, COOKING, MAID)
4. Location/address
5. Review & submit

**Needs**: Backend endpoint `POST /api/auth/workers/register` to work

### Auth Provider (`auth_provider.dart`)
✅ Already implemented methods:
- `login(email, password)` → calls `/auth/login`
- `verifyOtpWithToken(phone, idToken)` → calls `/auth/otp/verify-login`
- `registerWorker(...)` → calls `/auth/workers/register`
- `fetchWorkerProfile()` → calls `/workers/me`

**Needs**: Backend to respond correctly

---

## What We Need From You

To proceed with fixing the worker app, please confirm:

1. **Do you want me to fix the backend first?** (most critical - without backend fixes, nothing will work)

2. **Should I also update the Flutter frontend?** (improve error handling, add better UI)

3. **Priority order**:
   - Option A: Fix backend → then test worker app
   - Option B: Add demo mode to worker app (bypass real API)
   - Option C: Create new simpler registration flow

---

## Next Steps

The most important fix is on the **backend** - the worker registration endpoint needs to be deployed to Railway. Let me know how you'd like to proceed!