import 'package:flutter/material.dart';
import '../models/booking.dart';

/// Booking Type Badge Widget
/// Displays a colored badge showing whether a booking is:
/// - Monthly Subscription (Purple)
/// - One-Time Service (Green)
/// - Scheduled Service (Blue)
class BookingTypeBadge extends StatelessWidget {
  final Booking booking;
  final double fontSize;
  final EdgeInsets padding;

  const BookingTypeBadge({
    Key? key,
    required this.booking,
    this.fontSize = 12,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (booking.bookingType == null) {
      return const SizedBox.shrink();
    }

    final (color, backgroundColor, icon) = _getBadgeStyle(booking.bookingType!);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: fontSize * 0.9, color: color),
          const SizedBox(width: 4),
          Text(
            booking.bookingTypeLabel,
            style: TextStyle(
              color: color,
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  (Color color, Color backgroundColor, IconData icon) _getBadgeStyle(
    BookingType type,
  ) {
    switch (type) {
      case BookingType.subscription:
        return (Colors.purple[700]!, Colors.purple[50]!, Icons.autorenew);
      case BookingType.onDemand:
        return (Colors.green[700]!, Colors.green[50]!, Icons.flash_on);
      case BookingType.scheduled:
        return (Colors.blue[700]!, Colors.blue[50]!, Icons.calendar_today);
    }
  }
}

/// Compact booking type badge for use in list items
class CompactBookingTypeBadge extends StatelessWidget {
  final Booking booking;

  const CompactBookingTypeBadge({Key? key, required this.booking})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (booking.bookingType == null) {
      return const SizedBox.shrink();
    }

    final color = _getColor(booking.bookingType!);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        booking.bookingTypeLabel,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Color _getColor(BookingType type) {
    switch (type) {
      case BookingType.subscription:
        return Colors.purple[700]!;
      case BookingType.onDemand:
        return Colors.green[700]!;
      case BookingType.scheduled:
        return Colors.blue[700]!;
    }
  }
}
