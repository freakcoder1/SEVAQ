# Login Functionality Testing Guide

## Overview
This document provides instructions for testing the login functionality in the Flutter House Help app.

## Prerequisites

1. **Backend Server**: Ensure the NestJS backend server is running on the configured IP address
2. **Network Access**: Make sure the device/emulator can reach the backend server
3. **Test Data**: Have test user credentials ready

## Configuration

### API Endpoint
The API endpoint is configured in `lib/config/app_config.dart`:
- Default: `http://192.168.29.154:3000`
- Localhost: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`

To change the endpoint, modify the `apiBaseUrl` in `AppConfig` class.

### Network Permissions
- **Android**: Added `INTERNET`, `ACCESS_NETWORK_STATE`, and `ACCESS_WIFI_STATE` permissions
- **iOS**: Added `NSAppTransportSecurity` with `NSAllowsArbitraryLoads` for HTTP requests

## Testing Steps

### 1. Manual Testing

1. **Launch the App**
   - Run the Flutter app on a device or emulator
   - The app should start on the Login screen

2. **Test Valid Login**
   - Enter valid email and password
   - Tap "LOG IN"
   - Expected: Successful login, navigation to main screen

3. **Test Invalid Login**
   - Enter invalid credentials
   - Tap "LOG IN"
   - Expected: Error message displayed

4. **Test Network Issues**
   - Turn off Wi-Fi/mobile data
   - Try to login
   - Expected: "Network error: Please check your internet connection"

5. **Test Signup Flow**
   - Tap "Sign Up" link
   - Fill in registration form
   - Expected: Account creation and login

### 2. Automated Testing

Run the auth tests:
```bash
flutter test test/auth_test.dart
```

### 3. Backend Testing

Test the auth endpoints directly:
```bash
# Test login
curl -X POST http://192.168.29.154:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test signup
curl -X POST http://192.168.29.154:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

## Common Issues and Solutions

### Issue: "Network error: Please check your internet connection"
**Solution**: 
- Verify backend server is running
- Check IP address in `AppConfig`
- Ensure device can reach the server

### Issue: "Request timeout: Please try again"
**Solution**:
- Check server response time
- Verify network stability
- Try with a different endpoint

### Issue: "Invalid credentials"
**Solution**:
- Verify user exists in database
- Check password is correct
- Ensure email is properly formatted

### Issue: App crashes on login
**Solution**:
- Check console logs for errors
- Verify API response format matches expected structure
- Ensure JWT token is properly formatted

## Debugging

### Enable Debug Logging
Set `enableDebugLogging` to `true` in `AppConfig` to see detailed logs.

### Check Console Logs
- Android: Use `adb logcat`
- iOS: Use Xcode console
- Web: Use browser developer tools

### Test Token Storage
The app uses `flutter_secure_storage` to store JWT tokens. Test:
- Token is saved after login
- Token is cleared on logout
- Token persists across app restarts

## Backend Requirements

The backend must provide:
- `POST /auth/login` endpoint
- `POST /auth/signup` endpoint
- JWT token generation
- Proper error handling

## Security Considerations

- JWT tokens are stored securely using `flutter_secure_storage`
- HTTPS should be used in production
- Passwords are never stored locally
- Tokens have expiration times

## Performance Testing

- Test login with slow network connections
- Test with multiple concurrent users
- Monitor memory usage during authentication flow

## Next Steps

1. Set up proper backend server
2. Create test user accounts
3. Run comprehensive testing
4. Monitor for any edge cases
5. Optimize performance if needed