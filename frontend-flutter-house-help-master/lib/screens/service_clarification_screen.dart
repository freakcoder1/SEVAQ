import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_house_help/models/service_option.dart';
import 'package:flutter_house_help/models/user.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/location.dart';
import 'package:flutter_house_help/providers/auth_provider.dart';
import 'package:flutter_house_help/providers/location_provider.dart';
import 'package:flutter_house_help/services/api_service.dart';
import 'package:flutter_house_help/utils/service_mapper.dart';
import 'package:flutter_house_help/widgets/service_option_card.dart';
import 'package:flutter_house_help/widgets/contextual_followup.dart';
import 'package:flutter_house_help/widgets/reassurance_strip.dart';
import 'package:flutter_house_help/screens/service_engagement_type_screen.dart';
import 'package:flutter_house_help/screens/schedule_pricing_screen.dart';
import 'package:flutter_house_help/screens/assignment_in_progress_screen.dart';
import 'package:flutter_house_help/screens/availability_adjustment_screen.dart';

/// Service Clarification Screen
/// The most important screen in the product - bridges trust to execution
/// Purpose: Confirm what kind of help the user needs, clarify scope, transition to execution
class ServiceClarificationScreen extends StatefulWidget {
  final dynamic userId; // Accept both int and String (UUID)
  final Location? initialLocation; // Pass location from parent

  const ServiceClarificationScreen({
    Key? key,
    required this.userId,
    this.initialLocation,
  }) : super(key: key);

  @override
  State<ServiceClarificationScreen> createState() {
    print('🔍 DEBUG: ServiceClarificationScreen createState called');
    return _ServiceClarificationScreenState();
  }
}

class _ServiceClarificationScreenState
    extends State<ServiceClarificationScreen> {
  ServiceOption? _selectedService;
  String? _followupResponse;
  final ApiService _apiService = ApiService();
  // Worker selection removed - Sevaq assigns professionals automatically

  @override
  void initState() {
    super.initState();
    // No worker provider needed - Sevaq assigns automatically
  }

  /// Handle service selection
  void _handleServiceSelection(ServiceOption service) {
    setState(() {
      _selectedService = service;
      _followupResponse = null; // Reset follow-up when changing service
    });
  }

  /// Handle follow-up response
  void _handleFollowupResponse(String? response) {
    setState(() {
      _followupResponse = response;
    });
  }

  /// Convert ServiceOption to Service
  Service? _convertServiceOptionToService(ServiceOption? serviceOption) {
    if (serviceOption == null) return null;

    // Use ServiceMapper to get the representative backend service ID
    final backendServiceId = ServiceMapper.getRepresentativeBackendId(
      serviceOption.id,
    );

    return Service(
      id: backendServiceId,
      publicId: '', // Empty string as placeholder for publicId
      name: serviceOption.name,
      description: serviceOption.description,
      basePrice:
          serviceOption.basePrice, // Use actual base price from service option
      category: 'household',
    );
  }

  /// Navigate to service engagement type selection screen
  void _navigateToEngagementTypeSelection() {
    if (_selectedService != null) {
      // Use userId and initialLocation from widget constructor (passed from parent)
      final userId = widget.userId;
      final currentLocation = widget.initialLocation;

      if (userId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('User not logged in'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // FIXED: Get providers BEFORE navigation to avoid context issues
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => MultiProvider(
            providers: [
              // Use ChangeNotifierProvider.value for ChangeNotifier-based providers
              ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
              ChangeNotifierProvider<LocationProvider>.value(
                value: locationProvider,
              ),
            ],
            child: ServiceEngagementTypeScreen(
              selectedServiceOption: _selectedService!,
              userId: userId,
              initialLocation: currentLocation,
            ),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint(
      'ServiceClarificationScreen: build called, screen size: ${MediaQuery.of(context).size}',
    );
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
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1️⃣ HEADER
              _buildHeader(theme),

              const SizedBox(height: 28),

              // 2️⃣ PRIMARY QUESTION
              _buildPrimaryQuestion(theme),

              const SizedBox(height: 16),

              // Helper text
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  'Select one to continue',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // 3️⃣ SERVICE OPTIONS
              _buildServiceOptions(),

              // 4️⃣ CONTEXTUAL FOLLOW-UP - REMOVED
              // Moved to next screen to focus this screen on service type selection only

              // 5️⃣ REASSURANCE STRIP
              const ReassuranceStrip(),

              const SizedBox(height: 24),

              // Conditional CTA microtext when disabled
              if (_selectedService == null)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 8,
                  ),
                  child: Text(
                    'Select a service to continue',
                    style: TextStyle(
                      fontSize: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
        ),
      ),

      // 7️⃣ SINGLE CTA (Sticky at bottom)
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedService != null
                    ? _navigateToEngagementTypeSelection
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                  textStyle: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onPrimary,
                  ),
                ),
                child: const Text('Continue'),
              ),
            ),

            const SizedBox(height: 8),

            // CTA subtext
            Text(
              'You can review details before confirming',
              style: TextStyle(
                fontSize: 12,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  /// Build header section
  Widget _buildHeader(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Help us understand your requirement',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),

        const SizedBox(height: 8),

        Text(
          'This helps Sevaq assign the right professional and monitor the service end-to-end.',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  /// Build primary question
  Widget _buildPrimaryQuestion(ThemeData theme) {
    return Text(
      'Which type of assistance would be most helpful for your home?',
      style: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w500,
        color: theme.colorScheme.onSurface,
      ),
    );
  }

  /// Build service options list
  Widget _buildServiceOptions() {
    return Column(
      children: ServiceOption.options.map((service) {
        return ServiceOptionCard(
          service: service,
          isSelected: _selectedService?.id == service.id,
          onTap: () => _handleServiceSelection(service),
        );
      }).toList(),
    );
  }

  // Worker selection removed - Sevaq assigns professionals automatically
}
