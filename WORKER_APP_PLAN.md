# Worker App Analysis & Plan

## Project Overview
The SEVAQ Worker App is a Flutter mobile application designed for service workers (maids, cooks, cleaners) to manage their bookings, earnings, and profiles. It connects to the existing NestJS backend.

---

## Current Architecture

### Technology Stack
- **Frontend**: Flutter (Dart)
- **Backend**: NestJS with PostgreSQL
- **Authentication**: JWT-based with optional Firebase OTP

### Directory Structure
```
worker_app_flutter/
├── lib/
│   ├── main.dart
│   ├── theme.dart
│   ├── config/
│   │   └── app_config.dart          # API configuration
│   ├── models/
│   │   ├── booking.dart             # Booking data model
│   │   ├── earnings.dart            # Earnings data model
│   │   └── worker.dart              # Worker data model
│   ├── providers/
│   │   ├── auth_provider.dart       # Authentication state management
│   │   ├── booking_provider.dart    # Booking state management
│   │   └── earnings_provider.dart   # Earnings state management
│   ├── screens/
│   │   ├── login_screen.dart        # Worker login screen
│   │   ├── signup_screen.dart       # Worker registration screen
│   │   ├── home_screen.dart         # Dashboard with today's jobs
│   │   ├── bookings_screen.dart     # Job list with tabs
│   │   ├── booking_detail_screen.dart # Individual job details
│   │   ├── earnings_screen.dart     # Earnings analytics
│   │   ├── profile_screen.dart      # Worker profile management
│   │   └── main_screen.dart         # Bottom navigation container
│   └── services/
│       └── api_service.dart         # HTTP client for API calls
```

---

## Feature Breakdown

### 1. Authentication System
**Login Options:**
- Email + Password login
- Phone + OTP login (Firebase-based)

**Registration Flow:**
- Step 1: Phone number verification (OTP)
- Step 2: Personal details (name, email, password)
- Step 3: Service selection (CLEANING, COOKING, MAID)
- Step 4: Service area/location setup
- Step 5: Review & submit

### 2. Home Dashboard
- Welcome card with worker name and availability toggle
- Today's jobs summary (New, Active, Done)
- Earnings summary (This Month, Last Month)
- Upcoming jobs list (next 5 jobs)

### 3. Bookings Management
**Tabs:**
- **New**: Pending jobs to accept/reject
- **In Progress**: Active jobs being worked on
- **Completed**: Finished jobs history

**Booking Actions:**
- Accept/Reject new jobs
- Start job (mark as in progress)
- Complete job (finish and submit)
- View detailed booking information

### 4. Earnings Tracking
- Summary cards (This Month, Last Month, This Week, Today)
- Jobs count (This Month, Last Month)
- Visual chart (last 7 days earnings trend)
- Detailed transaction list

### 5. Profile Management
- Profile header with photo, name, phone, location
- Availability toggle switch
- Performance stats (rating, total jobs)
- Services list (assigned service categories)
- Logout functionality

---

## API Endpoints Used

### Authentication
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Login with email/password |
| `/auth/otp/verify-login` | POST | Login with OTP |
| `/auth/workers/register` | POST | Register new worker |

### Worker Profile
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/workers/me` | GET | Get current worker profile |
| `/workers/me` | PATCH | Update worker profile |
| `/workers/me/availability` | PATCH | Toggle availability |
| `/workers/me/services` | PATCH | Update service categories |
| `/workers/me/service-area` | PATCH | Update service area |

### Bookings
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/workers/me/bookings` | GET | Get worker's bookings |
| `/workers/bookings/:id/accept` | POST | Accept a booking |
| `/workers/bookings/:id/reject` | POST | Reject a booking |
| `/workers/bookings/:id/start` | POST | Start a job |
| `/workers/bookings/:id/complete` | POST | Complete a job |

### Earnings
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/workers/me/earnings` | GET | Get earnings summary |

---

## Data Models

### Worker Model
```dart
- id: String
- name: String
- phone: String
- profileImage: String?
- isAvailable: bool
- services: List<String>
- rating: double
- totalJobs: int
- location: String?
```

### Booking Model
```dart
- id: String
- serviceName: String
- serviceCategory: String?
- customerName: String
- customerPhone: String?
- customerAddress: String?
- scheduledDate: String
- startTime: String
- endTime: String?
- status: String (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED)
- price: double
- paymentStatus: String?
- notes: String?
- bookingType: String? (ONE_TIME, SUBSCRIPTION)
```

### Earnings Model
```dart
- thisMonth: double
- lastMonth: double
- todayEarnings: double
- thisWeek: double
- completedJobsThisMonth: int
- completedJobsLastMonth: int
- breakdown: List<EarningDetail>
```

---

## State Management

Using **Provider** for state management with three main providers:

1. **AuthProvider**: Manages authentication state, worker profile, availability toggle
2. **BookingProvider**: Manages booking list, booking actions (accept, reject, start, complete)
3. **EarningsProvider**: Manages earnings data fetching and display

---

## UI/UX Design

### Theme
- Primary color: Deep blue/indigo (#4A90E2 typical)
- Secondary: Teal/cyan for accents
- Status colors:
  - Pending: Orange
  - In Progress: Purple/Blue
  - Completed: Green
  - Cancelled/Rejected: Red

### Navigation
- Bottom navigation bar with 4 tabs:
  1. Home (dashboard)
  2. Jobs (bookings)
  3. Earnings
  4. Profile

### Key UI Components
- Card-based layouts for content sections
- Tab bars for filtering (bookings screen)
- Pull-to-refresh on list screens
- Loading states with CircularProgressIndicator
- Empty states with icons and messages
- Snackbar notifications for actions

---

## Current Issues & Improvements Needed

### 1. API Configuration
- Ensure app connects to correct backend URL
- Handle network errors gracefully

### 2. Authentication Flow
- Handle token expiration
- Manage session state properly

### 3. Error Handling
- Graceful handling of 404/500 errors
- User-friendly error messages

### 4. Backend Integration
- Ensure all endpoints return expected format
- Handle edge cases (no bookings, no earnings)

---

## Implementation Priority

### Phase 1: Core Authentication
- [x] Login screen with email/password
- [x] Signup/registration flow
- [x] Profile management

### Phase 2: Core Features
- [x] Home dashboard
- [x] Bookings list and management
- [x] Earnings display

### Phase 3: Polish & Integration
- [ ] Error handling improvements
- [ ] Offline capability
- [ ] Push notifications (future)

---

## Testing Strategy

1. **Unit Tests**: Test models and providers
2. **Widget Tests**: Test individual screens
3. **Integration Tests**: Test full user flows
4. **Manual Testing**: Test on real devices

---

## Future Enhancements

1. **Push Notifications**: Job alerts, booking updates
2. **Offline Mode**: Cache bookings for offline viewing
3. **Chat**: Customer-worker communication
4. **Multi-language**: Hindi/English support
5. **Dark Mode**: Theme customization