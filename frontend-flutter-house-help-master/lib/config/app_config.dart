class AppConfig {
  // API Configuration
  static String get apiBaseUrl {
    // Use the correct IP address for your backend server
    // For Android devices, use the host machine's IP address
    return 'http://192.168.29.154:45357';
  }
  
  // For development, you might want to use localhost
  static String get localApiBaseUrl {
    return 'http://localhost:3000';
  }
  
  // For testing with a different IP
  static String get testApiBaseUrl {
    return 'http://10.0.2.2:3000'; // Android emulator localhost
  }
  
  // Alternative IP addresses for different scenarios
  static String get alternativeApiBaseUrl {
    return 'http://192.168.1.100:3000'; // Common local network IP
  }
  
  // App Configuration
  static const String appName = 'House Help';
  static const String version = '1.0.0';
  
  // Feature flags
  static const bool enableDebugLogging = true;
  static const bool enableMockData = false;
  
  // Network configuration
  static const Duration requestTimeout = Duration(seconds: 30);
  static const int maxRetries = 3;
}