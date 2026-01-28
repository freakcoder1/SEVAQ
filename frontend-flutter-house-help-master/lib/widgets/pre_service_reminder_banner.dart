/// WARNING: DO NOT MODIFY THIS FILE WITHOUT ARCHITECTURAL APPROVAL
///
/// This widget implements the Pre-Service Reminder screen, which is critical
/// for building and maintaining user trust in SEVAQ's managed service model.
///
/// Trust Principles:
/// - Visibility without control
/// - Reassurance focused
/// - No user actions or controls
/// - Timely reminders with SEVAQ responsibility emphasized
///
/// Changes to this widget must comply with these principles and require
/// architectural review.
import 'package:flutter/material.dart';
import '../providers/booking_provider.dart';
import '../screens/history_screen.dart';
import '../providers/auth_provider.dart';
import '../providers/provider_manager.dart';
import 'package:provider/provider.dart';

class PreServiceReminderBanner extends StatefulWidget {
  final AuthProvider? authProvider;
  final BookingProvider? bookingProvider;

  const PreServiceReminderBanner({
    super.key,
    this.authProvider,
    this.bookingProvider,
  });

  @override
  State<PreServiceReminderBanner> createState() =>
      _PreServiceReminderBannerState();
}

class _PreServiceReminderBannerState extends State<PreServiceReminderBanner> {
  @override
  void initState() {
    super.initState();
    // Defer fetching to after the widget tree is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchBookings();
    });
  }

  Future<void> _fetchBookings() async {
    try {
      // Try to get providers from parameters first, then from context
      BookingProvider? resolvedBookingProvider = widget.bookingProvider;

      if (resolvedBookingProvider == null) {
        try {
          resolvedBookingProvider = Provider.of<BookingProvider>(
            context,
            listen: false,
          );
        } catch (e) {
          debugPrint('Failed to get BookingProvider: $e');
          return;
        }
      }

      debugPrint('PreServiceReminderBanner: Fetching bookings');
      await resolvedBookingProvider.fetchBookings();
    } catch (e) {
      debugPrint('Error fetching bookings in PreServiceReminderBanner: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    try {
      // Try to get providers from parameters first, then from context
      AuthProvider? resolvedAuthProvider = widget.authProvider;
      BookingProvider? resolvedBookingProvider = widget.bookingProvider;

      if (resolvedAuthProvider == null) {
        try {
          resolvedAuthProvider = Provider.of<AuthProvider>(
            context,
            listen: false,
          );
        } catch (e) {
          debugPrint('Failed to get AuthProvider: $e');
          return const SizedBox.shrink();
        }
      }

      if (resolvedBookingProvider == null) {
        try {
          resolvedBookingProvider = Provider.of<BookingProvider>(
            context,
            listen: false,
          );
        } catch (e) {
          debugPrint('Failed to get BookingProvider: $e');
          return const SizedBox.shrink();
        }
      }

      if (resolvedAuthProvider == null ||
          !resolvedAuthProvider.isFullyAuthenticated) {
        debugPrint(
          'PreServiceReminderBanner: AuthProvider not available or user not authenticated',
        );
        return const SizedBox.shrink();
      }

      if (resolvedBookingProvider == null) {
        debugPrint('PreServiceReminderBanner: BookingProvider not available');
        return const SizedBox.shrink();
      }

      // Listen for changes in bookings
      return Consumer<BookingProvider>(
        builder: (context, bookingProvider, child) {
          final upcomingBooking = bookingProvider.upcomingBooking;

          if (upcomingBooking == null) {
            debugPrint(
              'PreServiceReminderBanner: No upcoming booking available',
            );
            return const SizedBox.shrink();
          }

          final now = DateTime.now();
          final bookingDateTime = upcomingBooking.startTime;

          // Calculate time difference
          final timeUntilBooking = bookingDateTime.difference(now);

          // Determine if reminder should be shown (T-24h, T-2h, or T-30 minutes)
          if (timeUntilBooking.inHours >= 23 &&
              timeUntilBooking.inHours <= 25) {
            return _buildBanner(
              context,
              'Your SEVAQ service is scheduled for tomorrow at ${_formatTime(bookingDateTime)}. We’ll take care of everything.',
            );
          } else if (timeUntilBooking.inHours >= 1 &&
              timeUntilBooking.inHours <= 3) {
            return _buildBanner(
              context,
              'Your SEVAQ service starts at ${_formatTime(bookingDateTime)}. Everything is on track.',
            );
          } else if (timeUntilBooking.inMinutes >= 20 &&
              timeUntilBooking.inMinutes <= 40) {
            return _buildBanner(
              context,
              'Your SEVAQ service is starting soon at ${_formatTime(bookingDateTime)}. We\'re preparing for your service.',
            );
          }

          return const SizedBox.shrink();
        },
      );
    } catch (e) {
      debugPrint('Error in PreServiceReminderBanner: $e');
      return const SizedBox.shrink();
    }
  }

  Widget _buildBanner(BuildContext context, String message) {
    return GestureDetector(
      onTap: () {
        // Navigate to History screen (which shows upcoming bookings)
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HistoryScreen()),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Theme.of(context).colorScheme.outline,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.notifications_none,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour;
    final minute = time.minute;
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;
    final displayMinute = minute.toString().padLeft(2, '0');
    return '$displayHour:$displayMinute $period';
  }
}
