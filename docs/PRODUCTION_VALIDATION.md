# Production Validation Checklist

## User Journey Validation

### Authentication Flow
- [ ] Fresh install + OTP login
- [ ] OTP resend
- [ ] Auto-fetch OTP (if supported)
- [ ] Logout + re-login

### Kitchen Subscription
- [ ] Kitchen flow start to finish
- [ ] Meal type selection
- [ ] Date selection
- [ ] Person count selection
- [ ] Review screen
- [ ] Checkout initiation
- [ ] Payment success
- [ ] Confirmation shown
- [ ] Dashboard reflects subscription

### Cleaning Booking
- [ ] Cleaning flow start to finish
- [ ] Service selection
- [ ] Date/time picker
- [ ] Address confirmation
- [ ] Review screen
- [ ] Payment success
- [ ] Confirmation shown

## API Contract Validation

| Endpoint | Status | Notes |
|----------|--------|-------|
| POST /auth/otp/request | ⬜ | |
| POST /auth/otp/verify | ⬜ | |
| GET /profile | ⬜ | |
| GET /home/dashboard | ⬜ | |
| GET /kitchen/options | ⬜ | |
| POST /kitchen/order | ⬜ | |
| POST /kitchen/payment/init | ⬜ | |
| POST /cleaning/options | ⬜ | |
| POST /cleaning/booking | ⬜ | |

## Payment Scenarios
- [ ] Successful payment flow
- [ ] Payment timeout
- [ ] User cancels UPI
- [ ] Network loss during payment
- [ ] App killed during payment
- [ ] Duplicate callback handling
- [ ] Idempotency verification

## Offline & Recovery
- [ ] App launch with no connection
- [ ] Dashboard shows cached data
- [ ] Network restoration triggers refresh
- [ ] Booking submission queued offline
- [ ] Token refresh on reconnect
- [ ] Retry policy triggers correctly

## Observability Verification
- [ ] Test crash sent to Crashlytics
- [ ] Analytics events received
- [ ] Performance traces captured
- [ ] Correlation IDs in logs

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Cold start | < 2s | ⬜ ms |
| Home load | < 1s | ⬜ ms |
| Cache hit | < 200ms | ⬜ ms |
| API timeout | 30s | ⬜ |

## Known Limitations

_Record any validated limitations here._

## Rollback Plan

_Steps to revert production release._