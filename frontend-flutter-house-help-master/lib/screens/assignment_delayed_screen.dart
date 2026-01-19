import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/worker.dart';
import '../models/service.dart';

/// Assignment Delayed Screen
/// Calm state when assignment takes longer than expected
class AssignmentDelayedScreen extends StatelessWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const AssignmentDelayedScreen({
    Key? key,
    required this.worker,
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
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Calm state icon
              const SizedBox(
                width: 80,
                height: 80,
                child: Icon(Icons.timer, color: Color(0xFFFF9800), size: 64),
              ),

              const SizedBox(height: 32),

              // Calm message
              Text(
                'We\'re still matching the best professional',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 8),

              Text(
                'You\'ll be notified shortly',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 40),

              // Reassurance text
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'We\'re carefully selecting the most suitable professional for your requirements. This ensures the best service quality.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.black54,
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 40),

              // Options
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          // Notify me later
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text(
                                'You\'ll be notified when a professional is found',
                              ),
                              backgroundColor: const Color(0xFF2E7D32),
                            ),
                          );
                          Navigator.pop(context);
                        },
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
                        child: const Text('Notify me'),
                      ),
                    ),

                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          // Change time
                          Navigator.pop(context); // Go back to schedule screen
                          // TODO: Implement time change functionality
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF2E7D32),
                          side: const BorderSide(color: Color(0xFF2E7D32)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        child: const Text('Change time'),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Support contact
              Text(
                'Need immediate assistance? Contact support',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
