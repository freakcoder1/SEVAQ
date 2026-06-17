# QA Findings - SevaQ v1.0 Recovery Baseline

## Severity Legend
- **Critical**: App crash, data loss, security issue
- **High**: Broken flow, incorrect data, major UX issue
- **Medium**: Inconsistency, minor UX issue, missing state
- **Low**: Polish, optimization, minor visual tweak

---

## Authentication Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| OTP State | OTP timer expires but status doesn't auto-set to expired | High | Add timer expiration handling in OtpNotifier |
| verify_otp_response.dart | Handles isNewUser default correctly | N/A | OK - no issue |
| auth_providers.dart | OtpNotifier doesn't auto-trigger expiration when timer hits 0 | High | Set status = OtpStatus.expired when timer reaches 0 |
| login_screen.dart | No phone number validation | Medium | Add regex validation for phone format |
| profile_setup_screen.dart | No validation for name fields | Medium | Add required field validation |

---

## Home Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| home_provider.dart | HomeState is empty placeholder | High | Implement with real data model |
| home_screen.dart | Subscription Guarantee shows only when no subscription exists | Medium | Show dynamically based on state |
| home_screen.dart | No API integration for bookings | Medium | Connect to backend endpoints |

---

## Kitchen Subscription Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| cooking_provider.dart | initiatePayment() hardcodes orderId: '12345' | High | Remove, depends on real order creation |
| cooking_provider.dart | No navigation logic in any screen callback | High | Implement all navigation |
| checkout_screen.dart | No checkout API integration | High | Add create order endpoint call |
| payment_screen.dart | No gateway callback handling | High | Implement payment gateway integration |
| confirmation_screen.dart | Uses empty/placeholder data | Medium | Populate from actual order |
| subscription_schedule_state.dart | Custom date not validated as future | Low | Add date validation |

---

## Navigation Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| All screens | Navigation callbacks empty placeholders | High | Implement actual routing |
| app_router.dart | No parameter passing for payment/order IDs | Medium | Add path parameters for state transfer |

---

## Performance Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| All screens | No caching strategy for API calls | Low | Add caching layer |
| GridView widgets | No const constructors optimized | Low | Verify performance |

---

## Code Quality Issues

| File | Issue | Severity | Recommendation |
|------|-------|----------|--------------|
| lib/features/auth/data/auth_repository.dart | Uses raw Map, should use proper typing | Medium | Already improved with VerifyOtpResponse |
| lib/shared/components/app_loading.dart | Used correctly | N/A | OK |
| lib/shared/components/app_section_header.dart | Unused, could be deprecated | Low | Consider removal |

---

## State Management Issues

| Area | Issue | Severity | Recommendation |
|------|-------|----------|--------------|
| Cooking Flow | Multiple state objects scattered | Medium | Consider CookingFlowState consolidation |
| Provider Pattern | Different providers per flow section | Medium | Evaluate unified provider approach |