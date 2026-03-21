import 'dart:io';
import 'package:flutter/foundation.dart';

class AppConfig {
  // API Configuration
  // Flag to use localhost (for USB debugging with ADB reverse)
  static const bool useLocalhostForUSB = true;

  static String get apiBaseUrl {
    // Determine the correct API URL based on platform
    String url;

    if (Platform.isAndroid) {
      // For USB debugging with ADB reverse: use localhost
      // Run: adb reverse tcp:45357 tcp:45357
      if (useLocalhostForUSB) {
        url = 'http://localhost:45357/api';
        debugPrint(
          'AppConfig: apiBaseUrl = $url (Android USB debugging - using localhost)',
        );
      } else {
        // For Android physical devices over WiFi: Use IP address instead of localhost
        // localhost doesn't work on physical Android devices
        // For Android emulator: use 10.0.2.2 to connect to host machine's localhost
        // For physical devices: use the actual server IP address
        url = 'http://192.168.1.38:45357/api';
        debugPrint(
          'AppConfig: apiBaseUrl = $url (Android physical device - using IP address)',
        );
      }
    } else {
      // For iOS or web
      url = 'http://localhost:45357/api';
      debugPrint('AppConfig: apiBaseUrl = $url (iOS/Web - using localhost)');
    }

    return url;
  }

  // For development, you might want to use localhost
  static String get localApiBaseUrl {
    return 'http://localhost:45357/api';
  }

  // For testing with a different IP
  static String get testApiBaseUrl {
    return 'http://192.168.1.38:45357/api'; // Local machine IP for physical device
  }

  // Alternative IP addresses for different scenarios
  static String get alternativeApiBaseUrl {
    return 'http://192.168.1.38:45357/api'; // Current computer's IP address
  }

  // App Configuration
  static const String appName = 'House Help';
  static const String version = '1.0.0';

  // Feature flags
  static const bool enableDebugLogging = true;
  // Updated backend URL for login fix - Test customer created
  static const bool enableMockData = false;

  // Network configuration
  static const Duration requestTimeout = Duration(seconds: 30);
  static const int maxRetries = 3;

  // Razorpay Configuration
  static const String razorpayTestKey = 'rzp_test_S5NgGMcDqTBauH';
  static const String razorpayLiveKey = 'rzp_live_your_live_key_here';
  static const bool isRazorpayTestMode = true;

  // Default contact/email for payment prefill (fallback values)
  static const String defaultContactNumber = '9999999999';
  static const String defaultEmail = 'test@example.com';
}
