import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/user.dart';
import '../models/location.dart';
import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import '../services/api_service.dart';
import 'schedule_pricing_screen.dart';
import 'service_clarification_screen.dart';

/// Availability Adjustment Screen
/// Handles worker unavailability gracefully as a normal business state
/// Purpose: Present alternative options when no workers are available at requested time
class AvailabilityAdjustmentScreen extends StatefulWidget {
  final Service? service;
  final DateTime requestedStartTime;
  final DateTime requestedEndTime;
  final double amount;
  final String errorMessage;
  final String errorCode;

  const AvailabilityAdjustmentScreen({
    Key? key,
    required this.service,
    required this.requestedStartTime,
    required this.requestedEndTime,
    required this.amount,
    required this.errorMessage,
    required this.errorCode,
  }) : super(key: key);

  @override
  State<AvailabilityAdjustmentScreen> createState() =>
      _AvailabilityAdjustmentScreenState();
}

class _AvailabilityAdjustmentScreenState
    extends State<AvailabilityAdjustmentScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  bool _isLoading = false;
  List<AlternativeSlot> _alternativeSlots = [];
  AlternativeSlot? _selectedAlternative;
  bool _showAlternatives = false;
  bool _showWaitlist = false;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _authProvider = Provider.of<AuthProvider>(context, listen: false);
    _fetchAlternativeSlots();
  }

  Future<void> _fetchAlternativeSlots() async {
    setState(() => _isLoading = true);

    try {
      // Get alternative time slots from backend
      final response = await _apiService.get(
        'slots/alternatives?serviceId=${widget.service?.id ?? ''}'
        '&startTime=${widget.requestedStartTime.toIso8601String()}'
        '&endTime=${widget.requestedEndTime.toIso8601String()}',
      );

      if (response != null && response['alternatives'] != null) {
        setState(() {
          _alternativeSlots = (response['alternatives'] as List)
              .map((slot) => AlternativeSlot.fromJson(slot))
              .toList();
          _showAlternatives = _alternativeSlots.isNotEmpty;
        });
      }
    } catch (e) {
      // If alternatives fetch fails, still show the screen with waitlist option
      setState(() {
        _showAlternatives = false;
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _selectAlternativeSlot(AlternativeSlot slot) {
    setState(() {
      _selectedAlternative = slot;
    });
  }

  void _proceedWithAlternative() {
    if (_selectedAlternative != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => SchedulePricingScreen(
            worker: widget.service != null
                ? _getWorkerForService(widget.service!)
                : _getDefaultWorker(),
            service: widget.service,
          ),
        ),
      );
    }
  }

  Worker _getWorkerForService(Service service) {
    // For now, return a default worker. In a real implementation, this would
    // fetch available workers for the service from the backend
    return Worker(
      id: 1,
      publicId: 'default-worker-${service.id}',
      user: User(
        id: 1,
        publicId: 'default-user-${service.id}',
        firstName: 'Available',
        lastName: 'Professional',
        email: 'professional@example.com',
        role: 'worker',
      ),
      bio: 'Verified professional available for ${service.name}',
      rating: 4.5,
      reviewCount: 50,
      services: [service],
    );
  }

  Worker _getDefaultWorker() {
    return Worker(
      id: 1,
      publicId: 'default-worker',
      user: User(
        id: 1,
        publicId: 'default-user',
        firstName: 'Available',
        lastName: 'Professional',
        email: 'professional@example.com',
        role: 'worker',
      ),
      bio: 'Verified professional available for your service',
      rating: 4.5,
      reviewCount: 50,
      services: [],
    );
  }

  void _addToWaitlist() async {
    setState(() => _isLoading = true);

    try {
      final user = _authProvider.user;
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Add user to waitlist for this service and time
      await _apiService.post('locations/waitlist', {
        'userId': user.id,
        'serviceId': widget.service?.id ?? '',
        'lat': 28.5805083, // Default location for testing
        'lng': 77.4392111,
        'requestedTime': widget.requestedStartTime.toIso8601String(),
        'estimatedWaitTime': 30, // 30 minutes estimated wait
      });

      setState(() => _showWaitlist = true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add to waitlist: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _tryDifferentService() {
    final userId = _authProvider.user?.id;
    final locationProvider = Provider.of<LocationProvider>(
      context,
      listen: false,
    );
    final initialLocation = locationProvider.currentLocationData;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ServiceClarificationScreen(
          userId: userId,
          initialLocation: initialLocation,
        ),
      ),
    );
  }

  void _goBackToHome() {
    Navigator.popUntil(context, ModalRoute.withName('/home'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: _goBackToHome,
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(),

              const SizedBox(height: 24),

              // Service Summary
              ServiceSummaryCard(
                service: widget.service,
                startTime: widget.requestedStartTime,
                endTime: widget.requestedEndTime,
                amount: widget.amount,
              ),

              const SizedBox(height: 24),

              // Error Message
              _buildErrorMessage(),

              const SizedBox(height: 24),

              // Loading State
              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else
                Column(
                  children: [
                    // Alternative Options
                    if (_showAlternatives) _buildAlternativeOptions(),

                    const SizedBox(height: 24),

                    // Waitlist Option
                    _buildWaitlistOption(),

                    const SizedBox(height: 24),

                    // Other Actions
                    _buildOtherActions(),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'We\'re sorry!',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'No professionals are available at your requested time.',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildErrorMessage() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFA000)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: const Color(0xFFFFA000), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              widget.errorMessage,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlternativeOptions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Alternative Time Slots',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _alternativeSlots.length,
          itemBuilder: (context, index) {
            final slot = _alternativeSlots[index];
            return AlternativeSlotCard(
              slot: slot,
              isSelected: _selectedAlternative == slot,
              onSelect: _selectAlternativeSlot,
            );
          },
        ),
        if (_selectedAlternative != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2E7D32)),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.check_circle,
                  color: const Color(0xFF2E7D32),
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Selected: ${DateFormat('EEEE, d MMM').format(_selectedAlternative!.startTime)} • ${_selectedAlternative!.timeSlot}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF2E7D32),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _proceedWithAlternative,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Proceed with ${_selectedAlternative!.amount.toStringAsFixed(0)}',
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildWaitlistOption() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Join Waitlist',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    color: const Color(0xFF2E7D32),
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Get notified when professionals become available',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.black87,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'We\'ll notify you via SMS and app notification when a professional becomes available for your requested time slot.',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
              ),
              const SizedBox(height: 16),
              if (!_showWaitlist)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _addToWaitlist,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF2E7D32)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Add me to waitlist'),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: const Color(0xFF2E7D32),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'You\'ve been added to the waitlist',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF2E7D32),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOtherActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Other Options',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        Column(
          children: [
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _tryDifferentService,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.black38),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Try a different service'),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _goBackToHome,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.black38),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Go back to home'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Alternative Slot Model
class AlternativeSlot {
  final DateTime startTime;
  final DateTime endTime;
  final String timeSlot;
  final double amount;
  final String availabilityStatus;

  AlternativeSlot({
    required this.startTime,
    required this.endTime,
    required this.timeSlot,
    required this.amount,
    required this.availabilityStatus,
  });

  factory AlternativeSlot.fromJson(Map<String, dynamic> json) {
    return AlternativeSlot(
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      timeSlot: json['timeSlot'],
      amount: (json['amount'] ?? 0.0).toDouble(),
      availabilityStatus: json['availabilityStatus'] ?? 'available',
    );
  }
}

/// Alternative Slot Card Widget
class AlternativeSlotCard extends StatelessWidget {
  final AlternativeSlot slot;
  final bool isSelected;
  final Function(AlternativeSlot) onSelect;

  const AlternativeSlotCard({
    Key? key,
    required this.slot,
    required this.isSelected,
    required this.onSelect,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(
          color: isSelected ? const Color(0xFF2E7D32) : Colors.black12,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => onSelect(slot),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFFE8F5E9)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.access_time,
                  color: isSelected ? const Color(0xFF2E7D32) : Colors.black54,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      DateFormat('EEEE, d MMM').format(slot.startTime),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      slot.timeSlot,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${slot.amount.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Available',
                      style: TextStyle(
                        fontSize: 12,
                        color: const Color(0xFF2E7D32),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              if (isSelected)
                Icon(
                  Icons.check_circle,
                  color: const Color(0xFF2E7D32),
                  size: 24,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Service Summary Card Widget (reused from AssignmentInProgressScreen)
class ServiceSummaryCard extends StatelessWidget {
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const ServiceSummaryCard({
    Key? key,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(color: Colors.black12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.cleaning_services,
                color: const Color(0xFF2E7D32),
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service?.name ?? 'Home Cleaning',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${DateFormat('EEE, d MMM').format(startTime)} • ${_getTimeWindowText()}',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹${amount.toStringAsFixed(0)} per visit',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2E7D32),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getTimeWindowText() {
    final startHour = startTime.hour;
    final endHour = endTime.hour;

    if (startHour >= 8 && endHour <= 12) {
      return 'Morning (08:00–12:00)';
    } else if (startHour >= 12 && endHour <= 17) {
      return 'Afternoon (12:00–17:00)';
    } else {
      return 'Evening (17:00–21:00)';
    }
  }
}
