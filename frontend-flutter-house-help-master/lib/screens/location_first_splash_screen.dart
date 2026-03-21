import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import 'location_setup_screen.dart';

/// LocationFirstSplashScreen - A splash screen shown when location is not set.
///
/// IMPORTANT: This screen should NOT push MainScreen directly via Navigator.
/// Instead, when location is set, it should just pop() and let AuthWrapper
/// handle the transition based on provider state changes.
///
/// The AuthWrapper watches the LocationProvider and will automatically
/// transition to MainNavigation when needsLocationSetup() returns false.
class LocationFirstSplashScreen extends StatefulWidget {
  const LocationFirstSplashScreen({super.key});

  @override
  _LocationFirstSplashScreenState createState() =>
      _LocationFirstSplashScreenState();
}

class _LocationFirstSplashScreenState extends State<LocationFirstSplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _logoAnimation;
  late Animation<double> _textAnimation;
  Animation<Color?>? _bgColorAnimation; // Made nullable for safety
  bool _themeInitialized = false;
  late Animation<double> _fadeAnimation;
  bool _hasCheckedLocation = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _logoAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );

    _textAnimation = Tween<double>(begin: 30, end: 0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    _animationController.forward();

    // Initialize theme-dependent animations after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {}
    });

    _checkExistingLocation();
  }

  void _checkExistingLocation() async {
    debugPrint('LocationFirstSplashScreen._checkExistingLocation: called');

    // Prevent multiple simultaneous checks
    if (_hasCheckedLocation) {
      debugPrint(
        'LocationFirstSplashScreen._checkExistingLocation: Already checked, skipping',
      );
      return;
    }

    _hasCheckedLocation = true;

    final locationProvider = Provider.of<LocationProvider>(
      context,
      listen: false,
    );

    debugPrint(
      'LocationFirstSplashScreen: currentLocation=${locationProvider.currentLocationData}',
    );
    debugPrint(
      'LocationFirstSplashScreen: needsLocationSetup=${locationProvider.needsLocationSetup()}',
    );

    // Check if user has already set location
    if (locationProvider.currentLocationData != null) {
      debugPrint(
        'LocationFirstSplashScreen: Location exists, marking setup complete immediately',
      );
      // Mark location setup complete IMMEDIATELY - AuthWrapper will automatically transition
      // DO NOT use Future.delayed - it causes race conditions and blank screens
      locationProvider.markLocationSetupComplete();

      // Check service availability in background (doesn't block UI)
      await locationProvider.checkServiceAvailability();
      debugPrint(
        'LocationFirstSplashScreen: Availability check complete, AuthWrapper will transition',
      );
    } else {
      debugPrint(
        'LocationFirstSplashScreen: No location, navigating to LocationSetupScreen',
      );
      // Navigate to location setup - this pushes on top of the current screen
      // When LocationSetupScreen completes, we return here and rebuild will check location again
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          debugPrint('LocationFirstSplashScreen: Pushing LocationSetupScreen');
          // Reset the check flag so we check location again when we return
          _hasCheckedLocation = false;
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => LocationSetupScreen()),
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Watch location provider to trigger rebuild when location changes
    // This ensures we check location again when returning from LocationSetupScreen
    final locationProvider = context.watch<LocationProvider>();
    final currentLocation = locationProvider.currentLocationData;
    final hasCompletedSetup = !locationProvider.needsLocationSetup();

    debugPrint(
      'LocationFirstSplashScreen.build: START, location=$currentLocation, completed=$hasCompletedSetup',
    );

    // Check location on every build (not just first time)
    // This handles the case when returning from LocationSetupScreen
    _checkExistingLocation();

    // Initialize theme-dependent animations if not already done
    if (!_themeInitialized) {
      _initializeThemeDependentAnimations(theme);
      _themeInitialized = true;
      debugPrint('LocationFirstSplashScreen.build: Theme initialized');
    }

    // Safety check - ensure animation is not null
    final bgColor = _bgColorAnimation?.value ?? theme.scaffoldBackgroundColor;
    debugPrint(
      'LocationFirstSplashScreen.build: bgColor=$bgColor, location=$currentLocation',
    );

    // If location is now set and setup is complete, show the splash content (transition will happen via AuthWrapper)
    // Otherwise, show the location setup UI

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

          // Content
          Center(
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
                              theme.primaryColor.withValues(alpha:0.8),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: theme.colorScheme.shadow.withAlpha(
                                (0.2 * 255).round(),
                              ),
                              blurRadius: 20,
                              offset: Offset(0, 10),
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
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                // Subtitle
                Text(
                  'Your trusted home services partner',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 40),

                // Loading indicator
                AnimatedBuilder(
                  animation: _animationController,
                  builder: (context, child) {
                    return Opacity(
                      opacity: _animationController.value,
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
                          offset: Offset(0, 4),
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
    debugPrint(
      'LocationFirstSplashScreen._initializeThemeDependentAnimations: START',
    );
    // Initialize with a default color to prevent null values on first build
    _bgColorAnimation = ColorTween(
      begin: theme.scaffoldBackgroundColor,
      end: theme.scaffoldBackgroundColor,
    ).animate(_animationController);
    debugPrint(
      'LocationFirstSplashScreen._initializeThemeDependentAnimations: END - _bgColorAnimation.value=${_bgColorAnimation?.value}',
    );
  }
}
