import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../models/worker.dart';
import '../models/service.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'assignment_confirmed_screen.dart';
import 'assignment_delayed_screen.dart';
import 'professional_assigned_screen.dart';
import 'service_clarification_screen.dart';

/// Assignment In Progress Screen
/// Trust buffer between scheduling and payment
/// Purpose: Reduce anxiety, explain what is happening, buy backend time
class AssignmentInProgressScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const AssignmentInProgressScreen({
    Key? key,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  State<AssignmentInProgressScreen> createState() =>
      _AssignmentInProgressScreenState();
}

class _AssignmentInProgressScreenState
    extends State<AssignmentInProgressScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  bool _isAssigned = false;
  bool _hasError = false;
  bool _showTimeoutMessage = false;
  Timer? _timeoutTimer;
  static const int ASSIGNMENT_TIMEOUT_MINUTES = 3; // 3 minutes timeout

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _authProvider = Provider.of<AuthProvider>(context, listen: false);

    // Start timeout timer
    _startTimeoutTimer();

    // Check assignment status once after a short delay
    Future.delayed(const Duration(seconds: 3), () {
      _checkAssignmentStatus();
    });
  }

  void _startTimeoutTimer() {
    _timeoutTimer = Timer(Duration(minutes: ASSIGNMENT_TIMEOUT_MINUTES), () {
      if (mounted) {
        setState(() {
          _showTimeoutMessage = true;
        });
      }
    });
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkAssignmentStatus() async {
    if (_isAssigned || _hasError) return;

    try {
      final user = _authProvider.user;
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Check assignment status
      final response = await _apiService.get('assignments/status/latest');

      if (response != null) {
        // Handle both field names for backward compatibility
        final status = response['status'] ?? response['assignmentState'];

        if (status == 'assigned') {
          // Assignment successful
          setState(() {
            _isAssigned = true;
          });

          // Navigate to professional assigned screen
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => ProfessionalAssignedScreen(
                    worker: widget.worker,
                    service: widget.service,
                    startTime: widget.startTime,
                    endTime: widget.endTime,
                    amount: widget.amount,
                  ),
                ),
              );
            }
          });
        } else {
          // Still in progress - assignment will be handled by backend
          // User can wait or check back later
        }
      } else {
        // Still in progress - assignment will be handled by backend
        // User can wait or check back later
      }
    } catch (e) {
      setState(() {
        _hasError = true;
      });
    }
  }

  void _viewRequestDetails() {
    // Navigate to request details screen
    // For now, show a snackbar as placeholder
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Request details would be shown here'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _showSupportOptions() {
    // Show support options (chat or call)
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
              // A. Header (Status-first)
              _buildHeader(context),

              const SizedBox(height: 24),

              // B. Status Indicator
              _buildStatusIndicator(context),

              const SizedBox(height: 24),

              // C. Service Summary Card
              ServiceSummaryCard(
                service: widget.service,
                startTime: widget.startTime,
                endTime: widget.endTime,
                amount: widget.amount,
              ),

              const SizedBox(height: 24),

              // D. What Happens Next
              WhatHappensNextSection(),

              const SizedBox(height: 24),

              // E. Support Entry (Always Visible)
              SupportSection(onHelpPressed: _showSupportOptions),

              const SizedBox(height: 24),

              // F. Primary CTA
              PrimaryCTA(onDetailsPressed: _viewRequestDetails),

              const SizedBox(height: 24),

              // Timeout message if applicable
              if (_showTimeoutMessage && !_isAssigned)
                TimeoutMessage(
                  onRetry: () {
                    setState(() {
                      _showTimeoutMessage = false;
                    });
                    _checkAssignmentStatus();
                  },
                  onManualSelection: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ServiceClarificationScreen(),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Finding a professional',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'We’re assigning a verified professional for your scheduled service.',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildStatusIndicator(BuildContext context) {
    if (_isAssigned) {
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
          'This usually takes a few minutes.',
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }
}

/// Service Summary Card Widget
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

/// What Happens Next Section Widget
class WhatHappensNextSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
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
}

/// Support Section Widget
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

/// Primary CTA Widget
class PrimaryCTA extends StatelessWidget {
  final VoidCallback onDetailsPressed;

  const PrimaryCTA({Key? key, required this.onDetailsPressed})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: ElevatedButton(
        onPressed: onDetailsPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF2E7D32),
          side: const BorderSide(color: Color(0xFF2E7D32)),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text('View request details'),
      ),
    );
  }
}

/// Timeout Message Widget
class TimeoutMessage extends StatelessWidget {
  final VoidCallback onRetry;
  final VoidCallback onManualSelection;

  const TimeoutMessage({
    Key? key,
    required this.onRetry,
    required this.onManualSelection,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFA000)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.access_time, color: const Color(0xFFFFA000), size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Assignment taking longer than expected',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'We\'re still working on finding the perfect professional for you. This usually takes a few more minutes.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              OutlinedButton(
                onPressed: onRetry,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF2E7D32)),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                ),
                child: const Text(
                  'Try Again',
                  style: TextStyle(color: Color(0xFF2E7D32)),
                ),
              ),
              ElevatedButton(
                onPressed: onManualSelection,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                ),
                child: const Text('Browse Professionals'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Delay Message Widget
class DelayMessage extends StatelessWidget {
  final String message;

  const DelayMessage({Key? key, required this.message}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFA000)),
      ),
      child: Row(
        children: [
          Icon(Icons.access_time, color: const Color(0xFFFFA000), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }
}
