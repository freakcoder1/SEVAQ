import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/booking.dart';
import '../models/subscription.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

/// Helper function to handle TokenExpiredException
Future<void> _handleTokenExpired(BuildContext context) async {
  final authProvider = Provider.of<AuthProvider>(context, listen: false);
  await authProvider.handleTokenExpired();
}

class BookingProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Booking> _bookings = [];
  List<Subscription> _subscriptions = [];
  bool _isLoading = false;
  bool _isFetching = false;

  List<Booking> get bookings => _bookings;
  List<Subscription> get subscriptions => _subscriptions;
  bool get isLoading => _isLoading;

  // Filter bookings by type
  List<Booking> get subscriptionBookings =>
      _bookings.where((b) => b.isSubscription).toList();

  List<Booking> get oneTimeBookings =>
      _bookings.where((b) => b.isOneTime).toList();

  List<Booking> get scheduledBookings =>
      _bookings.where((b) => b.isScheduled).toList();

  // Get count by booking type
  int get subscriptionBookingsCount => subscriptionBookings.length;
  int get oneTimeBookingsCount => oneTimeBookings.length;
  int get scheduledBookingsCount => scheduledBookings.length;

  // Get active subscriptions count
  int get activeSubscriptionsCount =>
      _subscriptions.where((s) => s.isActive).length;

  Booking? get upcomingBooking {
    final now = DateTime.now();
    final confirmedOrRequestedBookings = _bookings
        .where(
          (b) =>
              b.status == BookingStatus.confirmed ||
              b.status == BookingStatus.assignmentInProgress ||
              b.status == BookingStatus.scheduled ||
              b.status == BookingStatus.inProgress,
        )
        .toList();
    final upcomingBookings = confirmedOrRequestedBookings
        .where((b) => b.startTime.isAfter(now))
        .toList();

    if (upcomingBookings.isEmpty) {
      return null;
    }

    // Sort by start time ascending to get the next upcoming booking
    upcomingBookings.sort((a, b) => a.startTime.compareTo(b.startTime));
    return upcomingBookings.first;
  }

  Future<void> fetchBookings({BuildContext? context}) async {
    // Prevent concurrent duplicate requests from multiple widgets
    if (_isFetching) return;

    _isFetching = true;
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiService.getAllBookings();
      if (response != null && response['bookings'] != null) {
        _bookings = (response['bookings'] as List)
            .map((i) => Booking.fromJson(i))
            .toList();
        // Sort by date desc
        _bookings.sort((a, b) => b.startTime.compareTo(a.startTime));
      }
    } on TokenExpiredException {
      debugPrint('BookingProvider: Token expired during fetchBookings');
      if (context != null) {
        await _handleTokenExpired(context);
      }
    } catch (e) {
      debugPrint('Error fetching bookings: $e');
    } finally {
      _isLoading = false;
      _isFetching = false;
      notifyListeners();
    }
  }

  /// Fetch both bookings and subscriptions in parallel
  Future<void> fetchBookingsAndSubscriptions({
    required BuildContext context,
  }) async {
    // Prevent concurrent duplicate requests from multiple widgets
    if (_isFetching) return;

    _isFetching = true;
    _isLoading = true;
    notifyListeners();

    try {
      // Get userId from auth provider
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userId = authProvider.currentUser?.publicId ?? '';

      // Fetch both in parallel
      final bookingsFuture = _apiService.getAllBookings();
      final subscriptionsFuture = _apiService.getUserSubscriptions(userId);

      final bookingsResponse = await bookingsFuture;
      final subscriptionsResponse = await subscriptionsFuture;

      // Process bookings
      if (bookingsResponse != null && bookingsResponse['bookings'] != null) {
        _bookings = (bookingsResponse['bookings'] as List)
            .map((i) => Booking.fromJson(i))
            .toList();
        _bookings.sort((a, b) => b.startTime.compareTo(a.startTime));
      }

      // Process subscriptions
      if (subscriptionsResponse != null) {
        debugPrint(
          'BookingProvider: Subscriptions response: $subscriptionsResponse',
        );
        _subscriptions = (subscriptionsResponse as List)
            .map((s) => Subscription.fromJson(s))
            .toList();
        _subscriptions.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        debugPrint(
          'BookingProvider: Loaded ${_subscriptions.length} subscriptions',
        );
      } else {
        debugPrint('BookingProvider: No subscriptions data in response');
      }
    } on TokenExpiredException {
      debugPrint(
        'BookingProvider: Token expired during fetchBookingsAndSubscriptions',
      );
      await _handleTokenExpired(context);
    } catch (e) {
      debugPrint('Error fetching data: $e');
    } finally {
      _isLoading = false;
      _isFetching = false;
      notifyListeners();
    }
  }

  Future<Booking?> createBooking(
    Map<String, dynamic> bookingData, {
    BuildContext? context,
  }) async {
    try {
      final response = await _apiService.post('bookings', bookingData);
      if (response != null) {
        final booking = Booking.fromJson(response);
        _bookings.add(booking);
        notifyListeners();
        return booking;
      }
    } on TokenExpiredException {
      debugPrint('BookingProvider: Token expired during createBooking');
      if (context != null) {
        await _handleTokenExpired(context);
      }
    } catch (e) {
      debugPrint('Error creating booking: $e');
    }
    return null;
  }

  Future<bool> cancelBooking(String bookingId, {BuildContext? context}) async {
    try {
      final response = await _apiService.patch(
        'bookings/$bookingId/cancel',
        {},
      );
      if (response != null) {
        final index = _bookings.indexWhere((b) => b.publicId == bookingId);
        if (index != -1) {
          _bookings[index] = Booking.fromJson(response);
          notifyListeners();
          return true;
        }
      }
    } on TokenExpiredException {
      debugPrint('BookingProvider: Token expired during cancelBooking');
      if (context != null) {
        await _handleTokenExpired(context);
      }
    } catch (e) {
      debugPrint('Error cancelling booking: $e');
    }
    return false;
  }

  /// Get user's active booking for home screen display
  /// Returns the most recent in-progress or assigned booking (subscription or one-time)
  Future<Map<String, dynamic>?> getActiveBooking({
    BuildContext? context,
  }) async {
    try {
      // First, try to use existing bookings data (already loaded)
      // Find active subscription bookings (confirmed, scheduled, inProgress)
      final activeBookings = _bookings.where((b) {
        final now = DateTime.now();
        return (b.status == BookingStatus.confirmed ||
                b.status == BookingStatus.scheduled ||
                b.status == BookingStatus.inProgress ||
                b.assignmentState == BookingAssignmentState.assigned ||
                b.assignmentState == BookingAssignmentState.confirmed ||
                b.assignmentState == BookingAssignmentState.enRoute ||
                b.assignmentState == BookingAssignmentState.arrived ||
                b.assignmentState == BookingAssignmentState.inProgress) &&
            b.startTime.isAfter(now.subtract(const Duration(hours: 2)));
      }).toList();

      if (activeBookings.isNotEmpty) {
        // Sort by start time to get the most recent
        activeBookings.sort((a, b) => a.startTime.compareTo(b.startTime));
        final booking = activeBookings.first;

        // Calculate ETA based on assignment state
        String eta = '24 mins';
        if (booking.assignmentState == BookingAssignmentState.enRoute) {
          eta = '15 mins';
        } else if (booking.assignmentState == BookingAssignmentState.arrived) {
          eta = 'Arrived';
        } else if (booking.assignmentState ==
            BookingAssignmentState.inProgress) {
          eta = 'In progress';
        }

        return {
          'operationTitle': booking.serviceName,
          'assignedTo': booking.worker.user.firstName.isNotEmpty
              ? '${booking.worker.user.firstName} ${booking.worker.user.lastName}'
                    .trim()
              : 'Worker',
          'eta': eta,
          'status':
              booking.assignmentState?.toString().split('.').last ?? 'ASSIGNED',
        };
      }

      // Check for active subscriptions (for recurring services)
      final activeSubscriptions = _subscriptions
          .where((s) => s.isActive)
          .toList();
      if (activeSubscriptions.isNotEmpty) {
        // Get the most recent active subscription
        activeSubscriptions.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        final subscription = activeSubscriptions.first;

        // Determine worker name from subscription
        String workerName = 'Worker';
        if (subscription.workerName != null &&
            subscription.workerName!.isNotEmpty) {
          workerName = subscription.workerName!;
        }

        return {
          'operationTitle': subscription.serviceName,
          'assignedTo': workerName,
          'eta': 'Next visit scheduled',
          'status': 'ACTIVE',
        };
      }

      // Fallback: try service-requests endpoint if no bookings found
      final response = await _apiService.get('service-requests/active');
      if (response != null) {
        return {
          'operationTitle': response['operationTitle'] ?? 'Service',
          'assignedTo': response['assignedTo'] ?? 'Worker',
          'eta': response['eta'] ?? '24 mins',
          'status': response['status'] ?? 'ASSIGNED',
        };
      }
    } on TokenExpiredException {
      debugPrint('BookingProvider: Token expired during getActiveBooking');
      if (context != null) {
        await _handleTokenExpired(context);
      }
    } catch (e) {
      debugPrint('Error getting active booking: $e');
    }
    return null;
  }
}
