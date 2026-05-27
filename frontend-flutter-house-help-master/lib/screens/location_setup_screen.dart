import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import '../widgets/location_picker_dialog.dart';

/// LocationSetupScreen - Screen for setting up user location.
///
/// IMPORTANT: This screen should NOT push MainScreen directly via Navigator.
/// When location is set successfully, it should mark the location as complete
/// and pop() to let AuthWrapper handle the transition based on provider state changes.
class LocationSetupScreen extends StatefulWidget {
  const LocationSetupScreen({super.key});

  @override
  _LocationSetupScreenState createState() => _LocationSetupScreenState();
}

class _LocationSetupScreenState extends State<LocationSetupScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    _slideAnimation = Tween<double>(begin: 50, end: 0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleLocationSelection(
    String option,
    LocationProvider locationProvider,
  ) async {
    debugPrint('LocationSetupScreen._handleLocationSelection: option=$option');
    try {
      switch (option) {
        case 'current':
          // Use current GPS location
          if (kIsWeb) {
            // On web, GPS is not available - show message
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'GPS location is not available on web. Please use the search option to find your location.',
                ),
                backgroundColor: Colors.orange,
              ),
            );
            return;
          }
          await locationProvider.refreshLocation();
          break;

        case 'new':
          // Open search dialog for new address
          await showDialog(
            context: context,
            builder: (context) =>
                LocationPickerDialog(locationProvider: locationProvider),
          );
          break;

        case 'saved':
          // Show saved locations in a bottom sheet
          await _showSavedLocationsBottomSheet(locationProvider);
          break;
      }

      debugPrint(
        'LocationSetupScreen: currentLocationData=${locationProvider.currentLocationData}',
      );

      // Check if location was successfully set
      if (locationProvider.currentLocationData != null) {
        debugPrint('LocationSetupScreen: Location set successfully');

        // Check service availability
        if (locationProvider.currentLocationData != null) {
          await locationProvider.checkServiceAvailability();
        }

        debugPrint(
          'LocationSetupScreen: Location setup complete, popping to return',
        );
        // Pop back to LocationFirstSplashScreen which will check location and transition
        if (mounted) {
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to set location: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  Future<void> _showSavedLocationsBottomSheet(
    LocationProvider locationProvider,
  ) async {
    final savedLocations = locationProvider.recentLocations;

    if (savedLocations.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No saved locations found. Please add a new location.'),
        ),
      );
      return;
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.location_on,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Saved Locations',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(
                      Icons.close,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: savedLocations.length,
                itemBuilder: (context, index) {
                  final location = savedLocations[index];
                  return InkWell(
                    onTap: () {
                      locationProvider.setManualLocation(location);
                      Navigator.of(context).pop();
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Theme.of(
                            context,
                          ).colorScheme.outline.withAlpha((0.2 * 255).round()),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurfaceVariant,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  location.address,
                                  style: Theme.of(context).textTheme.bodyLarge
                                      ?.copyWith(fontWeight: FontWeight.w500),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (location.city != null &&
                                    location.state != null)
                                  Text(
                                    '${location.city}, ${location.state}',
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: Theme.of(
                                            context,
                                          ).colorScheme.onSurfaceVariant,
                                        ),
                                  ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurfaceVariant,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _handleLocationSelection('new', locationProvider);
                  },
                  child: Text(
                    'Add New Location',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationProvider = Provider.of<LocationProvider>(context);
    final theme = Theme.of(context);

    debugPrint(
      'LocationSetupScreen.build: called, recentLocations=${locationProvider.recentLocations.length}',
    );

    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      body: Container(
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
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                AnimatedBuilder(
                  animation: _scaleAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _scaleAnimation.value,
                      child: child,
                    );
                  },
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface.withAlpha(
                            (0.8 * 255).round(),
                          ),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withAlpha((0.3 * 255).round()),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: theme.colorScheme.shadow.withAlpha(
                                (0.2 * 255).round(),
                              ),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.location_on,
                              color: theme.primaryColor,
                              size: 48,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Set Your Location',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'We need your location to show available services in your area',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Location Options
                AnimatedBuilder(
                  animation: _slideAnimation,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(0, _slideAnimation.value),
                      child: Opacity(
                        opacity: _fadeAnimation.value,
                        child: child,
                      ),
                    );
                  },
                  child: Column(
                    children: [
                      _buildOptionCard(
                        icon: Icons.my_location,
                        title: 'Use Current Location',
                        subtitle:
                            'Detect your location automatically using GPS',
                        onTap: () => _handleLocationSelection(
                          'current',
                          locationProvider,
                        ),
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(height: 16),

                      _buildOptionCard(
                        icon: Icons.search,
                        title: 'Add New Address',
                        subtitle: 'Search for and select a specific address',
                        onTap: () =>
                            _handleLocationSelection('new', locationProvider),
                        color: theme.colorScheme.secondary,
                      ),
                      const SizedBox(height: 16),

                      if (locationProvider.recentLocations.isNotEmpty)
                        _buildOptionCard(
                          icon: Icons.history,
                          title: 'Choose from Saved',
                          subtitle:
                              'Select from your previously saved locations',
                          onTap: () => _handleLocationSelection(
                            'saved',
                            locationProvider,
                          ),
                          color: theme.colorScheme.tertiary,
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Footer
                AnimatedBuilder(
                  animation: _fadeAnimation,
                  builder: (context, child) {
                    return Opacity(opacity: _fadeAnimation.value, child: child);
                  },
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 16,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Your location helps us show nearby services and workers',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOptionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required Color color,
  }) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withAlpha((0.2 * 255).round()),
          ),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.shadow.withAlpha((0.1 * 255).round()),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withAlpha((0.1 * 255).round()),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withAlpha((0.3 * 255).round())),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ],
        ),
      ),
    );
  }
}
