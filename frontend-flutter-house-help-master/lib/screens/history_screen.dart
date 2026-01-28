import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/booking_provider.dart';
import '../models/booking.dart';
import '../widgets/pre_service_reminder_banner.dart';
import 'booking_details_screen.dart';

class HistoryScreen extends StatefulWidget {
  @override
  _HistoryScreenState createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    // Use WidgetsBinding.instance.addPostFrameCallback to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BookingProvider>(context, listen: false).fetchBookings();
    });
  }

  String _getStatusLabel(BookingStatus status) {
    switch (status) {
      case BookingStatus.assignmentInProgress:
        return 'Assignment in progress';
      case BookingStatus.scheduled:
        return 'Scheduled';
      case BookingStatus.confirmed:
        return 'Confirmed';
      case BookingStatus.inProgress:
        return 'In progress';
      case BookingStatus.completed:
        return 'Completed';
      case BookingStatus.cancelled:
        return 'Cancelled';
    }
  }

  Color _getStatusColor(BookingStatus status) {
    switch (status) {
      case BookingStatus.assignmentInProgress:
        return Colors.grey;
      case BookingStatus.scheduled:
      case BookingStatus.confirmed:
        return Color.fromRGBO(76, 175, 80, 0.8); // Muted SEVAQ green
      case BookingStatus.inProgress:
        return Color.fromRGBO(76, 175, 80, 0.6); // Soft neutral green
      case BookingStatus.completed:
        return Color.fromRGBO(76, 175, 80, 0.4); // Soft neutral green
      case BookingStatus.cancelled:
        return Colors.grey;
    }
  }

  String _getPriceLabel(Booking booking) {
    if (booking.amount == null || booking.amount == 0) {
      return 'Price pending';
    }
    if (booking.isPaid) {
      return '₹${booking.amount?.toInt()} paid';
    }
    return 'Estimated ₹${booking.amount?.toInt()}';
  }

  Color _getPriceColor(Booking booking) {
    if (booking.amount == null || booking.amount == 0) {
      return Colors.black38; // Muted gray for "Price pending"
    }
    return Colors.black54; // Regular color for other price labels
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Your services')),
      body: Column(
        children: [
          PreServiceReminderBanner(),
          Expanded(
            child: Consumer<BookingProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) {
                  return Center(child: CircularProgressIndicator());
                }
                if (provider.bookings.isEmpty) {
                  return Center(child: Text('No services found.'));
                }

                // Group bookings by date
                final Map<DateTime, List<Booking>> bookingsByDate = {};
                for (final booking in provider.bookings) {
                  final date = DateTime(
                    booking.startTime.year,
                    booking.startTime.month,
                    booking.startTime.day,
                  );
                  if (!bookingsByDate.containsKey(date)) {
                    bookingsByDate[date] = [];
                  }
                  bookingsByDate[date]!.add(booking);
                }

                // Sort dates in ascending order
                final sortedDates = bookingsByDate.keys.toList()
                  ..sort((a, b) => a.compareTo(b));

                return ListView.separated(
                  padding: EdgeInsets.all(16),
                  itemCount: sortedDates.length,
                  separatorBuilder: (ctx, i) => SizedBox(height: 24),
                  itemBuilder: (context, dateIndex) {
                    final date = sortedDates[dateIndex];
                    final dateBookings = bookingsByDate[date]!;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Date header
                        Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 8,
                          ),
                          child: Text(
                            DateFormat('EEEE, MMM d').format(date),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                        // Bookings for this date
                        ...dateBookings.map((booking) {
                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      BookingDetailsScreen(booking: booking),
                                ),
                              );
                            },
                            child: Container(
                              margin: EdgeInsets.only(bottom: 12),
                              padding: EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(
                                      (0.03 * 255).round(),
                                    ),
                                    blurRadius: 8,
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Service Name (Primary)
                                  Text(
                                    booking.service.name,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  SizedBox(height: 12),
                                  // Date & Time (Secondary)
                                  Text(
                                    '${DateFormat('h:mm').format(booking.startTime)}–${DateFormat('h:mm a').format(booking.endTime)}',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.black54,
                                    ),
                                  ),
                                  SizedBox(height: 16),
                                  // Status Badge & Price (Right-Aligned)
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(
                                            booking.status,
                                          ).withAlpha((0.05 * 255).round()),
                                          borderRadius: BorderRadius.circular(
                                            16,
                                          ),
                                        ),
                                        child: Text(
                                          _getStatusLabel(booking.status),
                                          style: TextStyle(
                                            color: _getStatusColor(
                                              booking.status,
                                            ).withAlpha((0.4 * 255).round()),
                                            fontWeight: FontWeight.w400,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                      SizedBox(width: 12),
                                      Text(
                                        _getPriceLabel(booking),
                                        style: TextStyle(
                                          fontSize: 14,
                                          color:
                                              booking.amount == null ||
                                                  booking.amount == 0
                                              ? Colors.black38
                                              : Colors.black54,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
