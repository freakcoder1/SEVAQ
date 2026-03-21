import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/service.dart';
import 'schedule_pricing_screen.dart';

class AssignmentFailedScreen extends StatelessWidget {
  final String serviceRequestId;
  final String? failureReason;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const AssignmentFailedScreen({
    Key? key,
    required this.serviceRequestId,
    this.failureReason,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.error,
                      color: Colors.orange,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Assignment not available',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          failureReason ??
                              'We couldn\'t find a professional for your selected time.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // What happens next
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What would you like to do?',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Change time option
                    _buildOption(
                      context,
                      icon: Icons.calendar_today,
                      title: 'Try different time',
                      subtitle: 'Choose another date or time window',
                      onTap: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                SchedulePricingScreen(service: service),
                          ),
                        );
                      },
                    ),

                    // Join waitlist
                    _buildOption(
                      context,
                      icon: Icons.watch_later,
                      title: 'Join waitlist',
                      subtitle: 'Get notified if a slot becomes available',
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Added to waitlist'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Support
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
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
                      child: OutlinedButton(
                        onPressed: () {
                          // Show support options
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Contacting support...'),
                              backgroundColor: Colors.green,
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.black12),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Need help? Contact support'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.black12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.black54, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward, color: Colors.black54, size: 20),
          ],
        ),
      ),
    );
  }
}
