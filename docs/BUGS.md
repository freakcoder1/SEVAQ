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
| OTP State | OTP timer expires but status doesn't auto-set to expired | High | Add timer expiration handling |
| verify_otp_response.dart | isNewUser nullable - should be required or have default | Medium | Add default value or make required |
| auth_providers.dart | OtpNotifier doesn't handle OTP expiration from timer | High | Add logic when resendTimer reaches 0 |

---

## Home Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| home_provider.dart | No implementation - just empty stubs | High | Needs real implementation |
| home_screen.dart | Loading and error states exist but no API integration | Medium | Connect to real data source |

---

## Kitchen Subscription Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| cooking_provider.dart | initiatePayment() hardcodes orderId: '12345' | High | Should generate from actual order creation |
| payment_state.dart | paymentMethod is reference to checkout_state.PaymentMethod | Medium | Consider unified definition |
| checkout_screen.dart | No payment processing - just state setup | High | Missing gateway integration |

---

## Navigation Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| All screens | Navigation callbacks are empty placeholders | High | Implement actual routing |
| app_router.dart | Missing deep link handling | Low | Add path parameters for order/payment IDs |

---

## Performance Issues

| Screen/Feature | Issue | Severity | Recommendation |
|---------------|-------|----------|--------------|
| All screens | No lazy loading for API calls | Low | Implement async initialization |

---

## Code Quality Issues

| File | Issue | Severity | Recommendation |
|------|-------|----------|--------------|
| lib/features/auth/data/auth_repository.dart | Empty stub methods | High | Implement API calls |
| lib/features/home/providers/home_provider.dart | Empty state class | High | Implement real data fetching |
| lib/shared/components/app_section_header.dart | Unused, but could be useful | Low | Remove or integrate |
| lib/shared/components/app_loading.dart | Used in profile_setup_screen | N/A | OK - being used |

---

## State Management Issues

| Area | Issue | Severity | Recommendation |
|------|-------|----------|--------------|
| Cooking Flow State | Multiple state objects could be consolidated | Medium | Evaluate CookingFlowState pattern |
| Payment State | Error messages hardcoded in screen | Medium | Move error strings to state |