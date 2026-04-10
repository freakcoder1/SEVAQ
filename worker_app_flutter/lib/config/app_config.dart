import 'dart:io';
import 'package:flutter/foundation.dart';

class AppConfig {
  // ──────────────────────────────────────────────────────────────────────────
  // API Configuration — Environment-Aware
  // ──────────────────────────────────────────────────────────────────────────

  /// Compile-time override supplied via `--dart-define=API_BASE_URL=…`
  static const String _envApiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Production API URL — replace with your actual production domain.
  static const String _productionApiBaseUrl =
      'https://sevaq-production.up.railway.app/api';

  /// Development API URL used when running on iOS / web / Android via USB.
  /// Use port 45357 for local backend server (default backend port)
  /// For Android USB debugging with ADB reverse, use localhost:45357 (physical device)
  static const String _devLocalhostUrl = 'http://localhost:45357/api';

  /// Development API URL for Android physical devices over WiFi.
  /// Override at build time: --dart-define=DEV_WIFI_IP=192.168.x.x
  static const String _envDevWifiIp = String.fromEnvironment(
    'DEV_WIFI_IP',
    defaultValue: '192.168.1.38',
  );
  static String get _devWifiUrl => 'http://$_envDevWifiIp:45357/api';

  /// Flag to use localhost (for USB debugging with ADB reverse).
  /// Set to false when ADB device cannot resolve localhost to host IP.
  static const bool useLocalhostForUSB = true;

  /// Set to TRUE to use production URL in debug mode (for testing with remote backend)
  /// Set to FALSE to use localhost URL (for USB debugging with local backend)
  static const bool useProductionForDebug = false;

  /// Returns the appropriate API base URL for the current build mode and
  /// platform.
  static String get apiBaseUrl {
    // For development, check if we should use production URL for physical device testing
    if (kDebugMode) {
      // Use localhost for USB debugging with ADB reverse
      // Use dev wifi URL for physical device over WiFi
      // Use production only when explicitly needed
      if (useProductionForDebug) {
        debugPrint(
          'AppConfig: apiBaseUrl = $_productionApiBaseUrl (Debug mode - Production)',
        );
        return _productionApiBaseUrl;
      }

      // Use localhost for USB debugging or WiFi for physical device
      if (Platform.isAndroid) {
        // For USB debugging with ADB reverse: use localhost
        // For WiFi debugging: use WiFi IP
        if (useLocalhostForUSB) {
          debugPrint(
            'AppConfig: apiBaseUrl = $_devLocalhostUrl (Debug mode - USB/Localhost)',
          );
          return _devLocalhostUrl;
        } else {
          debugPrint(
            'AppConfig: apiBaseUrl = $_devWifiUrl (Debug mode - WiFi)',
          );
          return _devWifiUrl;
        }
      }

      // For iOS, use localhost
      debugPrint(
        'AppConfig: apiBaseUrl = $_devLocalhostUrl (Debug mode - iOS)',
      );
      return _devLocalhostUrl;
    }

    // Release / profile builds → production URL
    return _productionApiBaseUrl;
  }

  /// Request timeout duration
  static const Duration requestTimeout = Duration(seconds: 30);
}
