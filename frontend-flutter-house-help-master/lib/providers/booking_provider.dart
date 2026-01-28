import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/booking.dart';

class BookingProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Booking> _bookings = [];
  bool _isLoading = false;

  List<Booking> get bookings => _bookings;
  bool get isLoading => _isLoading;

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
      final response = await _apiService.getUpcomingBookings();
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
