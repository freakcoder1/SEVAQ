import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/service_profile.dart';
import '../models/subscription.dart';

/// Subscription Confirmation Screen
/// Shows after successful subscription payment
/// Informs user about just-in-time professional assignment
class SubscriptionConfirmationScreen extends StatefulWidget {
  final ServiceProfile serviceProfile;
  final DateTime startDate;
  final String timeWindow;
  final dynamic userId; // Accept both int and String (UUID)
  final WorkerState workerState; // Worker assignment state

  const SubscriptionConfirmationScreen({
    Key? key,
    required this.serviceProfile,
    required this.startDate,
    required this.timeWindow,
    required this.userId,
    this.workerState = WorkerState.pending, // Default to pending
  }) : super(key: key);

  @override
  State<SubscriptionConfirmationScreen> createState() =>
      _SubscriptionConfirmationScreenState();
}

class _SubscriptionConfirmationScreenState
    extends State<SubscriptionConfirmationScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black87),
          onPressed: () => Navigator.pushNamedAndRemoveUntil(
            context,
            '/home',
            (route) => false,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 32),

              // Success icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: Color(0xFF2E7D32),
                  size: 48,
                ),
              ),

              const SizedBox(height: 24),

              // Success message
              Text(
                'Subscription confirmed!',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 12),

              Text(
                'Your daily service subscription is active.',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: Colors.black54,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 32),

              // Service summary
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Subscription Details',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildDetailRow(
                      Icons.calendar_today,
                      'Start Date',
                      DateFormat('EEEE, MMMM d, yyyy').format(widget.startDate),
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.access_time,
                      'Time Window',
                      widget.timeWindow,
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.work,
                      'Service',
                      '${widget.serviceProfile.serviceType} (${widget.serviceProfile.publicId})',
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.attach_money,
                      'Monthly Price',
                      '₹${widget.serviceProfile.monthlyPrice.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Professional assignment info - Key SEVAQ messaging
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[100]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.person_add,
                          color: Colors.blue[700],
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Professional Assignment',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: Colors.blue[900],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildAssignmentMessage(theme),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Trust note
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.verified_user,
                      color: Colors.green[700],
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Covered by SEVAQ Service Guarantee',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Done button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/home',
                    (route) => false,
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.primaryColor,
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
                  child: const Text('Done'),
                ),
              ),

              const SizedBox(height: 16),

              // What's next
              TextButton(
                onPressed: () {
                  // Could show a modal with more details
                },
                child: Text(
                  'What happens next?',
                  style: TextStyle(
                    color: theme.primaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAssignmentMessage(ThemeData theme) {
    switch (widget.workerState) {
      case WorkerState.availableDetected:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Professional available. Final assignment will be confirmed before service begins.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.blue[900],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.check, color: Colors.blue[700], size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'We\'ll confirm your professional assignment 24-48 hours before service',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.blue[800],
                    ),
                  ),
                ),
              ],
            ),
          ],
        );
      case WorkerState.assigned:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Professional assigned! Your service is ready to begin.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.green[900],
              ),
            ),
          ],
        );
      case WorkerState.pending:
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "We'll assign a verified professional 24-48 hours before your service begins.",
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.blue[900],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.check, color: Colors.blue[700], size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Same professional preferred daily (not guaranteed)',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.blue[800],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.check, color: Colors.blue[700], size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'SEVAQ handles all monitoring & replacement',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.blue[800],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.check, color: Colors.blue[700], size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'You\'ll be notified if a replacement is needed',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.blue[800],
                    ),
                  ),
                ),
              ],
            ),
          ],
        );
    }
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.black54, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
