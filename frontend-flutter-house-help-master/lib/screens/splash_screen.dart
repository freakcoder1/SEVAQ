import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import 'location_setup_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _logoAnimation;
  late Animation<double> _textAnimation;
  late Animation<double> _subtitleAnimation;
  late Animation<double> _loadingAnimation;
  late Animation<double> _fadeAnimation;
  Animation<Color?>? _bgColorAnimation;

  bool _themeInitialized = false;
  bool _hasCheckedLocation = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();

    // Initialize animation controller
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    // Logo scale animation with bouncy effect
    _logoAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );

    // Title text animation (position and opacity)
    _textAnimation = Tween<double>(begin: 30, end: 0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    // Subtitle fade animation
    _subtitleAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeInOut),
      ),
    );

    // Loading indicator animation
    _loadingAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.7, 1.0, curve: Curves.easeInOut),
      ),
    );

    // Overall fade animation
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    // Start animations
    _animationController.forward();

    // Initialize theme-dependent animations after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _initializeThemeDependentAnimations(Theme.of(context));
      }
    });

    // Start location check after build completes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAuthStatus();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _checkAuthStatus() async {
    if (_isLoading) return;
    _isLoading = true;

    try {
      // Simulate splash screen duration (skip in test environment)
      if (!const bool.fromEnvironment('dart.vm.product')) {
        // Skip delay during tests
      } else {
        await Future.delayed(const Duration(seconds: 2));
      }

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );

      // Check if user is authenticated and location is set up
      if (authProvider.isAuthenticated) {
        // Check if location setup is needed
        if (locationProvider.needsLocationSetup()) {
          // Navigate to location setup
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => LocationSetupScreen()),
            );
          }
        } else {
          // Navigate to auth wrapper (which will handle main navigation)
          if (mounted) {
            Navigator.pushReplacementNamed(context, '/auth');
          }
        }
      } else {
        // Navigate to auth wrapper
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/auth');
        }
      }
    } catch (e) {
      debugPrint('SplashScreen: Error in _checkAuthStatus: $e');
      _isLoading = false;
    }
  }

  void _checkExistingLocation() async {
    debugPrint('SplashScreen._checkExistingLocation: called');

    // Prevent multiple simultaneous checks
    if (_hasCheckedLocation) {
      debugPrint(
        'SplashScreen._checkExistingLocation: Already checked, skipping',
      );
      return;
    }

    _hasCheckedLocation = true;

    final locationProvider = Provider.of<LocationProvider>(
      context,
      listen: false,
    );

    // Check if user already has location data saved
    if (locationProvider.currentLocationData != null) {
      debugPrint('SplashScreen: Location already set, no need for setup');
    } else {
      debugPrint('SplashScreen: No location data found');
    }
  }

  void _initializeThemeDependentAnimations(ThemeData theme) {
    debugPrint('SplashScreen._initializeThemeDependentAnimations: START');
    _bgColorAnimation = ColorTween(
      begin: theme.scaffoldBackgroundColor.withAlpha((0.8 * 255).round()),
      end: theme.scaffoldBackgroundColor,
    ).animate(_animationController);
    debugPrint(
      'SplashScreen._initializeThemeDependentAnimations: END - _bgColorAnimation.value=${_bgColorAnimation?.value}',
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Watch location provider to trigger rebuild when location changes
    final locationProvider = context.watch<LocationProvider>();
    final currentLocation = locationProvider.currentLocationData;
    final hasCompletedSetup = !locationProvider.needsLocationSetup();

    debugPrint(
      'SplashScreen.build: START, location=$currentLocation, completed=$hasCompletedSetup',
    );

    // Check location on every build
    _checkExistingLocation();

    // Initialize theme-dependent animations if not already done
    if (!_themeInitialized) {
      _initializeThemeDependentAnimations(theme);
      _themeInitialized = true;
      debugPrint('SplashScreen.build: Theme initialized');
    }

    // Safety check - ensure animation is not null
    final bgColor = _bgColorAnimation?.value ?? theme.scaffoldBackgroundColor;
    debugPrint(
      'SplashScreen.build: bgColor=$bgColor, location=$currentLocation',
    );

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  theme.primaryColor.withAlpha((0.1 * 255).round()),
                  theme.colorScheme.surface.withAlpha((0.95 * 255).round()),
                  theme.colorScheme.surface,
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),

          // Animated content
          AnimatedBuilder(
            animation: _fadeAnimation,
            builder: (context, child) {
              return Opacity(opacity: _fadeAnimation.value, child: child);
            },
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo with animation
                  AnimatedBuilder(
                    animation: _logoAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _logoAnimation.value,
                        child: child,
                      );
                    },
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                theme.primaryColor,
                                theme.primaryColor.withValues(alpha: 0.8),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: theme.colorScheme.shadow.withValues(
                                  alpha: (0.2 * 255).round().toDouble(),
                                ),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.home_repair_service,
                            size: 64,
                            color: theme.colorScheme.onPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Title with animation
                  AnimatedBuilder(
                    animation: _textAnimation,
                    builder: (context, child) {
                      return Transform.translate(
                        offset: Offset(0, _textAnimation.value),
                        child: Opacity(
                          opacity: _textAnimation.value > 10 ? 1.0 : 0.0,
                          child: child,
                        ),
                      );
                    },
                    child: Text(
                      'Sevaq',
                      style: theme.textTheme.displayLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.primaryColor,
                        shadows: [
                          Shadow(
                            color: theme.colorScheme.shadow.withAlpha(
                              (0.3 * 255).round(),
                            ),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Subtitle with fade animation
                  AnimatedBuilder(
                    animation: _subtitleAnimation,
                    builder: (context, child) {
                      return Opacity(
                        opacity: _subtitleAnimation.value,
                        child: child,
                      );
                    },
                    child: Text(
                      'Your trusted home services partner',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Enhanced loading indicator
                  AnimatedBuilder(
                    animation: _loadingAnimation,
                    builder: (context, child) {
                      return Opacity(
                        opacity: _loadingAnimation.value,
                        child: child,
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface.withAlpha(
                          (0.8 * 255).round(),
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.shadow.withAlpha(
                              (0.1 * 255).round(),
                            ),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(
                            color: theme.primaryColor,
                            strokeWidth: 2,
                          ),
                          const SizedBox(width: 16),
                          Text(
                            'Setting up your experience...',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Trust and speed messaging
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: AnimatedBuilder(
              animation: _fadeAnimation,
              builder: (context, child) {
                return Opacity(opacity: _fadeAnimation.value, child: child);
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.primaryColor,
                        size: 24,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '100% Verified',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.hourglass_bottom,
                        color: theme.primaryColor,
                        size: 24,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '30 min ETA',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.support_agent,
                        color: theme.primaryColor,
                        size: 24,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '24/7 Support',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
