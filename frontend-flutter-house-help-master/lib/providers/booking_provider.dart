import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/booking.dart';
import '../models/subscription.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class BookingProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Booking> _bookings = [];
  List<Subscription> _subscriptions = [];
  bool _isLoading = false;

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

  Future<void> fetchBookings() async {
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
    } catch (e) {
      debugPrint('Error fetching bookings: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch both bookings and subscriptions in parallel
  Future<void> fetchBookingsAndSubscriptions({
    required BuildContext context,
  }) async {
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
        _subscriptions = (subscriptionsResponse as List)
            .map((s) => Subscription.fromJson(s))
            .toList();
        _subscriptions.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      }
    } catch (e) {
      debugPrint('Error fetching data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Booking?> createBooking(Map<String, dynamic> bookingData) async {
    try {
      final response = await _apiService.post('bookings', bookingData);
      if (response != null) {
        final booking = Booking.fromJson(response);
        _bookings.add(booking);
        notifyListeners();
        return booking;
      }
    } catch (e) {
      debugPrint('Error creating booking: $e');
    }
    return null;
  }

  Future<bool> cancelBooking(String bookingId) async {
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
    } catch (e) {
      debugPrint('Error cancelling booking: $e');
    }
    return false;
  }
}
