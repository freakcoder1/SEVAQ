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
import 'dart:async';
import 'package:flutter/material.dart';
import '../models/worker.dart';
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
  Timer? _refreshTimer;
  bool _isFetching = false;

  @override
  void initState() {
    super.initState();
    // Defer fetching to after the widget tree is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchBookings();
      // ✅ FIX: Increase refresh interval to 5 minutes (300 seconds)
      // Prevent infinite polling loop and server overload
      _refreshTimer = Timer.periodic(const Duration(seconds: 300), (timer) {
        if (mounted) {
          _fetchBookings();
        }
      });
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchBookings() async {
    // Prevent concurrent duplicate requests
    if (_isFetching || !mounted) return;

    try {
      _isFetching = true;

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
    } finally {
      if (mounted) {
        _isFetching = false;
      }
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
          // DEBUG: Log all bookings for debugging
          debugPrint('=== PreServiceReminderBanner DEBUG ===');
          debugPrint('All bookings count: ${bookingProvider.bookings.length}');
          debugPrint(
            'Bookings: ${bookingProvider.bookings.map((b) => 'ID:${b.id} status:${b.status} start:${b.startTime}').join(', ')}',
          );

          final upcomingBooking = bookingProvider.upcomingBooking;
          debugPrint(
            'Upcoming booking: ${upcomingBooking?.id}, status: ${upcomingBooking?.status}, startTime: ${upcomingBooking?.startTime}',
          );

          if (upcomingBooking == null) {
            debugPrint(
              'PreServiceReminderBanner: No upcoming booking available - checking why...',
            );
            // Check if there are bookings at all
            if (bookingProvider.bookings.isEmpty) {
              debugPrint('DEBUG: No bookings found in provider at all!');
            } else {
              // Check booking statuses
              for (var b in bookingProvider.bookings) {
                debugPrint(
                  'DEBUG: Booking ${b.id} - status: ${b.status}, startTime: ${b.startTime}, isAfterNow: ${b.startTime.isAfter(DateTime.now())}',
                );
              }
            }
            return const SizedBox.shrink();
          }

          final now = DateTime.now();
          final bookingDateTime = upcomingBooking.startTime;

          // Calculate time difference
          final timeUntilBooking = bookingDateTime.difference(now);
          debugPrint(
            'DEBUG: Time until booking: ${timeUntilBooking.inMinutes} minutes (${timeUntilBooking.inHours} hours)',
          );

          // Determine if reminder should be shown (T-24h, T-2h, or T-30 minutes)
          if (timeUntilBooking.inHours >= 23 &&
              timeUntilBooking.inHours <= 25) {
            debugPrint('DEBUG: Showing tomorrow reminder');
            return _buildBanner(
              context,
              'Your SEVAQ service is scheduled for tomorrow at ${_formatTime(bookingDateTime)}. We’ll take care of everything.',
            );
          } else if (timeUntilBooking.inHours >= 1 &&
              timeUntilBooking.inHours <= 3) {
            debugPrint('DEBUG: Showing starting soon reminder');
            return _buildBanner(
              context,
              _buildWorkerMessage(
                bookingDateTime,
                upcomingBooking.worker,
                'soon',
              ),
            );
          } else if (timeUntilBooking.inMinutes >= 20 &&
              timeUntilBooking.inMinutes <= 40) {
            debugPrint('DEBUG: Showing immediate reminder');
            return _buildBanner(
              context,
              _buildWorkerMessage(
                bookingDateTime,
                upcomingBooking.worker,
                'immediate',
              ),
            );
          }

          debugPrint(
            'DEBUG: Booking exists but NOT in display time window. Time until: ${timeUntilBooking.inMinutes} min',
          );
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
        padding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 12,
        ), // Increased 2px for better balance
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

  /// Builds a message that includes worker details for the reminder banner
  String _buildWorkerMessage(
    DateTime bookingDateTime,
    Worker worker,
    String reminderType,
  ) {
    // Get worker name from user object
    final workerName = worker.user.firstName.isNotEmpty
        ? worker.user.firstName
        : (worker.user.lastName.isNotEmpty
              ? worker.user.lastName
              : 'Your professional');

    // Get worker rating if available
    final rating = worker.rating > 0
        ? '⭐${worker.rating.toStringAsFixed(1)}'
        : '';

    // Build message based on reminder type
    switch (reminderType) {
      case 'tomorrow':
        return 'Your SEVAQ service is scheduled for tomorrow at ${_formatTime(bookingDateTime)}'
            '${rating.isNotEmpty ? ' with $workerName ($rating)' : ' with $workerName'}.'
            ' We\'ll take care of everything.';
      case 'soon':
        return 'Your SEVAQ service starts at ${_formatTime(bookingDateTime)}'
            '${rating.isNotEmpty ? ' with $workerName ($rating)' : ' with $workerName'}.'
            ' Everything is on track.';
      case 'immediate':
        return 'Your SEVAQ service is starting soon at ${_formatTime(bookingDateTime)}'
            '${rating.isNotEmpty ? ' with $workerName ($rating)' : ' with $workerName'}.'
            ' We\'re preparing for your service.';
      default:
        return 'Your SEVAQ service is scheduled at ${_formatTime(bookingDateTime)}.'
            ' We\'ll take care of everything.';
    }
  }
}
