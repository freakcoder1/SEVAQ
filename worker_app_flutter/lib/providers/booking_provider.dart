import 'dart:async';

import 'package:flutter/foundation.dart';
import '../models/booking.dart';
import '../services/api_service.dart';

class BookingProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Booking> _bookings = [];
  Booking? _selectedBooking;
  bool _isLoading = false;
  String? _error;
  Timer? _pollingTimer;
  int _lastBookingsCount = 0;

  static const Duration pollingInterval = Duration(seconds: 30);

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

  /// Start auto-polling for new bookings
  void startPolling() {
    stopPolling(); // Cancel any existing timer
    debugPrint(
        'BookingProvider: Starting polling every ${pollingInterval.inSeconds} seconds');
    _pollingTimer = Timer.periodic(pollingInterval, (_) {
      debugPrint('BookingProvider: Polling triggered');
      _fetchBookingsSilent();
    });
  }

  /// Stop auto-polling
  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    debugPrint('BookingProvider: Polling stopped');
  }

  /// Fetch bookings silently without showing loading indicator
  Future<void> _fetchBookingsSilent() async {
    try {
      final response = await _apiService.get('workers/me/bookings');

      if (response == null) {
        return;
      }

      List<Booking> newBookings = [];
      if (response is List) {
        for (int i = 0; i < response.length; i++) {
          try {
            final bookingJson = response[i] as Map<String, dynamic>;
            final booking = Booking.fromJson(bookingJson);
            newBookings.add(booking);
          } catch (e) {
            debugPrint('Error parsing booking at index $i: $e');
          }
        }
      } else if (response is Map<String, dynamic> &&
          response['bookings'] != null) {
        newBookings = (response['bookings'] as List)
            .map((b) => Booking.fromJson(b as Map<String, dynamic>))
            .toList();
      }

      // Check for new bookings
      if (newBookings.length > _lastBookingsCount && _lastBookingsCount > 0) {
        debugPrint(
            'BookingProvider: NEW BOOKINGS DETECTED! ${newBookings.length - _lastBookingsCount} new booking(s)');
        // TODO: Play sound or show notification for new bookings
      }
      _lastBookingsCount = newBookings.length;
      _bookings = newBookings;
      notifyListeners();
    } catch (e) {
      debugPrint('BookingProvider: Silent fetch error: $e');
    }
  }

  Future<void> fetchBookings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('workers/me/bookings');
      debugPrint('Bookings response: $response');

      // Handle different response formats
      if (response == null) {
        debugPrint('No bookings response (null)');
        _bookings = [];
      } else if (response is List) {
        debugPrint('Response is a List with ${response.length} items');
        _bookings = [];
        for (int i = 0; i < response.length; i++) {
          try {
            final bookingJson = response[i] as Map<String, dynamic>;
            final booking = Booking.fromJson(bookingJson);
            _bookings.add(booking);
            debugPrint(
                'Parsed booking $i: ${booking.id} - ${booking.serviceName} - ${booking.status}');
          } catch (e, stackTrace) {
            debugPrint('Error parsing booking at index $i: $e');
            debugPrint('Booking keys: ${(response[i] as Map).keys.toList()}');
          }
        }
        debugPrint('Total parsed bookings: ${_bookings.length}');
      } else if (response is Map<String, dynamic>) {
        // Response is a map - check for 'bookings' key
        if (response['bookings'] != null) {
          debugPrint('Response has bookings key');
          _bookings = (response['bookings'] as List)
              .map((b) => Booking.fromJson(b as Map<String, dynamic>))
              .toList();
        } else {
          debugPrint('Response is a Map but no bookings key: ${response.keys}');
          // Empty response or other format
          _bookings = [];
        }
      } else {
        debugPrint('Unexpected response type: ${response.runtimeType}');
        _bookings = [];
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

  Future<bool> rejectBooking(String bookingId, {String? reason}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.post('workers/bookings/$bookingId/reject', {
        if (reason != null) 'reason': reason,
      });
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

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
