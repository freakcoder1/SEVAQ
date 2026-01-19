import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'package:intl/intl.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import 'professional_assigned_screen.dart';
import 'assignment_failed_screen.dart';

class ServiceRequestInProgressScreen extends StatefulWidget {
  final String serviceRequestId;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const ServiceRequestInProgressScreen({
    Key? key,
    required this.serviceRequestId,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  State<ServiceRequestInProgressScreen> createState() =>
      _ServiceRequestInProgressScreenState();
}

class _ServiceRequestInProgressScreenState
    extends State<ServiceRequestInProgressScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  late Timer _pollingTimer;

  AssignmentStatus _status = AssignmentStatus.requested;
  Worker? _assignedWorker;
  String? _failureReason;

  static const int MAX_POLLING_DURATION = 180; // 3 minutes
  static const int POLLING_INTERVAL = 3; // 3 seconds
  int _elapsedTime = 0;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _authProvider = Provider.of<AuthProvider>(context, listen: false);

    // Start polling immediately
    _startPolling();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: POLLING_INTERVAL), (
      timer,
    ) {
      _elapsedTime += POLLING_INTERVAL;
      _checkAssignmentStatus();
    });
  }

  Future<void> _checkAssignmentStatus() async {
    if (_status != AssignmentStatus.requested) return;

    try {
      final response = await _apiService.get(
        'service-requests/${widget.serviceRequestId}',
      );

      if (response != null) {
        final status = response['assignmentStatus'];

        switch (status) {
          case 'ASSIGNED':
            _handleAssignmentSuccess(response);
            break;
          case 'FAILED_TO_ASSIGN':
            _handleAssignmentFailure(response);
            break;
          case 'REQUESTED':
            // Continue polling
            if (_elapsedTime >= MAX_POLLING_DURATION) {
              _handleTimeout();
            }
            break;
        }
      }
    } catch (e) {
      // Handle network errors gracefully
      print('Polling error: $e');
    }
  }

  void _handleAssignmentSuccess(Map<String, dynamic> response) {
    _pollingTimer.cancel();

    setState(() {
      _status = AssignmentStatus.assigned;
      _assignedWorker = Worker.fromJson(response['assignedWorker']);
    });

    // Navigate to professional assigned screen
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ProfessionalAssignedScreen(
              worker: _assignedWorker!,
              service: widget.service,
              startTime: widget.startTime,
              endTime: widget.endTime,
              amount: widget.amount,
            ),
          ),
        );
      }
    });
  }

  void _handleAssignmentFailure(Map<String, dynamic> response) {
    _pollingTimer.cancel();

    setState(() {
      _status = AssignmentStatus.failed;
      _failureReason = response['failureReason'];
    });

    // Navigate to failure screen
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => AssignmentFailedScreen(
              serviceRequestId: widget.serviceRequestId,
              failureReason: _failureReason,
              service: widget.service,
              startTime: widget.startTime,
              endTime: widget.endTime,
              amount: widget.amount,
            ),
          ),
        );
      }
    });
  }

  void _handleTimeout() {
    _pollingTimer.cancel();

    setState(() {
      _status = AssignmentStatus.failed;
      _failureReason = 'TIMEOUT';
    });

    // Navigate to failure screen with timeout reason
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => AssignmentFailedScreen(
              serviceRequestId: widget.serviceRequestId,
              failureReason: 'Assignment taking longer than expected',
              service: widget.service,
              startTime: widget.startTime,
              endTime: widget.endTime,
              amount: widget.amount,
            ),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(),

              const SizedBox(height: 24),

              // Status Indicator
              _buildStatusIndicator(),

              const SizedBox(height: 24),

              // Service Summary
              ServiceSummaryCard(
                service: widget.service,
                startTime: widget.startTime,
                endTime: widget.endTime,
                amount: widget.amount,
              ),

              const SizedBox(height: 24),

              // Progress Details
              _buildProgressDetails(),

              const SizedBox(height: 24),

              // Support Section
              SupportSection(onHelpPressed: _showSupportOptions),
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
          _status == AssignmentStatus.assigned
              ? 'Professional found!'
              : _status == AssignmentStatus.failed
              ? 'Assignment failed'
              : 'Finding a professional',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _status == AssignmentStatus.assigned
              ? 'We found the perfect professional for you.'
              : _status == AssignmentStatus.failed
              ? 'We couldn\'t find a professional for your selected time.'
              : 'We’re matching you with the best available professional.',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildStatusIndicator() {
    if (_status == AssignmentStatus.assigned) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF2E7D32)),
        ),
        child: Row(
          children: [
            Icon(Icons.check_circle, color: const Color(0xFF2E7D32), size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Professional assigned!',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF2E7D32),
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_status == AssignmentStatus.failed) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3E0),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange),
        ),
        child: Row(
          children: [
            Icon(Icons.error, color: Colors.orange, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Assignment failed',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress bar
        LinearProgressIndicator(
          backgroundColor: Colors.grey[200],
          color: const Color(0xFF2E7D32),
          minHeight: 8,
        ),
        const SizedBox(height: 8),
        Text(
          'Assignment in progress',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'This usually takes a few minutes. We\'re working on finding the best professional for you.',
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildProgressDetails() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What happens next',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          _buildNextStep(
            context,
            icon: Icons.person,
            text: 'We assign a verified professional',
          ),
          const SizedBox(height: 8),
          _buildNextStep(
            context,
            icon: Icons.notifications,
            text: 'You’ll be notified once assigned',
          ),
          const SizedBox(height: 8),
          _buildNextStep(
            context,
            icon: Icons.payment,
            text: 'Payment will be requested after assignment',
          ),
        ],
      ),
    );
  }

  Widget _buildNextStep(
    BuildContext context, {
    required IconData icon,
    required String text,
  }) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF2E7D32), size: 18),
        const SizedBox(width: 10),
        Text(
          text,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.black87),
        ),
      ],
    );
  }

  void _showSupportOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Need help?',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              'Choose how you\'d like to get assistance:',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.chat_bubble, color: Colors.green),
              title: Text('Chat with support'),
              subtitle: Text('Get help in real-time'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Chat support would open here'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.call, color: Colors.green),
              title: Text('Call support'),
              subtitle: Text('Speak with our team'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Call support would open here'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black87,
                side: const BorderSide(color: Colors.black12),
                padding: const EdgeInsets.symmetric(
                  horizontal: 40,
                  vertical: 12,
                ),
              ),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}

enum AssignmentStatus { requested, assigned, failed }

// Reuse existing widgets from AssignmentInProgressScreen
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
            offset: Offset(0, 2),
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

class SupportSection extends StatelessWidget {
  final VoidCallback onHelpPressed;

  const SupportSection({Key? key, required this.onHelpPressed})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.black12),
          bottom: BorderSide(color: Colors.black12),
        ),
        color: Colors.white,
      ),
      child: Row(
        children: [
          const Icon(Icons.help_outline, color: Colors.black54),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Need help?',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward, color: Colors.black54),
            onPressed: onHelpPressed,
          ),
        ],
      ),
    );
  }
}
