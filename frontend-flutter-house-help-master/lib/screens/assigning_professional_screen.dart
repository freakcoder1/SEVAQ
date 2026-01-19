import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/worker.dart';
import '../models/service.dart';

/// Assigning Professional Screen
/// Shows full-screen loader while system assigns professional
class AssigningProfessionalScreen extends StatelessWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const AssigningProfessionalScreen({
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
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Loading animation
              const SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(
                  strokeWidth: 4,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E7D32)),
                ),
              ),

              const SizedBox(height: 32),

              // Primary message
              Text(
                'We’re assigning the right professional for your service',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 16),

              // Secondary reassurance
              Text(
                'This usually takes a few moments',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 40),

              // Micro-reinforcement
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Managed end-to-end by Sevaq',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.black54,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
