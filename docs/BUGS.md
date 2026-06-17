# QA Findings - SevaQ v1.0 Recovery Baseline

## Severity Legend
- **Critical**: App crash, data loss, security issue
- **High**: Broken flow, incorrect data, major UX issue
- **Medium**: Inconsistency, minor UX issue, missing state
- **Low**: Polish, optimization, minor visual tweak

---

## Authentication Issues

| Screen/Feature | Issue | Severity | Status | Recommendation |
|---------------|-------|----------|--------|--------------|
| OTP State | OTP timer expires but status doesn't auto-set to expired | High | ✅ Fixed | Auto-expired when timer reaches 0 |
| verify_otp_response.dart | Handles isNewUser default correctly | N/A | ✅ OK | No issue |
| login_screen.dart | No phone number validation | Medium | Pending | Add regex validation for phone format |
| profile_setup_screen.dart | No validation for name fields | Medium | Pending | Add required field validation |

---

## Home Issues

| Screen/Feature | Issue | Severity | Status | Recommendation |
|---------------|-------|----------|--------|--------------|
| home_provider.dart | HomeState is empty placeholder | High | Pending | Implement with real data model |
| home_screen.dart | Subscription Guarantee shows only when no subscription exists | Medium | Pending | Show dynamically based on state |
| home_screen.dart | No API integration for bookings | Medium | Pending | Connect to backend endpoints |

---

## Kitchen Subscription Issues

| Screen/Feature | Issue | Severity | Status | Recommendation |
|---------------|-------|----------|--------|--------------|
| cooking_provider.dart | initiatePayment() hardcodes orderId: '12345' | High | Pending | Remove, depends on real order creation |
| cooking_provider.dart | No navigation logic in any screen callback | High | Pending | Implement all navigation |
| checkout_screen.dart | No checkout API integration | High | Pending | Add create order endpoint call |
| payment_screen.dart | No gateway callback handling | High | Pending | Implement payment gateway integration |
| confirmation_screen.dart | Uses empty/placeholder data | Medium | Pending | Populate from actual order |
| subscription_schedule_state.dart | Custom date not validated as future | Low | Pending | Add date validation |

---

## Navigation Issues

| Screen/Feature | Issue | Severity | Status | Recommendation |
|---------------|-------|----------|--------|--------------|
| All screens | Navigation callbacks empty placeholders | High | Pending | Implement actual routing |
| app_router.dart | No parameter passing for payment/order IDs | Medium | Pending | Add path parameters for state transfer |

---

## Performance Issues

| Screen/Feature | Issue | Severity | Status | Recommendation |
|---------------|-------|----------|--------|--------------|
| All screens | No caching strategy for API calls | Low | Pending | Add caching layer |
| GridView widgets | No const constructors optimized | Low | Pending | Verify performance |

---

## Code Quality Issues

| File | Issue | Severity | Status | Recommendation |
|------|-------|----------|--------|--------------|
| lib/features/auth/data/auth_repository.dart | Uses raw Map, should use proper typing | Medium | ✅ OK | VerifyOtpResponse already typed |
| lib/shared/components/app_loading.dart | Used correctly | N/A | ✅ OK | OK |
| lib/shared/components/app_section_header.dart | Unused, could be deprecated | Low | Pending | Consider removal |

---

## State Management Issues

| Area | Issue | Severity | Status | Recommendation |
|------|-------|----------|--------|--------------|
| Cooking Flow | Multiple state objects scattered | Medium | Pending | Consider CookingFlowState consolidation |
| Provider Pattern | Different providers per flow section | Medium | Pending | Evaluate unified provider approach |