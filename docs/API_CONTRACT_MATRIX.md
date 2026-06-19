# API Contract Matrix

| Endpoint | Method | Auth | Request Fields | Response Fields | Purpose |
|----------|--------|------|---------------|---------------|---------|
| `/auth/otp/request` | POST | No | `phoneNumber` | `success` | Send OTP to user |
| `/auth/otp/verify` | POST | No | `phoneNumber`, `otp` | `token`, `refreshToken`, `user`, `isNewUser` | Verify OTP and get session |
| `/user/profile` | GET | Yes | - | `id`, `fullName`, `phoneNumber`, `email` | Get current user |
| `/home/dashboard` | GET | Yes | - | `user`, `activeBookings`, `subscriptions` | Home dashboard data |
| `/kitchen/options` | GET | Yes | - | `mealTypes`, `frequencies` | Kitchen subscription options |
| `/kitchen/order` | POST | Yes | `mealType`, `persons`, `days`, `startDate` | `orderId`, `amount` | Create kitchen order |
| `/kitchen/payment/init` | POST | Yes | `orderId` | `paymentUrl` | Initialize payment |
| `/cleaning/options` | GET | Yes | - | `services`, `locations` | Cleaning options |
| `/cleaning/booking` | POST | Yes | `serviceId`, `dateTime`, `address` | `bookingId` | Create cleaning booking |

## Error Responses

| Status | Meaning | Handling |
|--------|---------|----------|
| 401 | Unauthorized | Token refresh |
| 403 | Forbidden | Logout user |
| 404 | Not found | Show empty/error state |
| 429 | Rate limited | Retry with backoff |
| 5xx | Server error | Retry with backoff |