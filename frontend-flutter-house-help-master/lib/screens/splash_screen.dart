import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import 'location_setup_screen.dart';

/// SplashScreen - Enhanced splash screen with sophisticated animations
///
/// This splash screen replaces the simple static version with:
/// - Complex animation system using AnimationController
/// - Sophisticated visual effects (gradients, blur, shadows)
/// - Provider-based state management with AuthWrapper pattern
/// - Trust badges and enhanced loading indicators
class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
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

    // Start location check
    _checkAuthStatus();
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
      // Simulate splash screen duration
      await Future.delayed(const Duration(seconds: 2));

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

    debugPrint(
      'SplashScreen: currentLocation=${locationProvider.currentLocationData}',
    );
    debugPrint(
      'SplashScreen: needsLocationSetup=${locationProvider.needsLocationSetup()}',
    );

    // Check if user has already set location
    if (locationProvider.currentLocationData != null) {
      debugPrint(
        'SplashScreen: Location exists, marking setup complete immediately',
      );
      debugPrint(
        'SplashScreen: About to call markLocationSetupComplete after build',
      );
      // Mark location setup complete AFTER build to avoid setState during build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        locationProvider.markLocationSetupComplete();
        debugPrint(
          'SplashScreen: markLocationSetupComplete called after build',
        );
      });

      // Check service availability in background
      await locationProvider.checkServiceAvailability(
        locationProvider.currentLocationData!.latitude ?? 0.0,
        locationProvider.currentLocationData!.longitude ?? 0.0,
      );
      debugPrint('SplashScreen: Availability check complete');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Watch location provider to trigger rebuild when location changes
    final locationProvider = context.watch<LocationProvider>();
    final currentLocation = locationProvider.currentLocationData;
    final hasCompletedSetup = locationProvider.hasCompletedLocationSetup;

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
                                theme.primaryColor.withOpacity(0.8),
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
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildTrustBadge(Icons.security, 'Secure'),
                  _buildTrustBadge(Icons.speed, 'Fast'),
                  _buildTrustBadge(Icons.thumb_up, 'Trusted'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String text) {
    return Column(
      children: [
        Icon(icon, color: Theme.of(context).primaryColor, size: 20),
        const SizedBox(height: 4),
        Text(
          text,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  void _initializeThemeDependentAnimations(ThemeData theme) {
    debugPrint('SplashScreen._initializeThemeDependentAnimations: START');

    // Initialize background color animation
    _bgColorAnimation = ColorTween(
      begin: theme.scaffoldBackgroundColor,
      end: theme.scaffoldBackgroundColor,
    ).animate(_animationController);

    debugPrint(
      'SplashScreen._initializeThemeDependentAnimations: END - _bgColorAnimation.value=${_bgColorAnimation?.value}',
    );
  }
}
