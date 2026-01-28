import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'auth_provider.dart';
import 'location_provider.dart';
import 'theme_provider.dart';
import 'user_provider.dart';
import 'service_provider.dart';
import 'worker_provider.dart';
import 'slot_provider.dart';
import 'booking_provider.dart';
import 'review_provider.dart';

/// Provider manager to handle initialization and access patterns
class ProviderManager {
  static const Duration _initTimeout = Duration(seconds: 10);

  /// Check if all required providers are available
  static bool areProvidersAvailable(BuildContext context) {
    try {
      // Check core providers that are essential for app functionality
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );
      final themeProvider = Provider.of<ThemeProvider>(context, listen: false);
      final userProvider = Provider.of<UserProvider>(context, listen: false);

      // Only check if providers exist, not their internal state
      return authProvider != null &&
          locationProvider != null &&
          themeProvider != null &&
          userProvider != null;
    } catch (e) {
      debugPrint('Provider availability check failed: $e');
      return false;
    }
  }

  /// Safely get a provider with error handling
  static T? safeGetProvider<T extends ChangeNotifier>(
    BuildContext context, {
    bool listen = false,
  }) {
    try {
      return Provider.of<T>(context, listen: listen);
    } catch (e) {
      debugPrint('Failed to get provider $T: $e');
      return null;
    }
  }

  /// Initialize providers with proper error handling
  static Future<bool> initializeProviders(BuildContext context) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final themeProvider = Provider.of<ThemeProvider>(context, listen: false);

      // Initialize auth provider
      await authProvider.checkAuth();

      // Initialize location provider
      await Future.delayed(
        Duration(milliseconds: 500),
      ); // Allow auth to complete
      await locationProvider.refreshLocation();

      // Initialize user provider if user is authenticated
      if (authProvider.isAuthenticated && authProvider.user != null) {
        userProvider.setUser(authProvider.user!);
      }

      return true;
    } catch (e) {
      debugPrint('Provider initialization failed: $e');
      return false;
    }
  }

  /// Check if providers need re-initialization
  static bool needsReinitialization(BuildContext context) {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      return authProvider.isLoading;
    } catch (e) {
      return true;
    }
  }
}

/// Provider state widget to handle initialization states
class ProviderStateWidget extends StatelessWidget {
  final Widget child;
  final VoidCallback onProviderError;

  const ProviderStateWidget({
    Key? key,
    required this.child,
    required this.onProviderError,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<bool>(
      stream: _checkProvidersStream(context),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildInitializingScreen();
        }

        // Only show error screen if there's an actual error, not just timeout
        if (snapshot.hasError) {
          return _buildProviderErrorScreen(() {
            // For now, just call the callback without navigation
            // The parent will handle the restart
            onProviderError();
          });
        }

        // If providers are available or we timed out waiting, show the child
        // This prevents infinite restart loops
        return child;
      },
    );
  }

  Stream<bool> _checkProvidersStream(BuildContext context) async* {
    // Check providers every 500ms during initialization
    for (int i = 0; i < 20; i++) {
      // 10 seconds max
      if (ProviderManager.areProvidersAvailable(context)) {
        yield true;
        break;
      }
      await Future.delayed(Duration(milliseconds: 500));
    }

    // If we reach here, providers are still not available
    yield false;
  }

  Widget _buildInitializingScreen() {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.blue),
              SizedBox(height: 16),
              Text(
                'Initializing application...',
                style: TextStyle(fontSize: 16),
              ),
              SizedBox(height: 8),
              Text(
                'Setting up providers and services',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProviderErrorScreen(VoidCallback onRetry) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text(
                'Application Error',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text(
                'Failed to initialize application providers',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14),
              ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                child: Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
