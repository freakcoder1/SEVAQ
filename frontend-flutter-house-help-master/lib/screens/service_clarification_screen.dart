import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/service_option.dart';
import '../models/worker.dart';
import '../models/user.dart';
import '../models/service.dart';
import '../providers/worker_provider.dart';
import '../services/api_service.dart';
import '../utils/service_mapper.dart';
import '../widgets/service_option_card.dart';
import '../widgets/contextual_followup.dart';
import '../widgets/reassurance_strip.dart';
import 'service_engagement_type_screen.dart';
import 'schedule_pricing_screen.dart';
import 'assignment_in_progress_screen.dart';
import 'availability_adjustment_screen.dart';

/// Service Clarification Screen
/// The most important screen in the product - bridges trust to execution
/// Purpose: Confirm what kind of help the user needs, clarify scope, transition to execution
class ServiceClarificationScreen extends StatefulWidget {
  const ServiceClarificationScreen({Key? key}) : super(key: key);

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
  WorkerProvider? _workerProvider;
  final ApiService _apiService = ApiService();
  // Worker selection removed - Sevaq assigns professionals automatically

  @override
  void initState() {
    super.initState();
    // Initialize worker provider
    _workerProvider = Provider.of<WorkerProvider>(context, listen: false);
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
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ServiceEngagementTypeScreen(
            selectedServiceOption: _selectedService!,
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
