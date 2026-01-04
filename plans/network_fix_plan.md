# Network Connectivity Fix Plan

## Problem Analysis
The Flutter apps are crashing/showing blank screens because they're trying to connect to an incorrect API base URL (`192.168.29.154:45357`) instead of the correct backend server address.

## Root Causes Identified
1. **Incorrect API Base URL**: Apps configured to use `192.168.29.154:45357` but backend is running on `192.168.29.167:3000`
2. **Poor Error Handling**: Network errors cause app crashes instead of graceful fallbacks
3. **No Connection Validation**: Apps don't check if server is available before making requests

## Solution Strategy

### 1. Fix API Configuration
- Update `AppConfig.apiBaseUrl` to use correct IP: `192.168.29.167:3000`
- Add network timeout configuration
- Add retry mechanism for failed requests

### 2. Enhance Error Handling
- Improve `ApiService` to handle network errors gracefully
- Add connection status checking
- Implement retry logic with exponential backoff

### 3. Update Authentication Provider
- Add connection validation before login/signup
- Handle token refresh scenarios
- Provide better error messages to users

### 4. Add Network Connectivity Checks
- Implement ping/health check endpoint
- Add offline mode handling
- Show appropriate UI for connection issues

## Implementation Steps

### Step 1: Update AppConfig
```dart
class AppConfig {
  // API Configuration
  static String get apiBaseUrl {
    return 'http://192.168.29.167:3000';
  }
  
  // Network configuration
  static const Duration requestTimeout = Duration(seconds: 30);
  static const int maxRetries = 3;
}
```

### Step 2: Enhance ApiService
- Add timeout configuration
- Implement retry logic
- Add connection status checking
- Improve error messages

### Step 3: Update AuthProvider
- Add connection validation
- Handle network errors gracefully
- Provide user-friendly error messages

### Step 4: Test Connectivity
- Verify apps can connect to backend
- Test error scenarios
- Ensure graceful degradation

## Expected Outcomes
- Apps successfully connect to backend server
- No more crashes due to network errors
- Better user experience with proper error handling
- Graceful handling of connection issues

## Testing Plan
1. Update API configuration
2. Restart Flutter apps
3. Test login/signup functionality
4. Verify API calls work correctly
5. Test error scenarios (no network, server down)