import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/booking.dart';

class BookingDetailsScreen extends StatelessWidget {
  final Booking booking;

  const BookingDetailsScreen({Key? key, required this.booking})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Booking Details'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),

              // Assigned Professional Card
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
                    const SizedBox(height: 12),

                    // Professional details
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Center(
                            child: Text(
                              booking.worker.user.firstName.isNotEmpty
                                  ? booking.worker.user.firstName[0]
                                  : '?',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2E7D32),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${booking.worker.user.firstName} ${booking.worker.user.lastName}'
                                        .trim()
                                        .isNotEmpty
                                    ? '${booking.worker.user.firstName} ${booking.worker.user.lastName}'
                                    : 'Professional',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.star,
                                    color: Color(0xFFFFB300),
                                    size: 14,
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    '${booking.worker.rating.toStringAsFixed(1)} (${booking.worker.reviewCount} reviews)',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),
                    Text(
                      'If needed, SEVAQ may assign another verified professional to ensure timely service.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Service Details
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
                                ).format(booking.startTime),
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                              Text(
                                '${DateFormat('jm').format(booking.startTime)} - ${DateFormat('jm').format(booking.endTime)}',
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
                        Text(
                          booking.service.name,
                          style: theme.textTheme.bodyMedium,
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
                          '₹${booking.amount?.toStringAsFixed(0) ?? (booking.service.basePrice * booking.endTime.difference(booking.startTime).inHours).toStringAsFixed(0)}',
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

              const SizedBox(height: 24),

              // Assurance Block (System Trust)
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
                      'Covered by SEVAQ service guarantee.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'We’ll handle coordination, changes, and support.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
