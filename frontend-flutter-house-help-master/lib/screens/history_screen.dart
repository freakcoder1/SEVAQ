import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/booking_provider.dart';
import '../providers/auth_provider.dart';
import '../models/booking.dart';
import '../models/subscription.dart';
import '../widgets/pre_service_reminder_banner.dart';
import '../widgets/subscription_reminder_banner.dart';
import '../widgets/booking_type_badge.dart';
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
      Provider.of<BookingProvider>(
        context,
        listen: false,
      ).fetchBookingsAndSubscriptions(context: context);
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
          Builder(
            builder: (context) => PreServiceReminderBanner(
              authProvider: Provider.of<AuthProvider>(context, listen: false),
              bookingProvider: Provider.of<BookingProvider>(
                context,
                listen: false,
              ),
            ),
          ),
          SubscriptionReminderBanner(),
          Expanded(
            child: Consumer<BookingProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) {
                  return Center(child: CircularProgressIndicator());
                }

                // Check if there are subscriptions to show
                final hasSubscriptions = provider.subscriptions.isNotEmpty;
                final hasBookings = provider.bookings.isNotEmpty;

                if (!hasSubscriptions && !hasBookings) {
                  return Center(child: Text('No services found.'));
                }

                // Build the combined list
                return ListView(
                  padding: EdgeInsets.all(16),
                  children: [
                    // Subscriptions Section
                    if (hasSubscriptions) ...[
                      _buildSubscriptionsSection(provider.subscriptions),
                      SizedBox(height: 24),
                      Divider(),
                      SizedBox(height: 8),
                    ],

                    // Bookings Section
                    if (hasBookings) ...[
                      _buildBookingsSection(provider.bookings),
                    ] else ...[
                      // No bookings but show a message
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          'Your upcoming bookings will appear here once they are scheduled.',
                          style: TextStyle(color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubscriptionsSection(List<Subscription> subscriptions) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          children: [
            Icon(Icons.autorenew, color: Colors.purple[700], size: 24),
            SizedBox(width: 8),
            Text(
              'My Subscriptions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.purple[800],
              ),
            ),
            Spacer(),
            Chip(
              label: Text('${subscriptions.length} active'),
              backgroundColor: Colors.purple[100],
              labelStyle: TextStyle(color: Colors.purple[800], fontSize: 12),
            ),
          ],
        ),
        SizedBox(height: 12),
        ...subscriptions.map(
          (subscription) => _buildSubscriptionCard(subscription),
        ),
      ],
    );
  }

  Widget _buildSubscriptionCard(Subscription subscription) {
    return GestureDetector(
      onTap: () {
        _navigateToSubscriptionDetails(subscription);
      },
      child: Card(
        elevation: 2,
        margin: EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.purple[100]!, width: 1),
        ),
        color: Colors.purple[50],
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Service Name and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      subscription.serviceName,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: Colors.purple[900],
                      ),
                    ),
                  ),
                  Chip(
                    label: Text(subscription.statusDisplay),
                    backgroundColor: subscription.isActive
                        ? Colors.green[100]
                        : Colors.grey[200],
                    labelStyle: TextStyle(
                      color: subscription.isActive
                          ? Colors.green[800]
                          : Colors.grey[700],
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                  ),
                ],
              ),
              SizedBox(height: 12),
              // Details Row
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    color: Colors.purple[700],
                    size: 16,
                  ),
                  SizedBox(width: 4),
                  Text(
                    'Started ${DateFormat('MMM d, yyyy').format(subscription.startDate)}',
                    style: TextStyle(color: Colors.purple[700], fontSize: 13),
                  ),
                  SizedBox(width: 16),
                  Icon(Icons.access_time, color: Colors.purple[700], size: 16),
                  SizedBox(width: 4),
                  Text(
                    subscription.timeWindowDisplay.split('(').first.trim(),
                    style: TextStyle(color: Colors.purple[700], fontSize: 13),
                  ),
                ],
              ),
              SizedBox(height: 8),
              // Price
              Row(
                children: [
                  Icon(Icons.payments, color: Colors.purple[700], size: 16),
                  SizedBox(width: 4),
                  Text(
                    subscription.priceDisplay,
                    style: TextStyle(
                      color: Colors.purple[800],
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              // Worker Name (if assigned)
              if (subscription.workerName != null)
                Row(
                  children: [
                    Icon(Icons.person, color: Colors.purple[700], size: 16),
                    SizedBox(width: 4),
                    Text(
                      '${subscription.workerName}',
                      style: TextStyle(
                        color: Colors.purple[800],
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              SizedBox(height: 8),
              // Visit Pattern
              Row(
                children: [
                  Icon(Icons.repeat, color: Colors.purple[700], size: 16),
                  SizedBox(width: 4),
                  Text(
                    'Daily visits included',
                    style: TextStyle(color: Colors.purple[600], fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigateToSubscriptionDetails(Subscription subscription) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _buildSubscriptionDetailsSheet(subscription),
    );
  }

  Widget _buildSubscriptionDetailsSheet(Subscription subscription) {
    return Container(
      padding: EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Subscription Details',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.purple[900],
                ),
              ),
              IconButton(
                icon: Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          Divider(height: 20),
          SizedBox(height: 10),
          // Service Info
          _buildDetailRow('Service', subscription.serviceName),
          _buildDetailRow('Status', subscription.status),
          _buildDetailRow(
            'Start Date',
            DateFormat('MMM d, yyyy').format(subscription.startDate),
          ),
          _buildDetailRow('Time Window', subscription.timeWindowDisplay),
          _buildDetailRow('Price', subscription.priceDisplay),
          Divider(height: 20),
          // Worker Info
          if (subscription.workerName != null) ...[
            Text(
              'Assigned Professional',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.purple[100],
                  child: Icon(Icons.person, color: Colors.purple[700]),
                ),
                SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subscription.workerName!,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (subscription.workerPhone != null)
                      Text(
                        subscription.workerPhone!,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                  ],
                ),
              ],
            ),
          ] else ...[
            Text(
              'Professional will be assigned soon',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
          Text(
            value,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingsSection(List<Booking> bookings) {
    // Group bookings by date
    final Map<DateTime, List<Booking>> bookingsByDate = {};
    for (final booking in bookings) {
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          children: [
            Icon(Icons.calendar_month, color: Colors.black54, size: 24),
            SizedBox(width: 8),
            Text(
              'Service History',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        SizedBox(height: 16),
        ...sortedDates.map((date) {
          final dateBookings = bookingsByDate[date]!;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date header
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
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
              ...dateBookings.map((booking) => _buildBookingCard(booking)),
              SizedBox(height: 16),
            ],
          );
        }).toList(),
      ],
    );
  }

  Widget _buildBookingCard(Booking booking) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => BookingDetailsScreen(booking: booking),
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
              color: Colors.black.withAlpha((0.03 * 255).round()),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Service Name and Booking Type Badge Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    booking.service.name,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.black87,
                    ),
                  ),
                ),
                BookingTypeBadge(booking: booking),
              ],
            ),
            SizedBox(height: 12),
            // Date & Time (Secondary)
            Text(
              '${DateFormat('h:mm').format(booking.startTime)}–${DateFormat('h:mm a').format(booking.endTime)}',
              style: TextStyle(fontSize: 14, color: Colors.black54),
            ),
            SizedBox(height: 16),
            // Worker Name (if assigned)
            if (booking.worker.user.firstName.isNotEmpty)
              Row(
                children: [
                  Icon(Icons.person, color: Colors.black54, size: 14),
                  SizedBox(width: 4),
                  Text(
                    '${booking.worker.user.firstName} ${booking.worker.user.lastName}',
                    style: TextStyle(fontSize: 13, color: Colors.black54),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.star, color: Color(0xFFFFB300), size: 12),
                  SizedBox(width: 2),
                  Text(
                    '${booking.worker.rating.toStringAsFixed(1)}',
                    style: TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                ],
              ),
            SizedBox(height: 8),
            // Status Badge & Price (Right-Aligned)
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(
                      booking.status,
                    ).withAlpha((0.05 * 255).round()),
                    borderRadius: BorderRadius.circular(16),
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
                    color: booking.amount == null || booking.amount == 0
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
  }
}
