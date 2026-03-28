import 'package:flutter/foundation.dart';
import '../models/booking.dart';
import '../services/api_service.dart';

class BookingProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Booking> _bookings = [];
  Booking? _selectedBooking;
  bool _isLoading = false;
  String? _error;

  List<Booking> get bookings => _bookings;
  Booking? get selectedBooking => _selectedBooking;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<Booking> get pendingBookings =>
      _bookings.where((b) => b.isPending).toList();
  List<Booking> get inProgressBookings =>
      _bookings.where((b) => b.isInProgress || b.isConfirmed).toList();
  List<Booking> get completedBookings =>
      _bookings.where((b) => b.isCompleted).toList();

  Future<void> fetchBookings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('workers/me/bookings');
      if (response != null && response['bookings'] != null) {
        _bookings = (response['bookings'] as List)
            .map((b) => Booking.fromJson(b))
            .toList();
      } else if (response is List) {
        _bookings = response.map((b) => Booking.fromJson(b)).toList();
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Error fetching bookings: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> acceptBooking(String bookingId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.post('workers/bookings/$bookingId/accept', {});
      await fetchBookings();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> rejectBooking(String bookingId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.post('workers/bookings/$bookingId/reject', {});
      await fetchBookings();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> startBooking(String bookingId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.post('workers/bookings/$bookingId/start', {});
      await fetchBookings();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> completeBooking(String bookingId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.post('workers/bookings/$bookingId/complete', {});
      await fetchBookings();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void selectBooking(Booking booking) {
    _selectedBooking = booking;
    notifyListeners();
  }

  void clearSelection() {
    _selectedBooking = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
