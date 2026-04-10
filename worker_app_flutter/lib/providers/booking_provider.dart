import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import '../models/booking.dart';
import '../services/api_service.dart';

class BookingProvider extends ChangeNotifier with WidgetsBindingObserver {
  final ApiService _apiService = ApiService();

  List<Booking> _bookings = [];
  Booking? _selectedBooking;
  bool _isLoading = false;
  String? _error;
  Timer? _pollingTimer;
  int _lastBookingsCount = 0;
  bool _isAppInBackground = false;

  /// Polling interval - reduced to 15 seconds for faster response
  static const Duration pollingInterval = Duration(seconds: 15);

  List<Booking> get bookings => _bookings;
  Booking? get selectedBooking => _selectedBooking;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<Booking> get pendingBookings {
    final list = _bookings.where((b) => b.isPending).toList();
    list.sort((a, b) {
      if (a.createdAt == null && b.createdAt == null) return 0;
      if (a.createdAt == null) return 1;
      if (b.createdAt == null) return -1;
      return b.createdAt!.compareTo(a.createdAt!);
    });
    return list;
  }

  List<Booking> get newBookings {
    final list = _bookings.where((b) => b.isNewBooking).toList();
    list.sort((a, b) {
      if (a.createdAt == null && b.createdAt == null) return 0;
      if (a.createdAt == null) return 1;
      if (b.createdAt == null) return -1;
      return b.createdAt!.compareTo(a.createdAt!);
    });
    return list;
  }

  List<Booking> get inProgressBookings {
    final list =
        _bookings.where((b) => b.isInProgress || b.isConfirmed).toList();
    list.sort((a, b) {
      if (a.createdAt == null && b.createdAt == null) return 0;
      if (a.createdAt == null) return 1;
      if (b.createdAt == null) return -1;
      return b.createdAt!.compareTo(a.createdAt!);
    });
    return list;
  }

  List<Booking> get completedBookings {
    final list = _bookings.where((b) => b.isCompleted).toList();
    list.sort((a, b) {
      if (a.createdAt == null && b.createdAt == null) return 0;
      if (a.createdAt == null) return 1;
      if (b.createdAt == null) return -1;
      return b.createdAt!.compareTo(a.createdAt!);
    });
    return list;
  }

  List<Booking> get acceptedOngoingBookings {
    // First filter status
    final filtered =
        _bookings.where((b) => b.isConfirmed || b.isInProgress).toList();

    // Remove duplicates by booking ID
    final seenIds = <String>{};
    final distinctList = <Booking>[];

    for (final booking in filtered) {
      if (!seenIds.contains(booking.id)) {
        seenIds.add(booking.id);
        distinctList.add(booking);
      }
    }

    // Sort newest first (most recent bookings at top)
    distinctList.sort((a, b) {
      if (a.createdAt == null && b.createdAt == null) return 0;
      if (a.createdAt == null) return 1;
      if (b.createdAt == null) return -1;
      return b.createdAt!.compareTo(a.createdAt!);
    });

    return distinctList;
  }

  /// Fetch only accepted ongoing bookings (CONFIRMED + IN_PROGRESS)
  Future<void> fetchAcceptedBookings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('workers/me/accepted-bookings');

      if (response == null) {
        _bookings = [];
      } else if (response is List) {
        _bookings = [];
        for (int i = 0; i < response.length; i++) {
          try {
            final bookingJson = response[i] as Map<String, dynamic>;
            final booking = Booking.fromJson(bookingJson);
            _bookings.add(booking);
          } catch (e) {
            debugPrint('Error parsing booking at index $i: $e');
          }
        }
      } else if (response is Map<String, dynamic> &&
          response['bookings'] != null) {
        _bookings = (response['bookings'] as List)
            .map((b) => Booking.fromJson(b as Map<String, dynamic>))
            .toList();
      } else {
        _bookings = [];
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Error fetching accepted bookings: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Start auto-polling for new bookings
  void startPolling() {
    stopPolling(); // Cancel any existing timer
    _isAppInBackground = false;
    debugPrint(
        'BookingProvider: Starting polling every ${pollingInterval.inSeconds} seconds');
    _pollingTimer = Timer.periodic(pollingInterval, (_) {
      if (_isAppInBackground) {
        debugPrint('BookingProvider: Skipping poll - app is in background');
        return;
      }
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

  /// Handle app lifecycle changes to pause/resume polling
  void handleAppLifecycleChanged(AppLifecycleState state) {
    debugPrint('BookingProvider: Lifecycle changed to $state');
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.hidden) {
      _isAppInBackground = true;
      debugPrint('BookingProvider: App in background - polling will be paused');
    } else if (state == AppLifecycleState.resumed) {
      _isAppInBackground = false;
      debugPrint('BookingProvider: App resumed - polling will continue');
      // Immediately fetch to catch up on any missed updates
      _fetchBookingsSilent();
    }
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

      // Sort bookings by creation date descending (newest first)
      newBookings.sort((a, b) {
        if (a.createdAt == null && b.createdAt == null) return 0;
        if (a.createdAt == null) return 1;
        if (b.createdAt == null) return -1;
        return b.createdAt!.compareTo(a.createdAt!);
      });

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

        // Sort bookings by creation date descending (newest first)
        _bookings.sort((a, b) {
          if (a.createdAt == null && b.createdAt == null) return 0;
          if (a.createdAt == null) return 1;
          if (b.createdAt == null) return -1;
          return b.createdAt!.compareTo(a.createdAt!);
        });
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

  /// Fetch a specific booking by ID
  Future<Booking?> fetchBookingById(String bookingId) async {
    await fetchBookings();
    try {
      return _bookings.firstWhere((b) => b.id == bookingId);
    } catch (e) {
      debugPrint('Booking not found with ID: $bookingId');
      return null;
    }
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
