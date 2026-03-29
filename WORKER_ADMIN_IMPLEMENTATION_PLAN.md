# Worker App & Admin Dashboard Implementation Plan

## Overview

This document outlines the complete implementation plan for the Worker App (mobile) and Admin Dashboard (web) for the SEVAQ platform.

---

## Part 1: Backend API (Implemented)

### Worker Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/workers/me` | GET | Get current worker's profile from JWT |
| `/workers/me/bookings` | GET | Get worker's bookings (with optional status filter) |
| `/workers/me/earnings` | GET | Get worker's earnings summary |
| `/workers/me/availability` | PATCH | Update worker's availability status |
| `/workers/bookings/:id/accept` | POST | Accept a booking assignment |
| `/workers/bookings/:id/reject` | POST | Reject a booking assignment |
| `/workers/bookings/:id/start` | POST | Start a job (mark as in progress) |
| `/workers/bookings/:id/complete` | POST | Complete a job |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/dashboard` | GET | Get comprehensive dashboard statistics |
| `/admin/workers` | GET | Get all workers with filters |
| `/admin/workers/:id` | GET | Get worker by ID |
| `/admin/workers/:id` | PUT | Update worker details |
| `/admin/workers/:id/availability` | PATCH | Toggle worker availability |
| `/admin/bookings` | GET | Get all bookings with filters |
| `/admin/bookings/:id` | GET | Get booking by ID |
| `/admin/bookings/:id/status` | PATCH | Update booking status |
| `/admin/bookings/:id/cancel` | POST | Cancel a booking |
| `/admin/analytics/revenue` | GET | Get revenue analytics |
| `/admin/analytics/bookings` | GET | Get booking analytics |
| `/admin/users` | GET | Get all users |
| `/admin/users/:id` | GET | Get user by ID |

### Security

- All worker endpoints require JWT authentication
- All admin endpoints require JWT authentication + Admin role verification (AdminGuard)
- JWT strategy already includes role in payload for authorization

---

## Part 2: Worker App (Mobile - Flutter)

### Screens Needed

1. **Login Screen** - Worker authentication
2. **Home/Dashboard** - Today's tasks, earnings summary
3. **My Bookings** - List of assigned bookings with filters
4. **Booking Detail** - View booking info, accept/reject/start/complete
5. **Earnings** - Detailed earnings breakdown
6. **Profile** - Worker profile, availability toggle

### Features

- Push notification support for new bookings
- Real-time status updates
- Offline capability for viewing cached bookings
- Location services for job verification

### Data Flow

```
Worker App → API (JWT Auth) → Backend → Worker Endpoints
```

### Key Screens Detail

#### 1. Login Screen
- Email/Password or Phone OTP
- Use existing auth service with role check

#### 2. Home Dashboard
- Summary cards: Today's Jobs, Earnings, Rating
- Quick actions: Accept new, View pending, Start job
- Upcoming bookings list

#### 3. Bookings List
- Tabs: New, In Progress, Completed
- Pull-to-refresh
- Filter by date range

#### 4. Booking Detail
- Customer info, address, service details
- Time slot information
- Action buttons: Accept/Reject (if pending), Start (if confirmed), Complete (if in progress)
- Cancellation reason input

#### 5. Earnings Screen
- Total earnings, this month, last month
- Completed jobs count
- Pending payments amount

---

## Part 3: Admin Dashboard (Web - React/Next.js or Flutter Web)

### Screens Needed

1. **Login** - Admin authentication
2. **Dashboard** - Overview statistics, charts
3. **Workers** - Worker management, CRUD operations
4. **Bookings** - Booking management, status updates
5. **Users** - User management
6. **Analytics** - Revenue and booking analytics
7. **Settings** - System configuration

### Features

- Real-time dashboard with charts
- Data tables with search, filter, sort, pagination
- Export capabilities (CSV/Excel)
- Activity logs and audit trail

### Key Screens Detail

#### 1. Dashboard
- KPI cards: Total Users, Workers, Bookings, Revenue
- Charts: Revenue by month, Bookings by status
- Recent activity feed
- Quick stats: Active subscriptions, Pending assignments

#### 2. Workers Management
- Table with columns: Name, Rating, Services, Status, Created
- Search by name/email
- Filter by availability, rating
- Actions: View, Edit, Toggle availability, View bookings

#### 3. Bookings Management
- Table with columns: ID, Customer, Worker, Service, Date, Status, Amount
- Filter by status, date range, service
- Actions: View details, Change status, Cancel, Reassign

#### 4. Analytics
- Revenue trends (line chart)
- Bookings by service (pie chart)
- Worker performance table
- Completion/cancellation rates

---

## Implementation Priority

### Phase 1: Backend (Complete) ✓
- Worker endpoints implemented
- Admin endpoints implemented
- Authentication and authorization in place

### Phase 2: Worker App (Flutter Mobile)
- Priority: HIGH
- Use existing Flutter codebase
- Reuse existing API service
- Add new screens for worker-specific features

### Phase 3: Admin Dashboard (Web)
- Priority: MEDIUM
- Options:
  - Flutter Web (share code with mobile)
  - React/Next.js (new implementation)
- Recommend Flutter Web for code reuse

---

## Next Steps

1. **Test Backend API**: Use Postman/cURL to test all new endpoints
2. **Build Worker App**: Add worker-specific screens to existing Flutter app
3. **Build Admin Dashboard**: Create new web application
4. **Integration**: Connect both frontends to backend
5. **Testing**: End-to-end testing of both apps

---

## Technical Considerations

### Worker App
- Reuse existing auth mechanism (add role check)
- Add worker-specific models (WorkerProfile, WorkerBooking, WorkerEarnings)
- Add local notifications for booking updates

### Admin Dashboard
- Use role-based authentication (JWT)
- Implement admin guards
- Use existing API service with admin endpoints
- Consider state management (Provider/Riverpod)

---

## Summary

The backend is now ready with all necessary endpoints. The Worker App can be built by extending the existing Flutter app, and the Admin Dashboard can be built either as a Flutter Web app (recommended for code reuse) or as a separate React/Next.js web application.