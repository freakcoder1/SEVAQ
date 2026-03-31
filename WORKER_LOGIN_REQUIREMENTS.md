# Worker App Login & Registration Requirements Analysis

## Current Issues Identified

Based on the debug logs, the worker app is experiencing these errors:
- `POST /api/auth/workers/register` returns 404 - endpoint doesn't exist
- `GET /api/workers/me/bookings` returns 404 - endpoint doesn't exist  
- `GET /api/workers/me/earnings` returns 404 - endpoint doesn't exist
- OTP verification returns 400 Bad Request

---

## Requirements for Worker Login & Registration

### 1. Authentication Flow (Phone OTP)

#### Registration Step-by-Step:
1. **Phone Number Entry** 
   - Worker enters 10-digit mobile number
   - Validation: Indian mobile format (+91XXXXXXXXXX)
   
2. **OTP Send**
   - API: `POST /api/auth/otp/send`
   - Request: `{ "phone": "+91XXXXXXXXXX", "role": "worker" }`
   - Response: `{ "success": true, "message": "OTP sent" }`
   
3. **OTP Verification**
   - API: `POST /api/auth/otp/verify`
   - Request: `{ "phone": "+91XXXXXXXXXX", "otp": "123456" }`
   - Response: `{ "success": true, "token": "jwt_token", "isNewUser": true/false }`
   
4. **Profile Completion** (For new users only)
   - API: `POST /api/auth/workers/register`
   - Request: `{ "name": "Worker Name", "phone": "+91XXXXXXXXXX", "services": ["cleaning", "cooking"], "area": "Sector 62", "city": "Noida" }`
   - Response: `{ "success": true, "worker": { ... }, "token": "jwt_token" }`

### 2. Login Flow (Existing Workers)

1. **Phone Number Entry**
2. **OTP Send** → **OTP Verify**
   - API: `POST /api/auth/otp/verify-login` (must handle returning users)
   - Response: `{ "success": true, "token": "jwt_token", "worker": { ... } }`

### 3. Required Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/otp/send` | POST | Send OTP to phone |
| `/api/auth/otp/verify` | POST | Verify OTP for registration |
| `/api/auth/otp/verify-login` | POST | Verify OTP for login (returning user) |
| `/api/auth/workers/register` | POST | Register new worker with profile |
| `/api/auth/workers/login` | POST | Worker login (optional alternative) |
| `/api/workers/me` | GET | Get current worker profile |
| `/api/workers/me` | PUT | Update worker profile |
| `/api/workers/me/bookings` | GET | Get worker's assigned bookings |
| `/api/workers/me/earnings` | GET | Get worker's earnings summary |
| `/api/workers/:id/availability` | PUT | Update availability status |
| `/api/workers/:id/fcm-token` | POST | Register FCM token for notifications |

### 4. Worker Profile Data Model

```
Worker {
  id: string (UUID)
  name: string
  phone: string (unique)
  email: string? (optional)
  profileImage: string? (URL)
  services: ServiceCategory[] (e.g., ["cooking", "cleaning", "washing"])
  area: string (locality/city area)
  city: string
  isAvailable: boolean (online/offline status)
  isVerified: boolean (admin verification)
  rating: number (0-5)
  totalJobs: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 5. Security Requirements

- JWT tokens with worker role claim
- Token expiry: 7 days
- Refresh token mechanism
- Phone number uniqueness validation
- OTP rate limiting (max 5 per hour)
- FCM token management for push notifications

### 6. Frontend Requirements

#### Login Screen:
- Phone input with country code (+91)
- OTP input (6 digits)
- Auto-OTP reading (if supported)
- Resend OTP button with countdown timer

#### Registration Screen:
- Full name input
- Service category selection (multi-select chips)
- Area/City selection (dropdown)
- Profile photo upload (optional)

#### Home Screen (post-login):
- Welcome message with worker name
- Availability toggle (online/offline)
- Today's bookings summary
- Earnings display
- Upcoming jobs list
- **New booking popup** with accept/decline

---

## Implementation Priority

### Phase 1 - Authentication (Critical)
1. Fix OTP send/verify endpoints
2. Create worker registration endpoint
3. Create worker login endpoint
4. Implement JWT auth guards

### Phase 2 - Core Features
1. Get worker bookings endpoint
2. Get worker earnings endpoint
3. Update availability endpoint

### Phase 3 - Enhancements
1. FCM token registration
2. Push notification handling
3. Sound/vibration alerts for new bookings