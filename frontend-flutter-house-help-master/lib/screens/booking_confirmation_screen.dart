import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/booking.dart';

class BookingConfirmationScreen extends StatelessWidget {
  final Booking booking;

  const BookingConfirmationScreen({Key? key, required this.booking})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Booking Confirmed'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 100),
            SizedBox(height: 24),
            Text(
              'Booking Confirmed!',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 16),
            Text(
              'Your booking has been successfully confirmed.',
              style: theme.textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 40),
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha((0.05 * 255).round()),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.calendar_today),
                    title: Text(
                      DateFormat(
                        'EEEE, MMMM d, yyyy',
                      ).format(booking.startTime),
                    ),
                    subtitle: Text(
                      '${DateFormat('jm').format(booking.startTime)} - ${DateFormat('jm').format(booking.endTime)}',
                    ),
                  ),
                  Divider(),
                  ListTile(
                    leading: CircleAvatar(child: Icon(Icons.person)),
                    title: Text(
                      '${booking.worker.user.firstName} ${booking.worker.user.lastName}',
                    ),
                    subtitle: Text(booking.service.name),
                  ),
                  Divider(),
                  ListTile(
                    leading: Icon(Icons.attach_money),
                    title: Text('Total Paid'),
                    trailing: Text(
                      '₹${(booking.service.basePrice * booking.startTime.difference(booking.endTime).inHours).toStringAsFixed(0)}',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 40),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              child: Text('Back to Home'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 40, vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
