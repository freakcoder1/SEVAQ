import 'package:flutter/foundation.dart';

import 'package:flutter/foundation.dart';

class AppConfig {
  // API Configuration
  static String get apiBaseUrl {
    // Use localhost for Chrome browser (web)
    if (kIsWeb) {
      final url = 'http://localhost:45357/api';
      debugPrint('AppConfig: apiBaseUrl = $url');
      return url;
    } else {
      // Use computer's IP address for physical Android devices
      final url = 'http://192.168.1.45:45357/api';
      debugPrint('AppConfig: apiBaseUrl = $url');
      return url;
    }
  }

  // For development, you might want to use localhost
  static String get localApiBaseUrl {
    return 'http://localhost:45357/api';
  }

  // For testing with a different IP
  static String get testApiBaseUrl {
    return 'http://192.168.1.45:45357/api'; // Local machine IP for physical device
  }

  // Alternative IP addresses for different scenarios
  static String get alternativeApiBaseUrl {
    return 'http://192.168.1.45:45357/api'; // Current computer's IP address
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
}
