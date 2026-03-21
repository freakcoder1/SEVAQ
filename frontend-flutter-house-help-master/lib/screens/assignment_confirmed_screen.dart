import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../services/api_service.dart';
import 'booking_confirmation_screen.dart';

/// Assignment Confirmed Screen
/// Shows professional details and payment prompt
class AssignmentConfirmedScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;
  final Map<String, dynamic> assignmentData;

  const AssignmentConfirmedScreen({
    Key? key,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
    required this.assignmentData,
  }) : super(key: key);

  @override
  State<AssignmentConfirmedScreen> createState() =>
      _AssignmentConfirmedScreenState();
}

class _AssignmentConfirmedScreenState extends State<AssignmentConfirmedScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _authProvider = Provider.of<AuthProvider>(context, listen: false);
  }

  Future<void> _handlePayment() async {
    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final user = _authProvider.user;
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Prepare booking data with payment
      final service =
          widget.service ??
          (widget.worker.services.isNotEmpty
              ? widget.worker.services[0]
              : null);

      final bookingData = {
        'userId': user.id,
        'workerId': widget.worker.id,
        'serviceId': service?.id,
        'startTime': widget.startTime.toIso8601String(),
        'endTime': widget.endTime.toIso8601String(),
        'assignmentId': widget.assignmentData['assignmentId'],
        'type': 'on_demand',
      };

      // Create confirmed booking with assignment reference
      final response = await _apiService.post('bookings', bookingData);

      if (response != null) {
        final booking = Booking.fromJson(response);

        // Navigate to payment confirmation screen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => BookingConfirmationScreen(booking: booking),
          ),
        );
      } else {
        throw Exception('Failed to create booking');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final service =
        widget.service ??
        (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);

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
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Success icon and message
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.check_circle,
                      color: Color(0xFF2E7D32),
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Professional assigned',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your service has been scheduled and is ready for confirmation.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Assignment card
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
                      'Assigned professional',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'A verified SEVAQ professional has been assigned to your service.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Service details
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
                      'Service Details',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today,
                          color: Colors.black54,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                DateFormat(
                                  'EEEE, MMMM d, yyyy',
                                ).format(widget.startTime),
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                              Text(
                                '${DateFormat('jm').format(widget.startTime)} – ${DateFormat('jm').format(widget.endTime)}',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.work, color: Colors.black54, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            service?.name ?? 'Service',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.attach_money,
                          color: Colors.black54,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '₹${widget.amount.toStringAsFixed(0)}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Payment prompt
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
                      'Confirm to proceed',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Payment confirms your booking. We’ll take care of everything else.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Payment CTA
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
                      child: ElevatedButton(
                        onPressed: _isProcessing ? null : _handlePayment,
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
                        child: _isProcessing
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Confirm & pay'),
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
}
