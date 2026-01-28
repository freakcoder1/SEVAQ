import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import 'login_screen.dart';
import 'location_first_splash_screen.dart';
import 'main_navigation.dart';
import 'splash_screen.dart';

/// AuthWrapper - The NEW home widget that handles all auth/location gating logic.
///
/// This widget MUST always be created under provider scope (never via Navigator.push).
/// It determines which screen to show based on authentication and location state:
///
/// - Initial load → SplashScreen
/// - If not authenticated → LoginScreen
/// - If authenticated but no location → LocationFirstSplashScreen
/// - If authenticated and location set → MainNavigation (pure navigation shell)
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> with WidgetsBindingObserver {
  // Navigation debounce: prevent multiple navigation calls
  bool _hasNavigated = false;
  DateTime _lastBuildTime = DateTime.now();
  static const int _DEBOUNCE_MS = 1500; // 1.5 seconds debounce

  // Initialization delay to wait for async providers (SharedPreferences) to load
  // This prevents showing LoginScreen briefly during app resume
  static const int _INIT_DELAY_MS = 500;
  bool _hasCompletedFirstBuild = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    debugPrint('AuthWrapper: initState called');
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      debugPrint('AuthWrapper: App resumed from background');
      // Reset navigation flag when app resumes
      // This allows fresh navigation decision after providers re-initialize
      _hasNavigated = false;
      _lastBuildTime = DateTime.now().subtract(
        const Duration(milliseconds: _DEBOUNCE_MS),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch both auth and location providers for changes
    final auth = context.watch<AuthProvider>();
    final locationProvider = context.watch<LocationProvider>();

    debugPrint(
      'AuthWrapper.build: isLoading=${auth.isLoading}, isAuthenticated=${auth.isAuthenticated}, needsLocationSetup=${locationProvider.needsLocationSetup()}',
    );

    // Handle initial load - show splash screen
    if (!_hasCompletedFirstBuild) {
      _hasCompletedFirstBuild = true;
      return const SplashScreen();
    }

    // Handle loading state - wait for providers to initialize
    if (auth.isLoading || !locationProvider.ready) {
      debugPrint('AuthWrapper: Still initializing, showing loading screen');
      return _buildLoadingScreen();
    }

    // Handle unauthenticated state
    if (!auth.isFullyAuthenticated) {
      debugPrint('AuthWrapper: Showing LoginScreen');
      _hasNavigated = false;
      return LoginScreen();
    }

    // Handle authenticated but no location setup
    if (locationProvider.needsLocationSetup()) {
      debugPrint('AuthWrapper: Showing LocationFirstSplashScreen');
      _hasNavigated = false;
      return LocationFirstSplashScreen();
    }

    // Handle authenticated with location - show main navigation directly
    debugPrint('AuthWrapper: Showing MainNavigation');
    return MainNavigation();
  }

  Widget _buildLoadingScreen() {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Checking authentication...'),
          ],
        ),
      ),
    );
  }
}
