# SEVAQ House Help API Documentation

[![API Version](https://img.shields.io/badge/API%20Version-1.0.0-blue)](https://github.com/your-org/sevaq-api)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Complete API documentation for the SEVAQ house help platform backend. This API provides a trust-first infrastructure for connecting customers with verified professional service providers.

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Services](#services)
- [Workers](#workers)
- [Bookings](#bookings)
- [Assignments](#assignments)
- [Payments](#payments)
- [Reviews](#reviews)
- [Admin Panel](#admin-panel)
- [System Status](#system-status)
- [Error Handling](#error-handling)

## Base URL

```
http://localhost:3000
```

## Authentication

All API requests require authentication except for signup and login endpoints. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### POST /auth/signup

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

### POST /auth/login

Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

### GET /auth/profile

Get current user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "customer",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### PATCH /auth/profile

Update current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1987654321"
}
```

## Users

Admin-only endpoints for user management.

### GET /users (Admin Only)

List all users with pagination.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

### POST /users (Admin Only)

Create a new user (admin function).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "firstName": "New",
  "lastName": "User",
  "role": "customer"
}
```

### GET /users/:id (Admin Only)

Get specific user details.

### PATCH /users/:id (Admin Only)

Update user information.

### DELETE /users/:id (Admin Only)

Delete a user account.

## Services

Endpoints for managing service catalog.

### GET /services

Retrieve all available services.

**Response (200):**
```json
[
  {
    "id": "cleaning",
    "name": "Home Cleaning",
    "description": "Professional home cleaning services",
    "basePrice": 500,
    "category": "cleaning",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

### GET /services/categories/availability

Get service availability by category.

**Response (200):**
```json
{
  "cleaning": {
    "available": true,
    "workerCount": 5,
    "avgRating": 4.6
  },
  "cooking": {
    "available": true,
    "workerCount": 3,
    "avgRating": 4.8
  }
}
```

### GET /services/:id

Get specific service details.

### POST /services (Admin Only)

Create a new service.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "id": "laundry",
  "name": "Laundry Service",
  "description": "Professional laundry and dry cleaning",
  "basePrice": 300,
  "category": "laundry"
}
```

### PATCH /services/:id (Admin Only)

Update service information.

### DELETE /services/:id (Admin Only)

Remove a service.

## Workers

Endpoints for worker management and search.

### GET /workers

Get all workers or search by location.

**Query Parameters:**
- `lat`: Latitude (required for search)
- `long`: Longitude (required for search)
- `radius`: Search radius in km (default: 15)

**Example:**
```
GET /workers?lat=28.6139&long=77.2090&radius=20
```

**Response (200):**
```json
[
  {
    "id": "worker-1",
    "bio": "Experienced housekeeper with 5 years...",
    "rating": 4.8,
    "reviewCount": 25,
    "yearsOfExperience": 5,
    "serviceRadiusKm": 15,
    "latitude": 28.6200,
    "longitude": 77.2100,
    "isAvailable": true,
    "isActive": true,
    "services": ["cleaning", "cooking"],
    "user": {
      "firstName": "Priya",
      "lastName": "Sharma"
    }
  }
]
```

### GET /workers/:id

Get detailed worker information.

### GET /workers/service/:serviceId

Get workers for a specific service.

### POST /workers

Create a new worker profile.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "bio": "Professional cleaner with 3 years experience",
  "serviceIds": ["cleaning"],
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

## Bookings

Endpoints for managing service bookings.

### POST /bookings

Create a new service booking.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "serviceId": "cleaning",
  "date": "2024-01-15",
  "timeWindow": "morning",
  "priceSnapshot": 500,
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "address": "Connaught Place, New Delhi"
  }
}
```

**Response (201):**
```json
{
  "id": "booking-uuid",
  "userId": "user-uuid",
  "serviceId": "cleaning",
  "date": "2024-01-15",
  "timeWindow": "morning",
  "priceSnapshot": 500,
  "assignmentState": "PENDING",
  "createdAt": "2024-01-14T15:30:00.000Z"
}
```

### GET /bookings

Get bookings (filtered by user or worker).

**Query Parameters:**
- `userId`: Filter by user
- `workerId`: Filter by assigned worker

### GET /bookings/:id

Get specific booking details.

### PATCH /bookings/:id

Update booking information.

### POST /bookings/:id/attempt-assignment

Attempt to assign a worker to a booking.

### POST /bookings/assign

Manually assign a booking (admin function).

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "workerId": "worker-uuid"
}
```

## Assignments

Endpoints for worker assignment system.

### GET /assignments/:bookingId/status

Get assignment status for a booking.

**Response (200):**
```json
{
  "bookingId": "booking-uuid",
  "status": "ASSIGNED",
  "worker": {
    "id": "worker-1",
    "name": "Priya Sharma",
    "rating": 4.8
  },
  "assignedAt": "2024-01-15T09:00:00.000Z"
}
```

### POST /assignments/reassign

Reassign a booking to a different worker.

**Request Body:**
```json
{
  "bookingId": "booking-uuid"
}
```

### POST /assignments/check-availability

Check worker availability for assignment.

**Request Body:**
```json
{
  "serviceId": "cleaning",
  "userLat": 28.6139,
  "userLng": 77.2090,
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z"
}
```

**Response (200):**
```json
{
  "available": true,
  "availableWorkers": 3,
  "recommendedWorker": {
    "id": "worker-1",
    "name": "Priya Sharma",
    "rating": 4.8,
    "distance": 2.5
  }
}
```

### POST /assignments/attempt-assignment

Attempt assignment for a booking.

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "serviceId": "cleaning",
  "userLat": 28.6139,
  "userLng": 77.2090,
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z"
}
```

## Payments

Payment processing with Razorpay integration.

### POST /payments/create-order

Create a Razorpay payment order.

**Request Body:**
```json
{
  "amount": 50000,  // Amount in paisa (₹500.00)
  "currency": "INR"
}
```

**Response (200):**
```json
{
  "id": "order_xyz123",
  "amount": 50000,
  "currency": "INR",
  "razorpayKeyId": "rzp_test_xxx"
}
```

### POST /payments/verify

Verify payment completion and create booking.

**Request Body:**
```json
{
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc456",
  "signature": "signature_hash",
  "bookingData": {
    "userId": "user-uuid",
    "serviceId": "cleaning",
    "date": "2024-01-15",
    "timeWindow": "morning",
    "priceSnapshot": 500,
    "location": {
      "lat": 28.6139,
      "lng": 77.2090,
      "address": "Connaught Place, New Delhi"
    }
  }
}
```

**Response (200):**
```json
{
  "status": "success",
  "booking": {
    "id": "booking-uuid",
    "status": "CONFIRMED",
    "paymentId": "pay_abc456"
  }
}
```

## Reviews

Customer review and rating system.

### POST /reviews

Submit a review for a completed service.

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "workerId": "worker-uuid",
  "userId": "user-uuid",
  "rating": 5,
  "comment": "Excellent service! Very professional and thorough.",
  "serviceQuality": 5,
  "punctuality": 5,
  "value": 4
}
```

**Response (201):**
```json
{
  "id": "review-uuid",
  "rating": 5,
  "comment": "Excellent service! Very professional and thorough.",
  "createdAt": "2024-01-15T14:30:00.000Z"
}
```

### GET /reviews

Get all reviews.

**Query Parameters:**
- `workerId`: Filter by worker
- `rating`: Filter by minimum rating

### GET /reviews/worker/:workerId

Get reviews for a specific worker.

**Response (200):**
```json
[
  {
    "id": "review-uuid",
    "rating": 5,
    "comment": "Excellent service!",
    "user": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
]
```

## Admin Panel

Admin-only endpoints for system management.

### GET /metrics/system (Admin Only)

Get system-wide metrics.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "totalUsers": 1250,
  "totalWorkers": 85,
  "totalBookings": 3420,
  "activeBookings": 45,
  "completedBookings": 3375,
  "averageRating": 4.6,
  "systemUptime": "99.9%",
  "databaseConnections": 12
}
```

### GET /metrics/assignments (Admin Only)

Get assignment metrics.

**Query Parameters:**
- `timeRange`: day/week/month

**Response (200):**
```json
{
  "totalAssignments": 3420,
  "successfulAssignments": 3345,
  "failedAssignments": 75,
  "averageAssignmentTime": "2.3 minutes",
  "successRate": "97.8%",
  "timeRange": "month"
}
```

### GET /metrics/workers/:workerId (Admin Only)

Get metrics for a specific worker.

### GET /metrics/assignments/service-types (Admin Only)

Get assignment metrics by service type.

### GET /metrics/assignments/locations (Admin Only)

Get assignment metrics by location.

## System Status

System health and monitoring endpoints.

### GET /system/readiness (Admin Only)

Check system readiness and health.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "responseTime": "45ms"
  },
  "redis": {
    "status": "connected",
    "responseTime": "12ms"
  },
  "externalServices": {
    "razorpay": "operational"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

### Assignment-Specific Errors

#### No Workers Available
```json
{
  "statusCode": 404,
  "message": "No professional available",
  "error": "Not Found"
}
```

#### Invalid Location Data
```json
{
  "statusCode": 400,
  "message": "Invalid location coordinates",
  "error": "Bad Request"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Admin endpoints**: 60 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1638360000
```

## Webhooks

### Payment Webhooks

Razorpay payment webhooks are handled at `/payments/webhook`. Configure webhook URL in Razorpay dashboard.

**Supported Events:**
- `payment.captured`
- `payment.failed`
- `order.paid`

## SDKs and Libraries

### JavaScript/TypeScript Client

```javascript
import { SevaqAPI } from 'sevaq-api-client';

const client = new SevaqAPI({
  baseURL: 'https://api.sevaq.com',
  apiKey: 'your-api-key'
});

// Authenticate
const { access_token } = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Create booking
const booking = await client.bookings.create({
  serviceId: 'cleaning',
  date: '2024-01-15',
  timeWindow: 'morning',
  location: { lat: 28.6139, lng: 77.2090 }
});
```

## Changelog

### Version 1.0.0
- Initial API release
- Core authentication and user management
- Service booking and worker assignment
- Payment integration with Razorpay
- Review and rating system
- Admin panel and system monitoring

## Support

For API support and questions:
- 📧 Email: api-support@sevaq.com
- 📖 Documentation: https://docs.sevaq.com
- 🐛 Bug Reports: https://github.com/your-org/sevaq-api/issues
- 💬 Community: https://discord.gg/sevaq

## License

This API documentation is licensed under the MIT License. See LICENSE file for details.