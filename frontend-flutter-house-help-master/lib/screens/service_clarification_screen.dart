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
      id: backendServiceId, // Use the mapped backend service ID
      name: serviceOption.name,
      description: serviceOption.description,
      basePrice: 500.0, // Default base price
      category: 'household',
    );
  }

  /// Navigate to schedule and pricing screen
  void _navigateToSchedulePricing() {
    if (_selectedService != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => SchedulePricingScreen(
            worker: null, // Worker will be assigned after date/time selection
            service: _convertServiceOptionToService(_selectedService),
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
    return Scaffold(
      backgroundColor: Colors.white, // Same as Home screen for consistency
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
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
              _buildHeader(),

              const SizedBox(height: 28),

              // 2️⃣ PRIMARY QUESTION
              _buildPrimaryQuestion(),

              const SizedBox(height: 20),

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
                      color: Colors.black54,
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
          color: Colors.white,
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
                    ? _navigateToSchedulePricing
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: const Text('Continue'),
              ),
            ),

            const SizedBox(height: 8),

            // CTA subtext
            Text(
              'You can review details before confirming',
              style: TextStyle(fontSize: 12, color: Colors.black54),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  /// Build header section
  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Help us understand your requirement',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),

        const SizedBox(height: 8),

        Text(
          'This helps Sevaq assign the right professional and monitor the service end-to-end.',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: Colors.black54,
          ),
        ),
      ],
    );
  }

  /// Build primary question
  Widget _buildPrimaryQuestion() {
    return Text(
      'Which type of assistance would be most helpful for your home?',
      style: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w500,
        color: Colors.black87,
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
