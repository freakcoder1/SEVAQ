# Worker App Login & Registration - Issues & Requirements

## Current Status Analysis

### Problem Summary
The worker app fails at worker registration with 404 errors:
- `POST /api/auth/workers/register` → 404 Not Found
- `GET /api/workers/me/bookings` → 404 Not Found  
- `GET /api/workers/me/earnings` → 404 Not Found

### Root Cause Analysis
Looking at the backend source code:
1. The endpoint `POST /api/auth/workers/register` EXISTS in `auth.controller.ts` (lines 99-113)
2. The endpoint `GET /api/workers/me/bookings` EXISTS in `workers.controller.ts` (lines 95+)
3. The endpoint `GET /api/workers/me/earnings` - needs verification

**Possible causes:**
- The production deployment may not have these endpoints deployed
- CORS configuration might be blocking the requests
- The worker app is hitting the wrong API URL in debug mode

---

## Required Backend Fixes (Priority Order)

### 1. Worker Registration Endpoint
**Endpoint:** `POST /api/auth/workers/register`
**Purpose:** Create a new worker with phone-based OTP auth

**Expected Request Body:**
```json
{
  "email": "worker@example.com",
  "password": "auto-generated",
  "name": "Worker Name",
  "phone": "+919999999999",
  "services": ["cooking", "cleaning"],
  "area": "Sector 62",
  "city": "Noida"
}
```

**Expected Response:**
```json
{
  "access_token": "jwt_token",
  "worker": { ... }
}
```

### 2. OTP Verification for Login
**Endpoint:** `POST /api/auth/otp/verify-login`  
**Purpose:** Verify OTP and login existing worker OR create new user account

**Current Issue:** Returns 400 Bad Request - likely expecting different payload format

**Expected Request Body:**
```json
{
  "phone": "+919999999999",
  "otp": "123456"
}
```

OR with Firebase ID token:
```json
{
  "phone": "+919999999999", 
  "idToken": "firebase_id_token"
}
```

### 3. Worker Bookings Endpoint
**Endpoint:** `GET /api/workers/me/bookings`
**Purpose:** Get assigned bookings for current worker

**Headers:** `Authorization: Bearer <jwt_token>`

**Expected Response:**
```json
[
  {
    "id": "uuid",
    "serviceName": "Cooking",
    "scheduledDate": "2026-03-29",
    "startTime": "08:00",
    "status": "CONFIRMED",
    "customerName": "John",
    "address": "123 Main St"
  }
]
```

### 4. Worker Earnings Endpoint  
**Endpoint:** `GET /api/workers/me/earnings`
**Purpose:** Get worker's earnings summary

**Headers:** `Authorization: Bearer <jwt_token>`

**Expected Response:**
```json
{
  "thisMonth": 15000,
  "lastMonth": 12000,
  "total": 27000
}
```

---

## Frontend Requirements

### Login Flow (OTP-based)
1. **Phone Input Screen**
   - Country code selector (+91 for India)
   - 10-digit phone number input
   - "Send OTP" button
   
2. **OTP Verification Screen**
   - 6-digit OTP input with auto-read support
   - Timer for resend (30 seconds)
   - "Verify" button
   
3. **Post-OTP Flow**
   - If new user → Registration form
   - If existing user → Home screen

### Registration Flow (For New Workers)
1. **Basic Info**
   - Full name (required)
   - Profile photo (optional)
   
2. **Service Selection**
   - Multi-select chips: Cooking, Cleaning, Washing, etc.
   
3. **Area/Location**
   - City/District dropdown
   - Locality/Area text input

4. **Availability Toggle**
   - Default: Available (Online)

### Home Screen Features
1. **Welcome Card**
   - Worker name
   - Availability toggle (Online/Offline)
   - Total jobs completed
   
2. **Today's Summary**
   - New bookings count
   - In-progress count
   - Completed count
   
3. **Earnings Card**
   - This month total
   - Last month comparison
   
4. **Upcoming Jobs**
   - List of pending/in-progress bookings
   - Tap to view details
   
5. **New Booking Popup** (when push notification received)
   - Service name
   - Customer name & address
   - Scheduled time
   - Estimated amount
   - Accept / Decline buttons

---

## Proposed Solution Path

### Step 1: Verify Backend Endpoints
- Check if production Railway deployment has latest code
- Test each endpoint manually using Postman/curl

### Step 2: Fix Frontend API Calls
- Update API service to use correct endpoint paths
- Add proper error handling and retry logic

### Step 3: Add OTP Flow Enhancements
- Implement proper OTP timeout/retry
- Add phone number validation
- Handle network errors gracefully

### Step 4: Test End-to-End
- Complete registration flow
- Verify login works for existing workers
- Confirm bookings and earnings load correctly

---

## Technical Implementation Notes

### JWT Token Structure
The token should include:
```json
{
  "sub": "user_id",
  "email": "user@email.com", 
  "role": "worker",
  "workerId": "worker_uuid",
  "iat": timestamp,
  "exp": timestamp
}
```

### FCM Token Registration
Worker should register FCM token after login:
- `POST /api/workers/me/fcm-token`
- Body: `{ "fcmToken": "firebase_token" }`

### Push Notification Payload
For new booking notifications:
```json
{
  "type": "new_booking",
  "bookingId": "uuid",
  "serviceName": "Cooking",
  "customerName": "John",
  "address": "123 Main St",
  "scheduledTime": "08:00",
  "amount": 300
}