import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_house_help/models/service_option.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/location.dart';
import 'package:flutter_house_help/providers/auth_provider.dart';
import 'package:flutter_house_help/providers/location_provider.dart';
import 'package:flutter_house_help/screens/schedule_pricing_screen.dart';
import 'package:flutter_house_help/screens/subscription_profiles_screen.dart';

/// Service Engagement Type Screen
/// Purpose: Explicitly separate monthly subscription vs one-time service selection
/// as per SEVAQ compliance requirements
class ServiceEngagementTypeScreen extends StatefulWidget {
  final ServiceOption selectedServiceOption;
  final dynamic userId; // Accept both int and String (UUID)
  final Location? initialLocation; // Pass location from parent

  const ServiceEngagementTypeScreen({
    Key? key,
    required this.selectedServiceOption,
    required this.userId,
    this.initialLocation,
  }) : super(key: key);

  @override
  State<ServiceEngagementTypeScreen> createState() =>
      _ServiceEngagementTypeScreenState();
}

class _ServiceEngagementTypeScreenState
    extends State<ServiceEngagementTypeScreen> {
  EngagementType _selectedEngagementType = EngagementType.monthly;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: theme.colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1️⃣ HEADER
              _buildHeader(theme),

              const SizedBox(height: 28),

              // 2️⃣ ENGAGEMENT TYPE OPTIONS
              _buildEngagementTypeOptions(theme),

              const SizedBox(height: 24),

              // 3️⃣ PRIMARY CTA
              _buildPrimaryCTA(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'How would you like to use this service?',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose what fits your household needs. You can change this later.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildEngagementTypeOptions(ThemeData theme) {
    return Column(
      children: [
        // Monthly Service Option (Primary)
        _buildEngagementTypeCard(
          theme,
          title: 'Monthly service',
          subtitle: 'Dedicated, recurring household assistance',
          metaText: 'Most chosen • Better value • Priority assignment',
          description:
              'A verified SEVAQ professional is assigned for regular visits based on a fixed service profile. We handle replacements, monitoring, and continuity.',
          isSelected: _selectedEngagementType == EngagementType.monthly,
          isPrimary: true,
          onTap: () {
            if (_selectedEngagementType != EngagementType.monthly) {
              setState(() {
                _selectedEngagementType = EngagementType.monthly;
              });
            } else {
              // If already selected, proceed to monthly plans
              _handleContinue();
            }
          },
        ),

        const SizedBox(height: 16),

        // One-time Service Option (Secondary)
        _buildEngagementTypeCard(
          theme,
          title: 'One-time visit',
          subtitle: 'Single visit for immediate needs',
          description:
              'A one-time professional visit. Best for short-term or urgent help.',
          ctaText: 'Use as a one-time visit →',
          isSelected: _selectedEngagementType == EngagementType.oneTime,
          isPrimary: false,
          onTap: () {
            if (_selectedEngagementType != EngagementType.oneTime) {
              setState(() {
                _selectedEngagementType = EngagementType.oneTime;
              });
            } else {
              // If already selected, proceed to one-time scheduling
              _handleContinue();
            }
          },
        ),
      ],
    );
  }

  Widget _buildEngagementTypeCard(
    ThemeData theme, {
    required String title,
    required String subtitle,
    String? metaText,
    required String description,
    String? ctaText,
    required bool isSelected,
    required bool isPrimary,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected
              ? theme.colorScheme.primary.withOpacity(0.7)
              : (isPrimary
                    ? theme.colorScheme.surfaceVariant
                    : theme.colorScheme.surfaceVariant),
          width: isSelected ? 2 : 1,
        ),
        color: isSelected
            ? theme.colorScheme.primaryContainer
            : theme.colorScheme.surface,
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ]
            : [],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isSelected
                                ? theme.colorScheme.primary
                                : theme.colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          subtitle,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        if (metaText != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            metaText,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (isSelected)
                    Icon(
                      Icons.check_circle,
                      color: theme.colorScheme.primary,
                      size: 24,
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                description,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
              if (ctaText != null) ...[
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    ctaText,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
              if (isPrimary) ...[
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: Icon(
                    Icons.chevron_right,
                    color: theme.colorScheme.primary,
                    size: 20,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPrimaryCTA(ThemeData theme) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _handleContinue,
        style: ElevatedButton.styleFrom(
          backgroundColor: theme.colorScheme.primary,
          foregroundColor: theme.colorScheme.onPrimary,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        child: Text(
          _selectedEngagementType == EngagementType.monthly
              ? 'Continue with monthly service'
              : 'Use for a one-time visit',
        ),
      ),
    );
  }

  void _handleContinue() {
    debugPrint(
      'DEBUG: _handleContinue called - checking provider availability',
    );

    // DIAGNOSTIC: Check if AuthProvider is available in current context
    try {
      final authProvider = context.read<AuthProvider>();
      debugPrint(
        'DEBUG: AuthProvider found in context: ${authProvider != null}',
      );
    } catch (e) {
      debugPrint('DEBUG: AuthProvider NOT found in context - error: $e');
    }

    // DIAGNOSTIC: Check if LocationProvider is available in current context
    try {
      final locationProvider = context.read<LocationProvider>();
      debugPrint(
        'DEBUG: LocationProvider found in context: ${locationProvider != null}',
      );
    } catch (e) {
      debugPrint('DEBUG: LocationProvider NOT found in context - error: $e');
    }

    // Get LocationProvider before navigation - capture it before pushing new route
    LocationProvider? existingLocationProvider;
    try {
      existingLocationProvider = context.read<LocationProvider>();
    } catch (e) {
      debugPrint('Could not read LocationProvider: $e');
    }

    // Use initialLocation from widget constructor (passed from parent) as primary source
    // This is more reliable than accessing provider in a pushed route context
    Location? currentLocation = widget.initialLocation;

    // If initialLocation is null, try to get from provider as fallback
    if (currentLocation == null && existingLocationProvider != null) {
      currentLocation = existingLocationProvider.currentLocationData;
    }

    if (_selectedEngagementType == EngagementType.monthly) {
      debugPrint(
        'DEBUG: Navigating to SubscriptionProfilesScreen with userId: ${widget.userId}',
      );
      // Navigate to subscription profiles screen with location
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SubscriptionProfilesScreen(
            serviceType: widget.selectedServiceOption.id.toLowerCase(),
            serviceName: widget.selectedServiceOption.name,
            userId: widget.userId,
            initialLocation: currentLocation,
          ),
        ),
      );
    } else {
      debugPrint(
        'DEBUG: Navigating to SchedulePricingScreen for one-time visit',
      );
      // Navigate to one-time scheduling screen
      // FIXED: Use widget.userId directly instead of reading from AuthProvider
      // The userId is already passed to this screen via constructor
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => MultiProvider(
            providers: [
              // Use ChangeNotifierProvider for LocationProvider since it's a ChangeNotifier
              // Pass the existing provider or create a new one if not available
              ChangeNotifierProvider<LocationProvider>.value(
                value: existingLocationProvider ?? LocationProvider(),
              ),
            ],
            child: SchedulePricingScreen(
              worker: null,
              service: _convertServiceOptionToService(
                widget.selectedServiceOption,
              ),
              source: 'ONE_TIME', // Explicit source for one-time visits
            ),
          ),
        ),
      );
    }
  }

  // Helper method to safely get LocationProvider
  LocationProvider _getLocationProvider() {
    try {
      return context.read<LocationProvider>();
    } catch (e) {
      debugPrint('ERROR: Could not read LocationProvider: $e');
      // Return a default instance or handle the error appropriately
      return LocationProvider();
    }
  }

  Service? _convertServiceOptionToService(ServiceOption serviceOption) {
    return Service(
      id: 0,
      publicId: '',
      name: serviceOption.name,
      description: serviceOption.description,
      basePrice: serviceOption.basePrice,
      category: 'household',
    );
  }
}

enum EngagementType { monthly, oneTime }
