import 'dart:io';
import 'package:flutter/foundation.dart';

class AppConfig {
  // ──────────────────────────────────────────────────────────────────────────
  // API Configuration — Environment-Aware
  // ──────────────────────────────────────────────────────────────────────────
  //
  // Override at build time with:
  //   flutter run   --dart-define=API_BASE_URL=http://your-server:port/api
  //   flutter build --dart-define=API_BASE_URL=https://api.production.com/api
  //
  // If API_BASE_URL is provided via --dart-define it takes precedence over
  // every other heuristic below.
  // ──────────────────────────────────────────────────────────────────────────

  /// Compile-time override supplied via `--dart-define=API_BASE_URL=…`
  static const String _envApiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Production API URL — replace with your actual production domain.
  static const String _productionApiBaseUrl =
      'https://sevaq-production.up.railway.app/api';

  /// Development API URL used when running on iOS / web / Android via USB.
  /// Use port 45357 for local backend server (default backend port)
  static const String _devLocalhostUrl = 'http://localhost:45357/api';

  /// Development API URL for Android physical devices over WiFi.
  /// Override at build time: --dart-define=DEV_WIFI_IP=192.168.x.x
  static const String _envDevWifiIp = String.fromEnvironment(
    'DEV_WIFI_IP',
    defaultValue: '192.168.1.38',
  );
  static String get _devWifiUrl => 'http://$_envDevWifiIp:45357/api';

  /// Flag to use localhost (for USB debugging with ADB reverse).
  /// In release mode this is ignored because the production URL is used.
  /// Set to FALSE to use WiFi IP for more reliable connectivity (works in background).
  static const bool useLocalhostForUSB = true;

  /// Set to FALSE to use production URL even in debug mode.
  /// When FALSE, overrides WiFi IP to use production URL instead.
  static const bool useProductionForDebug = false;

  /// Returns the appropriate API base URL for the current build mode and
  /// platform.
  ///
  /// Priority:
  /// 1. `--dart-define=API_BASE_URL` (always wins if provided)
  /// 2. Release mode → [_productionApiBaseUrl]
  /// 3. Debug mode   → platform-specific dev URL
  static String get apiBaseUrl {
    // 1. Explicit override via --dart-define
    if (_envApiBaseUrl.isNotEmpty) {
      if (kDebugMode) {
        debugPrint(
          'AppConfig: apiBaseUrl = $_envApiBaseUrl (from --dart-define)',
        );
      }
      return _envApiBaseUrl;
    }

    // 2. Release / profile builds → production URL
    if (kReleaseMode) {
      return _productionApiBaseUrl;
    }

    // 3. Debug builds → platform-aware dev URL
    String url;
    if (!kIsWeb && Platform.isAndroid) {
      if (useLocalhostForUSB) {
        url = _devLocalhostUrl;
        debugPrint(
          'AppConfig: apiBaseUrl = $url (Android USB debugging — localhost)',
        );
      } else if (useProductionForDebug) {
        // Force production URL for physical device testing
        url = _productionApiBaseUrl;
        debugPrint('AppConfig: apiBaseUrl = $url (Production for debug)');
      } else {
        url = _devWifiUrl;
        debugPrint('AppConfig: apiBaseUrl = $url (Android WiFi — IP address)');
      }
    } else {
      url = _devLocalhostUrl;
      debugPrint('AppConfig: apiBaseUrl = $url (iOS/Web — localhost)');
    }
    return url;
  }

  /// Convenience getter kept for backward compatibility.
  static String get localApiBaseUrl => _devLocalhostUrl;

  /// Convenience getter kept for backward compatibility.
  static String get testApiBaseUrl => _devWifiUrl;

  /// Convenience getter kept for backward compatibility.
  static String get alternativeApiBaseUrl => _devWifiUrl;

  // ──────────────────────────────────────────────────────────────────────────
  // App Configuration
  // ──────────────────────────────────────────────────────────────────────────
  static const String appName = 'House Help';
  static const String version = '1.0.0';

  // ──────────────────────────────────────────────────────────────────────────
  // Feature Flags
  // ──────────────────────────────────────────────────────────────────────────

  /// Debug logging is automatically disabled in release builds.
  static const bool enableDebugLogging = kDebugMode;

  static const bool enableMockData = false;

  // ──────────────────────────────────────────────────────────────────────────
  // Network Configuration
  // ──────────────────────────────────────────────────────────────────────────
  static const Duration requestTimeout = Duration(seconds: 30);
  static const int maxRetries = 3;

  // ──────────────────────────────────────────────────────────────────────────
  // Razorpay Configuration
  // ──────────────────────────────────────────────────────────────────────────
  // TODO: Configure per environment. Do NOT hardcode real keys here.
  // Use --dart-define=RAZORPAY_KEY=your_key or a .env file with flutter_dotenv.
  static const String razorpayTestKey = String.fromEnvironment(
    'RAZORPAY_TEST_KEY',
    defaultValue: 'rzp_test_S5NgGMcDqTBauH',
  );
  static const String razorpayLiveKey = String.fromEnvironment(
    'RAZORPAY_LIVE_KEY',
    defaultValue: 'rzp_live_XXXXXXXXXXXX',
  );
  static const bool isRazorpayTestMode = true;

  // Default contact/email for payment prefill (fallback values)
  static const String defaultContactNumber = '9999999999';
  static const String defaultEmail = 'test@example.com';
}
