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
| POST /auth/otp/request | ⬜ |  |
| POST /auth/otp/verify-login | ⬜ |  |
| POST /auth/otp/verify-token | ⬜ |  |
| GET /profile | ⬜ |  |
| GET /home/dashboard | ⬜ |  |
| GET /kitchen/options | ⬜ |  |
| POST /kitchen/order | ⬜ |  |
| POST /kitchen/payment/init | ⬜ |  |
| POST /cleaning/options | ⬜ |  |
| POST /cleaning/booking | ⬜ |  |

## Backend Deployment Verification

### ✅ Verified (via FCM Fix Verification Tests)
| Check | Status | Value |
|-------|--------|-------|
| Server Running | ✅ PASS | HTTP 200 |
| Health Endpoint | ✅ PASS | status: ok |
| Firebase Status | ✅ PASS | initialized: true, projectId: sevaq-6fcc4 |
| Services Endpoint | ✅ PASS | 9 services with UUIDs |

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

---

## Operational Validation Evidence (To be filled during staging)

### Firebase Configuration
```
- FIREBASE_SERVICE_ACCOUNT: configured (individual credentials)
- Firebase initialized: true
- Project ID: sevaq-6fcc4
- Last error: null
```

### Health Check Output
```
- Database: up
- Memory: up
- Workers: 15 active workers
- Services: 10 services available
```

### FCM Verification Results
```
- Test 1 (Firebase status): ✅ PASS
- Test 2 (Service UUID): ✅ PASS
- Test 3 (Database health): ✅ PASS (health endpoint OK, services returned data)
- Test 4 (Configuration): ✅ PASS
```

### Production Validation Status
| Scenario | Status | Notes |
|----------|--------|-------|
| Backend Deployment Verification | ✅ PASS | FCM tests passed, health endpoint OK |
| OTP Login | ✅ PASS | Tested on RMX5101 device |
| Session Persistence | ✅ PASS | Tested on RMX5101 device |
| Kitchen Flow | ⬜ | App installed on RMX5101 - requires manual testing |
| Cleaning Flow | ⬜ | App installed on RMX5101 - requires manual testing |
| Push Notifications | ✅ PASS | FCM test notification sent successfully |
| Crashlytics | ⬜ | App installed on RMX5101 - requires manual testing |
| Analytics | ⬜ | App installed on RMX5101 - requires manual testing |

**Manual Testing Instructions**
1. Start backend: `node dist/main.js` (from flutter-nest-househelp-master)
2. On RMX5101 device: Open "House Help" app
3. Test: OTP login → Kitchen/Cleaning booking → Push notifications
4. Backend endpoint: http://127.0.0.1:3000/api