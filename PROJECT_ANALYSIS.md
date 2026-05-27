# SEVAQ House Help Platform - Complete Project Analysis

## Executive Summary

SEVAQ is a multi-platform service marketplace connecting customers with professional service providers (maids, cooks, cleaners, etc.). The platform consists of three main components:

1. **Backend**: NestJS API server (`flutter-nest-househelp-master`)
2. **Customer App**: Flutter mobile application (`frontend-flutter-house-help-master`)
3. **Worker App**: Flutter mobile application for service providers (`worker_app_flutter`)

---

## 1. Backend Architecture

### 1.1 Technology Stack
- **Framework**: NestJS with TypeORM
- **Database**: PostgreSQL with UUID primary keys for public APIs
- **Authentication**: JWT with 1-hour access tokens, 30-day refresh tokens
- **Real-time**: Firebase Cloud Messaging (FCM) for push notifications
- **Scheduling**: NestJS Schedule with cron jobs for pre-service reminders

### 1.2 Core Modules

| Module | Purpose |
|--------|---------|
| `auth` | JWT authentication, refresh tokens, worker registration |
| `users` | User management, profile operations |
| `workers` | Worker profiles, availability, booking operations |
| `bookings` | Booking lifecycle, status transitions, assignment |
| `services` | Service categories, pricing, worker-service mapping |
| `notifications` | FCM push notifications, pre-service reminders |
| `subscriptions` | Recurring service subscriptions |
| `addresses` | User address management |
| `slots` | Time slot management for workers |
| `payments` | Payment processing |
| `reviews` | Rating and review system |

### 1.3 Entity Design Patterns

#### Dual ID System
- **Internal ID**: Auto-increment `number` (used for database relations)
- **Public ID**: UUID `string` (used for external API)

```typescript
// Example: User entity
@PrimaryGeneratedColumn()
id: number;  // Internal ID

@Column('uuid', { unique: true, nullable: false })
publicId: string;  // Public API ID
```

#### Key Entities

**User** (`user.entity.ts`):
- `id`: number (internal)
- `publicId`: UUID
- `email`, `phone`, `password`
- `firstName`, `lastName`
- `role`: 'user' | 'worker' | 'admin'
- `fcmToken`: for push notifications

**Worker** (`worker.entity.ts`):
- `id`: number (internal)
- `publicId`: UUID
- `userId`: FK to User
- `bio`, `rating`, `reviewCount`
- `yearsOfExperience`, `homesServedInArea`
- `isVerified`, `isTrained`, `isMonitored`
- `latitude`, `longitude` (service area)
- `isAvailable`, `serviceRadiusKm`
- `fcmToken`

**Booking** (`booking.entity.ts`):
- `id`: UUID (primary key)
- `publicId`: UUID
- `userId`: UUID (references User.publicId)
- `workerId`: number (nullable, references Worker.id)
- `assignedWorkerId`: number (nullable, references Worker.id)
- `status`: 'requested' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
- `assignmentState`: 'pending' | 'assigned' | 'confirmed' | 'reassigning' | 'cancelled'
- `preServiceReminderSent`: boolean
- `notificationSent`: boolean

---

## 2. Authentication System

### 2.1 JWT Token Structure
```typescript
const payload = {
  email: user.email,
  sub: user.publicId,  // Uses UUID, not numeric ID
  role: user.role,
};
```

### 2.2 Token Refresh Flow
1. Access token expires after 1 hour
2. Client uses refresh token to get new access token
3. Refresh token rotation: old token is revoked, new one created

### 2.3 Firebase Authentication
- Phone/OTP-based authentication via Firebase
- Private key parsing with escaped newline handling:
```typescript
// Fix for escaped newlines in FIREBASE_SERVICE_ACCOUNT
while (key.includes('\\n')) {
  key = key.replace(/\\n/g, '\n');
}
```

---

## 3. Booking System

### 3.1 Status Transitions
```
REQUESTED → PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
                    ↘ CANCELLED
```

### 3.2 Assignment States
- `pending`: Initial state, waiting for worker assignment
- `assigned`: Worker has been assigned
- `confirmed`: Worker accepted the booking
- `reassigning`: Looking for new worker
- `cancelled`: Assignment cancelled

### 3.3 Worker Assignment Logic
```typescript
// In workers.service.ts - acceptBooking method
const isAssignedToWorker = 
  booking.workerId === workerId || 
  String(booking.assignedWorkerId) === worker?.publicId;
```

**Note**: There's a type mismatch issue - `assignedWorkerId` is typed as `number` in the entity but compared with `worker.publicId` (UUID).

---

## 4. Notification System

### 4.1 FCM Implementation
- Uses direct HTTP API (bypasses Firebase Admin SDK parser issues)
- Full-screen notifications for worker booking alerts
- Automatic cleanup of invalid FCM tokens

### 4.2 Pre-Service Reminders
- **T-24h reminder**: Sent 24 hours before service
- **T-2h reminder**: Sent 2 hours before service
- Uses `preServiceReminderSent` flag to prevent duplicates

### 4.3 Notification Status Bug
**Issue in `notifyWorkerNewBooking` (line 487-488)**:
```typescript
// Mark notification as sent to prevent duplicates
booking.notificationSent = true;
// BUG: Booking is never saved!
```

**Fix needed**:
```typescript
booking.notificationSent = true;
await this.bookingsRepository.save(booking);
```

---

## 5. Flutter Applications

### 5.1 Customer App (`frontend-flutter-house-help-master`)

**Key Features**:
- JWT token management with auto-refresh
- Exponential backoff retry for token refresh
- Safe type handling in model `fromJson` factories

**API Service Pattern**:
```dart
// Safe type handling
double? safeDouble(dynamic val) {
  if (val == null) return null;
  if (val is double) return val;
  if (val is int) return val.toDouble();
  return double.tryParse(val.toString());
}
```

### 5.2 Worker App (`worker_app_flutter`)

**Key Differences from Customer App**:
- Uses `worker_jwt_token` key for token storage
- Simpler API service (no auto-refresh on token expiry)
- Separate notification handling

---

## 6. Identified Issues & Bugs

### 6.1 Type Mismatch in Booking Entity
**Location**: `booking.entity.ts` lines 101-109

**Issue**: `assignedWorkerId` is typed as `number` but compared with `worker.publicId` (UUID)

**Impact**: Potential runtime errors, confusion in assignment logic

### 6.2 Missing Booking Save After Notification
**Location**: `notifications.service.ts` line 487-488

**Issue**: `booking.notificationSent = true` is set but booking is never saved

**Impact**: Duplicate notifications can be sent

**Status**: ✅ FIXED - Added `await this.bookingsRepository.save(booking)`

### 6.3 Null Worker Check in Assignment
**Location**: `workers.service.ts` line 389

**Issue**: If `worker` is null, `worker?.publicId` returns undefined

**Impact**: Unexpected behavior in assignment validation

**Status**: ✅ FIXED - Added null check for worker existence

---

## 7. Configuration & Deployment

### 7.1 Environment Variables
- `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `FIREBASE_SERVICE_ACCOUNT` (JSON string with escaped newlines)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `JWT_SECRET`

### 7.2 Database Synchronization
```typescript
// HARD LOCK: NEVER enable in production
synchronize: process.env.NODE_ENV === 'development' && process.env.SYNCHRONIZE === 'true'
```

### 7.3 SSL Configuration (Railway)
```typescript
ssl: process.env.DB_SSL_REQUIRE === 'true' ? {
  rejectUnauthorized: false
} : false
```

---

## 8. File Structure

```
c:/Users/user/Desktop/newsevaq/
├── flutter-nest-househelp-master/     # Backend
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── workers/
│   │   ├── bookings/
│   │   ├── notifications/
│   │   ├── addresses/
│   │   └── ...
│   ├── package.json
│   └── ...
├── frontend-flutter-house-help-master/  # Customer App
│   ├── lib/
│   │   ├── models/
│   │   ├── services/
│   │   └── ...
│   └── ...
├── worker_app_flutter/                 # Worker App
│   ├── lib/
│   │   ├── models/
│   │   ├── services/
│   │   └── ...
│   └── ...
└── ... (documentation files)
```

---

## 9. Key Documentation Files

| File | Purpose |
|------|---------|
| `SEVAQ_DESIGN_PLAN.md` | Overall design system |
| `SEVAQ_ASSIGNMENT_FLOW_TECHNICAL_SPEC.md` | Assignment system specification |
| `SEVAQ_PROFESSIONAL_ASSIGNMENT_SYSTEM_TECHNICAL_SPECIFICATION.md` | Professional assignment details |
| `FIREBASE_PRIVATE_KEY_PARSING_FIX_PLAN.md` | Firebase key parsing fix |
| `ARCHITECTURAL_BUGS_VERIFICATION_REPORT.md` | Bug verification report |

---

## 10. Recommendations

1. **Notification status persistence**: ✅ FIXED - Added `await this.bookingsRepository.save(booking)`
2. **Null worker check**: ✅ FIXED - Added validation for worker existence in `acceptBooking` and `rejectBooking`
3. **Resolve type mismatch**: Consider changing `assignedWorkerId` to UUID type or use consistent integer comparison
4. **Add database constraints**: Enforce data integrity at database level
5. **Implement proper error handling**: Add more specific error messages for debugging