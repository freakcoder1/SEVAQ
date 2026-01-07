import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/user_provider.dart';
import '../providers/service_provider.dart';
import '../providers/worker_provider.dart';
import '../providers/slot_provider.dart';
import '../providers/booking_provider.dart';
import '../providers/review_provider.dart';
import '../screens/auth_wrapper.dart';
import '../screens/main_screen.dart';
import '../screens/main_navigation.dart';

/// Navigation scope validation result
class NavigationScopeValidation {
  final bool isValid;
  final String message;
  final List<String> issues;

  NavigationScopeValidation({
    required this.isValid,
    required this.message,
    this.issues = const [],
  });
}

/// Provider diagnostics tool to help identify and resolve Provider issues
class ProviderDiagnostics {
  static final Map<String, String> _diagnosticLogs = {};
  static final List<String> _errorLogs = [];

  /// Run comprehensive diagnostics on all providers
  static Future<Map<String, dynamic>> runDiagnostics(
    BuildContext context,
  ) async {
    final results = <String, dynamic>{};

    try {
      // Test each provider individually
      results['auth_provider'] = _testAuthProvider(context);
      results['location_provider'] = _testLocationProvider(context);
      results['theme_provider'] = _testThemeProvider(context);
      results['user_provider'] = _testUserProvider(context);
      results['service_provider'] = _testServiceProvider(context);
      results['worker_provider'] = _testWorkerProvider(context);
      results['slot_provider'] = _testSlotProvider(context);
      results['booking_provider'] = _testBookingProvider(context);
      results['review_provider'] = _testReviewProvider(context);

      // Test provider relationships
      results['provider_relationships'] = _testProviderRelationships(context);

      // Test initialization timing
      results['initialization_timing'] = _testInitializationTiming(context);

      // Generate summary
      results['summary'] = _generateSummary(results);

      _logDiagnosticResults(results);
    } catch (e) {
      results['error'] = 'Diagnostic failed: $e';
      _errorLogs.add('Diagnostic error: $e');
    }

    return results;
  }

  static Map<String, dynamic> _testAuthProvider(BuildContext context) {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      return {
        'status': 'success',
        'isAuthenticated': authProvider.isAuthenticated,
        'isLoading': authProvider.isLoading,
        'hasUser': authProvider.user != null,
        'userEmail': authProvider.user?.email ?? 'null',
      };
    } catch (e) {
      _errorLogs.add('Auth provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testLocationProvider(BuildContext context) {
    try {
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );
      return {
        'status': 'success',
        'hasLocationData': locationProvider.currentLocationData != null,
        'isLoading': locationProvider.isLoading,
        'hasLocation':
            locationProvider.currentLocation != 'Fetching location...',
        'location': locationProvider.currentLocation,
        'hasAvailability': locationProvider.availabilityStatus != null,
      };
    } catch (e) {
      _errorLogs.add('Location provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testThemeProvider(BuildContext context) {
    try {
      final themeProvider = Provider.of<ThemeProvider>(context, listen: false);
      return {
        'status': 'success',
        'isDarkMode': themeProvider.isDarkMode,
        'theme': themeProvider.isDarkMode ? 'dark' : 'light',
      };
    } catch (e) {
      _errorLogs.add('Theme provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testUserProvider(BuildContext context) {
    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      return {
        'status': 'success',
        'hasUser': userProvider.currentUser != null,
        'userEmail': userProvider.currentUser?.email ?? 'null',
      };
    } catch (e) {
      _errorLogs.add('User provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testServiceProvider(BuildContext context) {
    try {
      final serviceProvider = Provider.of<ServiceProvider>(
        context,
        listen: false,
      );
      return {
        'status': 'success',
        'serviceCount': serviceProvider.services.length,
        'isLoading': serviceProvider.isLoading,
      };
    } catch (e) {
      _errorLogs.add('Service provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testWorkerProvider(BuildContext context) {
    try {
      final workerProvider = Provider.of<WorkerProvider>(
        context,
        listen: false,
      );
      return {
        'status': 'success',
        'workerCount': workerProvider.workers.length,
        'isLoading': workerProvider.isLoading,
      };
    } catch (e) {
      _errorLogs.add('Worker provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testSlotProvider(BuildContext context) {
    try {
      final slotProvider = Provider.of<SlotProvider>(context, listen: false);
      return {
        'status': 'success',
        'slotCount': slotProvider.slots.length,
        'isLoading': slotProvider.isLoading,
      };
    } catch (e) {
      _errorLogs.add('Slot provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testBookingProvider(BuildContext context) {
    try {
      final bookingProvider = Provider.of<BookingProvider>(
        context,
        listen: false,
      );
      return {
        'status': 'success',
        'bookingCount': bookingProvider.bookings.length,
        'isLoading': bookingProvider.isLoading,
      };
    } catch (e) {
      _errorLogs.add('Booking provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testReviewProvider(BuildContext context) {
    try {
      final reviewProvider = Provider.of<ReviewProvider>(
        context,
        listen: false,
      );
      return {
        'status': 'success',
        'reviewCount': reviewProvider.reviews.length,
        'isLoading': reviewProvider.isLoading,
      };
    } catch (e) {
      _errorLogs.add('Review provider error: $e');
      return {'status': 'error', 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _testProviderRelationships(BuildContext context) {
    final relationships = <String, dynamic>{};

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );
      final userProvider = Provider.of<UserProvider>(context, listen: false);

      relationships['auth_location_sync'] = {
        'authHasUser': authProvider.user != null,
        'locationHasData': locationProvider.currentLocationData != null,
        'userHasData': userProvider.currentUser != null,
        'sync_status': _checkProviderSync(
          authProvider,
          locationProvider,
          userProvider,
        ),
      };
    } catch (e) {
      relationships['error'] = 'Failed to test relationships: $e';
    }

    return relationships;
  }

  static String _checkProviderSync(
    AuthProvider auth,
    LocationProvider location,
    UserProvider user,
  ) {
    if (auth.isAuthenticated && auth.user != null) {
      if (user.currentUser == null) {
        return 'user_provider_not_synced';
      }
      if (location.currentLocationData == null) {
        return 'location_provider_not_initialized';
      }
      return 'synced';
    } else if (!auth.isAuthenticated) {
      return 'not_authenticated';
    }
    return 'unknown';
  }

  static Map<String, dynamic> _testInitializationTiming(BuildContext context) {
    final timing = <String, dynamic>{};

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );

      timing['auth_initialization'] = {
        'isLoading': authProvider.isLoading,
        'isInitialized':
            !authProvider.isLoading || authProvider.isAuthenticated,
      };

      timing['location_initialization'] = {
        'isLoading': locationProvider.isLoading,
        'isInitialized':
            !locationProvider.isLoading ||
            locationProvider.currentLocationData != null,
      };

      timing['overall_status'] = {
        'ready_for_use': !authProvider.isLoading && !locationProvider.isLoading,
        'needs_wait': authProvider.isLoading || locationProvider.isLoading,
      };
    } catch (e) {
      timing['error'] = 'Failed to test timing: $e';
    }

    return timing;
  }

  static Map<String, dynamic> _generateSummary(Map<String, dynamic> results) {
    final summary = <String, dynamic>{};
    int successCount = 0;
    int errorCount = 0;
    final issues = <String>[];

    // Count successes and errors
    results.forEach((key, value) {
      if (key.endsWith('_provider')) {
        if (value['status'] == 'success') {
          successCount++;
        } else {
          errorCount++;
          issues.add('$key: ${value['error']}');
        }
      }
    });

    // Check for specific issues
    if (results['auth_provider']['status'] == 'error') {
      issues.add('Authentication provider failed - user cannot login');
    }

    if (results['location_provider']['status'] == 'error') {
      issues.add('Location provider failed - services may not be available');
    }

    if (results['provider_relationships']['auth_location_sync']['sync_status'] !=
        'synced') {
      issues.add('Provider synchronization issue detected');
    }

    summary['total_providers'] = successCount + errorCount;
    summary['success_count'] = successCount;
    summary['error_count'] = errorCount;
    summary['status'] = errorCount == 0 ? 'healthy' : 'issues_detected';
    summary['issues'] = issues;
    summary['recommendations'] = _generateRecommendations(issues);

    return summary;
  }

  static List<String> _generateRecommendations(List<String> issues) {
    final recommendations = <String>[];

    if (issues.any((issue) => issue.contains('Auth provider'))) {
      recommendations.add('Restart the app and try logging in again');
      recommendations.add('Check internet connection and server availability');
    }

    if (issues.any((issue) => issue.contains('Location provider'))) {
      recommendations.add('Enable location permissions in app settings');
      recommendations.add('Ensure GPS is enabled on the device');
      recommendations.add('Try setting location manually');
    }

    if (issues.any((issue) => issue.contains('sync'))) {
      recommendations.add('Clear app data and restart');
      recommendations.add('Re-login to synchronize providers');
    }

    if (issues.isEmpty) {
      recommendations.add('All providers are working correctly');
    }

    return recommendations;
  }

  static void _logDiagnosticResults(Map<String, dynamic> results) {
    debugPrint('=== PROVIDER DIAGNOSTICS RESULTS ===');
    debugPrint('Summary: ${results['summary']}');

    results.forEach((key, value) {
      if (key != 'summary') {
        debugPrint('$key: ${value['status'] ?? 'unknown'}');
      }
    });

    if (_errorLogs.isNotEmpty) {
      debugPrint('=== ERRORS ===');
      _errorLogs.forEach((error) => debugPrint(error));
    }

    debugPrint('=== END DIAGNOSTICS ===');
  }

  /// Show diagnostic results in a dialog
  static void showDiagnosticDialog(
    BuildContext context,
    Map<String, dynamic> results,
  ) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Provider Diagnostics'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDiagnosticSummary(results['summary']),
                SizedBox(height: 16),
                _buildProviderStatusList(results),
                SizedBox(height: 16),
                _buildRecommendationsList(
                  results['summary']['recommendations'],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Close'),
            ),
          ],
        );
      },
    );
  }

  static Widget _buildDiagnosticSummary(Map<String, dynamic> summary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Status: ${summary['status']}',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: summary['status'] == 'healthy'
                ? Colors.green
                : Colors.orange,
          ),
        ),
        Text('Total Providers: ${summary['total_providers']}'),
        Text('Success: ${summary['success_count']}'),
        Text('Errors: ${summary['error_count']}'),
      ],
    );
  }

  static Widget _buildProviderStatusList(Map<String, dynamic> results) {
    final providerWidgets = <Widget>[];

    results.forEach((key, value) {
      if (key.endsWith('_provider') && value is Map) {
        final status = value['status'] ?? 'unknown';
        final color = status == 'success' ? Colors.green : Colors.red;

        providerWidgets.add(
          ListTile(
            leading: Icon(
              status == 'success' ? Icons.check_circle : Icons.error,
              color: color,
            ),
            title: Text(key.replaceAll('_', ' ')),
            subtitle: Text(status),
            trailing: status == 'error' ? Text(value['error'] ?? '') : null,
          ),
        );
      }
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Provider Status:', style: TextStyle(fontWeight: FontWeight.bold)),
        ...providerWidgets,
      ],
    );
  }

  static Widget _buildRecommendationsList(List<String> recommendations) {
    final recommendationWidgets = recommendations.map((rec) {
      return ListTile(
        leading: Icon(Icons.lightbulb, color: Colors.blue),
        title: Text(rec),
      );
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recommendations:', style: TextStyle(fontWeight: FontWeight.bold)),
        ...recommendationWidgets,
      ],
    );
  }

  /// Clear all diagnostic logs
  static void clearLogs() {
    _diagnosticLogs.clear();
    _errorLogs.clear();
  }

  /// Get all error logs
  static List<String> getErrorLogs() => _errorLogs;

  /// Get diagnostic summary
  static String getDiagnosticSummary() {
    if (_errorLogs.isEmpty) {
      return 'All providers are healthy';
    } else {
      return 'Found ${_errorLogs.length} provider issues';
    }
  }

  // =========================================================================
  // NAVIGATION SCOPE VALIDATION
  // =========================================================================

  /// Validates that the current context is within proper provider scope
  /// for screens that require provider access
  static NavigationScopeValidation validateNavigationScope(
    BuildContext context, {
    bool requireAuthProvider = true,
    bool requireLocationProvider = true,
  }) {
    final issues = <String>[];

    // Check if we have access to AuthProvider
    if (requireAuthProvider) {
      try {
        Provider.of<AuthProvider>(context, listen: false);
      } catch (e) {
        issues.add('AuthProvider not available: $e');
      }
    }

    // Check if we have access to LocationProvider
    if (requireLocationProvider) {
      try {
        Provider.of<LocationProvider>(context, listen: false);
      } catch (e) {
        issues.add('LocationProvider not available: $e');
      }
    }

    // Check if we're in a proper navigation context
    final widget = context.widget;
    if (widget is MainScreen || widget is MainNavigation) {
      // Check if we're inside an AuthWrapper
      bool foundAuthWrapper = false;
      context.visitAncestorElements((element) {
        if (element.widget is AuthWrapper) {
          foundAuthWrapper = true;
          return false; // Stop visiting
        }
        return true; // Continue visiting
      });

      if (!foundAuthWrapper) {
        issues.add(
          'MainScreen/MainNavigation created outside AuthWrapper - '
          'this will cause ProviderNotFoundException. '
          'Use AuthWrapper as the home widget instead of direct navigation.',
        );
      }
    }

    if (issues.isEmpty) {
      return NavigationScopeValidation(
        isValid: true,
        message: 'Navigation scope is valid - all required providers available',
      );
    }

    return NavigationScopeValidation(
      isValid: false,
      message: 'Navigation scope issues detected',
      issues: issues,
    );
  }

  /// Check if a widget is being created outside proper provider scope
  static bool isOutsideProviderScope(Widget widget, BuildContext context) {
    if (widget is MainScreen || widget is MainNavigation) {
      bool foundAuthWrapper = false;
      context.visitAncestorElements((element) {
        if (element.widget is AuthWrapper) {
          foundAuthWrapper = true;
          return false;
        }
        return true;
      });
      return !foundAuthWrapper;
    }
    return false;
  }

  /// Assert that the current context has proper provider scope
  /// Throws an assertion error if screen is created outside provider scope
  static void assertProperScope(BuildContext context, String screenName) {
    final validation = validateNavigationScope(context);
    if (!validation.isValid) {
      throw AssertionError(
        '$screenName was created outside proper provider scope.\n'
        'Issues: ${validation.issues.join("\n")}\n\n'
        'FIX: Use AuthWrapper as the home widget in MaterialApp. '
        'Never push MainScreen or MainNavigation directly via Navigator.',
      );
    }
  }
}
