import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/booking.dart';

class BookingProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Booking> _bookings = [];
  bool _isLoading = false;

  List<Booking> get bookings => _bookings;
  bool get isLoading => _isLoading;

  Future<void> fetchBookings() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiService.get('bookings');
      if (response != null) {
        _bookings = (response as List).map((i) => Booking.fromJson(i)).toList();
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
        final index = _bookings.indexWhere((b) => b.id == bookingId);
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
