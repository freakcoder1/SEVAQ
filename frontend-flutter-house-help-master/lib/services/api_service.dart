import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

/// Exception thrown when JWT token has expired
class TokenExpiredException implements Exception {
  final String message;
  TokenExpiredException(this.message);
  @override
  String toString() => 'TokenExpiredException: $message';
}

// Helper function to decode JWT token
Map<String, dynamic>? decodeJwt(String token) {
  try {
    final parts = token.split('.');
    if (parts.length != 3) return null;
    var payload = parts[1];

    // Fix padding for base64 URL decoding
    while (payload.length % 4 != 0) {
      payload += '=';
    }

    final decoded = base64Url.decode(payload);
    final json = utf8.decode(decoded);
    return jsonDecode(json);
  } catch (e) {
    debugPrint('Error decoding token: $e');
    return null;
  }
}

// Helper function to check if token is expired
bool isTokenExpired(Map<String, dynamic> tokenData) {
  if (!tokenData.containsKey('exp')) return true;
  final exp = tokenData['exp'] as int;
  final currentTime = DateTime.now().millisecondsSinceEpoch / 1000;
  return currentTime > exp;
}

class ApiService {
  static String get baseUrl {
    return AppConfig.apiBaseUrl;
  }

  /// Normalize endpoint path to prevent double /api prefix collision
  /// Automatically strips leading /api prefix if present to prevent /api/api paths
  static String normalizeEndpoint(String endpoint) {
    if (endpoint.startsWith('/api/')) {
      debugPrint(
        '⚠️ ApiService: Fixing double /api prefix for endpoint: $endpoint',
      );
      endpoint = endpoint.substring(5);
    } else if (endpoint.startsWith('api/')) {
      endpoint = endpoint.substring(4);
    }
    // Remove leading slash if present to avoid double slashes
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    return endpoint;
  }

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    String? token = await _storage.read(key: 'jwt_token');
    debugPrint(
      'ApiService: _getHeaders - token exists in secure storage: ${token != null}',
    );

    // Fallback to SharedPreferences if token not found in secure storage
    if (token == null) {
      debugPrint('ApiService: _getHeaders - Trying SharedPreferences fallback');
      final prefs = await SharedPreferences.getInstance();
      token = prefs.getString('jwt_token');
      debugPrint(
        'ApiService: _getHeaders - token exists in SharedPreferences: ${token != null}',
      );
    }

    if (token != null) {
      debugPrint('ApiService: _getHeaders - token length: ${token.length}');
      if (kDebugMode && token.length > 20) {
        debugPrint(
          'ApiService: _getHeaders - token starts with: ${token.substring(0, 20)}...',
        );
      }

      // Check token expiry (PRODUCTION-READY: Expired tokens are now cleared)
      final tokenData = decodeJwt(token);
      if (tokenData != null) {
        if (isTokenExpired(tokenData)) {
          debugPrint(
            'ApiService: _getHeaders - Token has expired, clearing token',
          );
          // Clear expired token from all storage locations
          await clearToken();
          await _storage.delete(key: 'user_id');
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('jwt_token');
          await prefs.remove('user_id');
          await prefs.remove('refresh_token');
          token = null;
          // Notify that token has expired - app should redirect to login
          throw TokenExpiredException('Session expired. Please log in again.');
        }
      } else {
        debugPrint('ApiService: _getHeaders - Invalid token');
        await clearToken();
        await _storage.delete(key: 'user_id');
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('jwt_token');
        await prefs.remove('user_id');
        await prefs.remove('refresh_token');
        token = null;
      }
    } else {
      debugPrint('ApiService: _getHeaders - NO TOKEN FOUND in any storage');
    }
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final normalizedEndpoint = normalizeEndpoint(endpoint);
      final url = '$baseUrl/$normalizedEndpoint';
      debugPrint('ApiService: POST request to $url');
      final response = await http
          .post(
            Uri.parse(url),
            headers: await _getHeaders(),
            body: jsonEncode(data),
          )
          .timeout(AppConfig.requestTimeout);
      return await _processResponse(response);
    } catch (e) {
      debugPrint('POST Error to $endpoint: $e');
      debugPrint('POST Error details: baseUrl=$baseUrl, endpoint=$endpoint');
      if (e is SocketException) {
        throw Exception('Network error: Please check your internet connection');
      } else if (e is TimeoutException) {
        throw Exception('Request timeout: Please try again');
      } else if (e is FormatException) {
        throw Exception('Invalid response format from server');
      } else {
        throw Exception('Request failed: $e');
      }
    }
  }

  Future<dynamic> get(String endpoint) async {
    try {
      final normalizedEndpoint = normalizeEndpoint(endpoint);
      final url = '$baseUrl/$normalizedEndpoint';
      final headers = await _getHeaders();
      debugPrint('ApiService: GET request to $url');
      debugPrint('ApiService: GET headers: $headers');
      final stopwatch = Stopwatch()..start();
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(AppConfig.requestTimeout);
      stopwatch.stop();
      debugPrint(
        'ApiService: GET response received in ${stopwatch.elapsedMilliseconds}ms for $url',
      );
      return await _processResponse(response);
    } catch (e) {
      debugPrint('GET Error to $endpoint: $e');
      if (e is SocketException) {
        throw Exception('Network error: Please check your internet connection');
      } else if (e is TimeoutException) {
        throw Exception('Request timeout: Please try again');
      } else if (e is FormatException) {
        throw Exception('Invalid response format from server');
      } else {
        throw Exception('Request failed: $e');
      }
    }
  }

  Future<dynamic> patch(String endpoint, Map<String, dynamic> data) async {
    try {
      final normalizedEndpoint = normalizeEndpoint(endpoint);
      final response = await http
          .patch(
            Uri.parse('$baseUrl/$normalizedEndpoint'),
            headers: await _getHeaders(),
            body: jsonEncode(data),
          )
          .timeout(AppConfig.requestTimeout);
      return await _processResponse(response);
    } catch (e) {
      debugPrint('PATCH Error to $endpoint: $e');
      if (e is SocketException) {
        throw Exception('Network error: Please check your internet connection');
      } else if (e is TimeoutException) {
        throw Exception('Request timeout: Please try again');
      } else if (e is FormatException) {
        throw Exception('Invalid response format from server');
      } else {
        throw Exception('Request failed: $e');
      }
    }
  }

  Future<dynamic> delete(String endpoint) async {
    try {
      final normalizedEndpoint = normalizeEndpoint(endpoint);
      final response = await http
          .delete(
            Uri.parse('$baseUrl/$normalizedEndpoint'),
            headers: await _getHeaders(),
          )
          .timeout(AppConfig.requestTimeout);
      return await _processResponse(response);
    } catch (e) {
      debugPrint('DELETE Error to $endpoint: $e');
      if (e is SocketException) {
        throw Exception('Network error: Please check your internet connection');
      } else if (e is TimeoutException) {
        throw Exception('Request timeout: Please try again');
      } else if (e is FormatException) {
        throw Exception('Invalid response format from server');
      } else {
        throw Exception('Request failed: $e');
      }
    }
  }

  Future<dynamic> _processResponse(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      // Handle 401 Unauthorized - token expired or invalid
      debugPrint(
        'ApiService: 401 Unauthorized received - token is expired or invalid',
      );
      // Clear token from all storage locations
      await clearToken();
      await _storage.delete(key: 'user_id');
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('jwt_token');
      await prefs.remove('user_id');
      await prefs.remove('refresh_token');
      // Throw exception to trigger redirect to login
      throw TokenExpiredException('Session expired. Please log in again.');
    } else if (response.statusCode == 400) {
      // Handle 400 status as business state, not error
      // Return the response data for business logic to handle
      try {
        final data = jsonDecode(response.body);
        return {
          'status': 'business_error',
          'statusCode': 400,
          'data': data,
          'message': data['message'] ?? 'Business validation failed',
        };
      } catch (e) {
        // If JSON parsing fails, return basic error structure
        return {
          'status': 'business_error',
          'statusCode': 400,
          'data': null,
          'message': 'Business validation failed',
        };
      }
    } else {
      throw Exception('Error ${response.statusCode}: ${response.body}');
    }
  }

  // Health check method to test server connectivity
  Future<bool> checkServerHealth() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/health'), headers: await _getHeaders())
          .timeout(AppConfig.requestTimeout);

      if (response.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      debugPrint('Health check failed: $e');
      return false;
    }
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'jwt_token');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  Future<void> saveUserId(String userId) async {
    await _storage.write(key: 'user_id', value: userId);
  }

  Future<void> clearUserId() async {
    await _storage.delete(key: 'user_id');
  }
}

// Location-based API methods
extension LocationApi on ApiService {
  Future<dynamic> checkServiceAvailability(
    double lat,
    double lng,
    double radius,
  ) async {
    return await get('locations/availability?lat=$lat&lng=$lng&radius=$radius');
  }

  Future<dynamic> getAvailableServices(
    double lat,
    double lng,
    double radius,
  ) async {
    return await get('locations/services?lat=$lat&lng=$lng&radius=$radius');
  }

  Future<dynamic> getNearbyZones(
    double lat,
    double lng, [
    double maxRadius = 2,
  ]) async {
    return await get(
      'locations/zones/nearby?lat=$lat&lng=$lng&maxRadius=$maxRadius',
    );
  }

  Future<dynamic> getServiceAreas(double lat, double lng) async {
    return await get('locations/areas?lat=$lat&lng=$lng');
  }

  Future<dynamic> addToWaitlist(
    double lat,
    double lng,
    int estimatedWaitTime,
  ) async {
    final token = await getToken();
    if (token == null) {
      throw Exception('User not authenticated');
    }

    // Get user ID from token or storage
    final userId = await _storage.read(key: 'user_id');
    if (userId == null) {
      throw Exception('User ID not found');
    }

    return await post('locations/waitlist', {
      'userId': userId,
      'serviceId': 'all', // For general waitlist
      'lat': lat,
      'lng': lng,
      'estimatedWaitTime': estimatedWaitTime,
    });
  }

  Future<dynamic> removeFromWaitlist() async {
    // This would need to be implemented based on your waitlist management
    return await delete('locations/waitlist/current');
  }

  Future<dynamic> updatePreferredLocation(
    String userId,
    double lat,
    double lng,
  ) async {
    return await post('locations/user/$userId/location', {
      'lat': lat,
      'lng': lng,
    });
  }

  Future<dynamic> updateWorkerLocation(
    String workerId,
    double lat,
    double lng,
  ) async {
    return await post('locations/worker/$workerId/location', {
      'lat': lat,
      'lng': lng,
    });
  }

  Future<dynamic> getWaitlistStatus(String userId) async {
    return await get('locations/waitlist/status/$userId');
  }
}

// Service Request API methods
extension ServiceRequestApi on ApiService {
  Future<dynamic> createServiceRequest({
    required int serviceId,
    required DateTime scheduledDate,
    required String timeWindow,
    required double priceSnapshot,
    String source = 'ONE_TIME',
  }) async {
    return await post('service-requests', {
      'serviceId': serviceId,
      'date': scheduledDate.toIso8601String(),
      'timeWindow': timeWindow,
      'priceSnapshot': priceSnapshot,
      'source': source,
    });
  }

  Future<dynamic> getServiceRequestStatus(String requestId) async {
    return await get('service-requests/$requestId');
  }

  Future<dynamic> assignServiceRequest(String requestId) async {
    return await post('service-requests/$requestId/assign', {});
  }

  Future<dynamic> getServiceRequestAssignments() async {
    return await get('service-requests/assignments');
  }
}

// Address API methods
extension AddressApi on ApiService {
  Future<dynamic> saveAddress(Map<String, dynamic> addressData) async {
    return await post('addresses', addressData);
  }

  Future<dynamic> getAddresses() async {
    return await get('addresses');
  }

  Future<dynamic> getDefaultAddress() async {
    return await get('addresses/default');
  }

  Future<dynamic> updateAddress(
    int addressId,
    Map<String, dynamic> addressData,
  ) async {
    return await patch('addresses/$addressId', addressData);
  }

  Future<dynamic> deleteAddress(String addressId) async {
    return await delete('addresses/$addressId');
  }

  Future<dynamic> setDefaultAddress(String addressId) async {
    return await patch('addresses/$addressId/set-default', {});
  }
}

// Booking API methods
extension BookingApi on ApiService {
  Future<dynamic> createBookingFromServiceRequest({
    required String serviceRequestId,
  }) async {
    return await post('bookings', {'serviceRequestId': serviceRequestId});
  }

  Future<dynamic> getBookingById(int bookingId) async {
    return await get('bookings/$bookingId');
  }

  Future<dynamic> getBookingsByUserId(String userId) async {
    return await get('bookings?userId=$userId');
  }

  Future<dynamic> getUpcomingBookings() async {
    return await get('notifications/upcoming-bookings');
  }

  Future<dynamic> getAllBookings() async {
    return await get('notifications/all-bookings');
  }
}

// Service Profile API methods
extension ServiceProfileApi on ApiService {
  Future<dynamic> getServiceProfiles(String serviceType) async {
    // Map frontend service types to backend enum values
    String mappedType;
    switch (serviceType.toLowerCase()) {
      case 'cooking':
        mappedType = 'COOK';
        break;
      case 'maid':
      case 'house help':
        mappedType = 'MAID';
        break;
      case 'cleaning':
        mappedType = 'CLEANING';
        break;
      default:
        mappedType = serviceType.toUpperCase();
    }
    debugPrint('🔍 DEBUG: Mapping service type $serviceType to $mappedType');
    final response = await get('service-profiles?serviceType=$mappedType');
    debugPrint('🔍 DEBUG: Service profiles response: ${response.toString()}');
    debugPrint('🔍 DEBUG: Response type: ${response.runtimeType}');
    // Extract data from backend response format { success: true, data: [] }
    if (response is Map) {
      debugPrint('🔍 DEBUG: Response keys: ${response.keys.toList()}');
      if (response.containsKey('data')) {
        debugPrint(
          '🔍 DEBUG: Data key found, value type: ${response['data'].runtimeType}',
        );
        return response['data'];
      }
    }
    return response;
  }

  Future<dynamic> getServiceProfileById(int profileId) async {
    return await get('service-profiles/$profileId');
  }
}

// Payment API methods
extension PaymentApi on ApiService {
  Future<dynamic> createPaymentOrder({
    required double amount,
    required String currency,
  }) async {
    return await post('payments/create-order', {
      'amount': amount,
      'currency': currency,
    });
  }

  Future<dynamic> createSubscriptionOrder({
    required dynamic userId, // Support both int and String (UUID)
    int? serviceProfileId,
    int? customPrice,
    required String preferredTimeWindow,
    required DateTime startDate,
    required double lat,
    required double lng,
    Map<String, dynamic>? customPlanData,
  }) async {
    final body = {
      'userId': userId,
      'preferredTimeWindow': preferredTimeWindow,
      'startDate': startDate.toIso8601String(),
      'billingCycle': 'MONTHLY',
      'location': {'lat': lat, 'lng': lng},
    };

    if (serviceProfileId != null) {
      body['serviceProfileId'] = serviceProfileId;
    }

    if (customPrice != null) {
      body['customPrice'] = customPrice;
      body['monthlyPriceSnapshot'] = customPrice;
    }

    if (customPlanData != null) {
      body['customPlanData'] = customPlanData;
    }

    return await post('payments/create-subscription-order', body);
  }

  Future<dynamic> createSubscriptionAfterPayment({
    required String paymentId,
    required String orderId,
    required String signature,
    required Map<String, dynamic> subscriptionData,
  }) async {
    final body = {
      'razorpayOrderId': orderId,
      'razorpayPaymentId': paymentId,
      'signature': signature,
      'userId': subscriptionData['userId'],
      'serviceProfileId': subscriptionData['serviceProfileId'],
      'preferredTimeWindow': subscriptionData['preferredTimeWindow'],
      'startDate': subscriptionData['startDate'],
      'location': subscriptionData['location'],
      'monthlyPriceSnapshot': subscriptionData['monthlyPriceSnapshot'],
    };
    // Include customPlanData if present (for custom plans)
    if (subscriptionData.containsKey('customPlanData') &&
        subscriptionData['customPlanData'] != null) {
      body['customPlanData'] = subscriptionData['customPlanData'];
    }
    return await post('payments/confirm-subscription', body);
  }

  Future<dynamic> verifyPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String signature,
    String? fcmToken,
  }) async {
    final data = {
      'razorpayOrderId': razorpayOrderId,
      'razorpayPaymentId': razorpayPaymentId,
      'signature': signature,
    };
    if (fcmToken != null) {
      data['fcmToken'] = fcmToken;
    }
    return await post('payments/verify', data);
  }
}

// Subscription API methods
extension SubscriptionApi on ApiService {
  Future<dynamic> createSubscription({
    required int serviceProfileId,
    required String frequency,
    required String timeWindowStart,
    required String timeWindowEnd,
    required DateTime startDate,
    required DateTime endDate,
    required double lat,
    required double lng,
  }) async {
    return await post('subscriptions', {
      'serviceProfileId': serviceProfileId,
      'frequency': frequency,
      'timeWindowStart': timeWindowStart,
      'timeWindowEnd': timeWindowEnd,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'billingCycle': 'MONTHLY',
      'location': {'lat': lat, 'lng': lng},
    });
  }

  Future<dynamic> getSubscriptions() async {
    return await get('subscriptions');
  }

  Future<dynamic> getUserSubscriptions(String userId) async {
    return await get('subscriptions/user/$userId');
  }

  Future<dynamic> getSubscriptionById(int subscriptionId) async {
    return await get('subscriptions/$subscriptionId');
  }

  Future<dynamic> updateSubscriptionStatus(
    int subscriptionId,
    String status,
  ) async {
    return await patch('subscriptions/$subscriptionId/status', {
      'status': status,
    });
  }

  Future<dynamic> pauseSubscription(int subscriptionId) async {
    return await patch('subscriptions/$subscriptionId/status', {
      'status': 'PAUSED',
    });
  }

  Future<dynamic> resumeSubscription(int subscriptionId) async {
    return await patch('subscriptions/$subscriptionId/status', {
      'status': 'ACTIVE',
    });
  }

  Future<dynamic> cancelSubscription(int subscriptionId) async {
    return await patch('subscriptions/$subscriptionId/status', {
      'status': 'CANCELLED',
    });
  }
}

// Worker API methods for Worker App
extension WorkerApi on ApiService {
  /**
   * Get current worker's profile (from JWT token)
   * GET /workers/me
   */
  Future<dynamic> getMyWorkerProfile() async {
    return await get('workers/me');
  }

  /**
   * Get current worker's bookings
   * GET /workers/me/bookings
   */
  Future<dynamic> getMyWorkerBookings({String? status}) async {
    if (status != null && status.isNotEmpty) {
      return await get('workers/me/bookings?status=$status');
    }
    return await get('workers/me/bookings');
  }

  /**
   * Get current worker's earnings summary
   * GET /workers/me/earnings
   */
  Future<dynamic> getMyWorkerEarnings() async {
    return await get('workers/me/earnings');
  }

  /**
   * Update worker availability
   * PATCH /workers/me/availability
   */
  Future<dynamic> updateMyWorkerAvailability(bool isAvailable) async {
    return await patch('workers/me/availability', {'isAvailable': isAvailable});
  }

  /**
   * Accept a booking
   * POST /workers/bookings/:id/accept
   */
  Future<dynamic> acceptWorkerBooking(String bookingId) async {
    return await post('workers/bookings/$bookingId/accept', {});
  }

  /**
   * Reject a booking
   * POST /workers/bookings/:id/reject
   */
  Future<dynamic> rejectWorkerBooking(
    String bookingId, {
    String? reason,
  }) async {
    return await post('workers/bookings/$bookingId/reject', {
      if (reason != null) 'reason': reason,
    });
  }

  /**
   * Start a job (mark as in progress)
   * POST /workers/bookings/:id/start
   */
  Future<dynamic> startWorkerBooking(String bookingId) async {
    return await post('workers/bookings/$bookingId/start', {});
  }

  /**
   * Complete a job
   * POST /workers/bookings/:id/complete
   */
  Future<dynamic> completeWorkerBooking(String bookingId) async {
    return await post('workers/bookings/$bookingId/complete', {});
  }
}

// Admin API methods for Admin Dashboard
extension AdminApi on ApiService {
  /**
   * Get dashboard statistics
   * GET /admin/dashboard
   */
  Future<dynamic> getAdminDashboard() async {
    return await get('admin/dashboard');
  }

  /**
   * Get all workers with filters
   * GET /admin/workers
   */
  Future<dynamic> getAdminWorkers({
    bool? isAvailable,
    double? minRating,
    String? serviceId,
  }) async {
    final queryParams = <String>[];
    if (isAvailable != null) queryParams.add('isAvailable=$isAvailable');
    if (minRating != null) queryParams.add('minRating=$minRating');
    if (serviceId != null) queryParams.add('serviceId=$serviceId');

    final query = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
    return await get('admin/workers$query');
  }

  /**
   * Get worker by ID
   * GET /admin/workers/:id
   */
  Future<dynamic> getAdminWorkerById(int workerId) async {
    return await get('admin/workers/$workerId');
  }

  /**
   * Update worker details
   * PUT /admin/workers/:id
   */
  Future<dynamic> updateAdminWorker(
    int workerId,
    Map<String, dynamic> updates,
  ) async {
    return await post('admin/workers/$workerId', updates);
  }

  /**
   * Toggle worker availability
   * PATCH /admin/workers/:id/availability
   */
  Future<dynamic> toggleAdminWorkerAvailability(
    int workerId,
    bool isAvailable,
  ) async {
    return await patch('admin/workers/$workerId/availability', {
      'isAvailable': isAvailable,
    });
  }

  /**
   * Get all bookings with filters
   * GET /admin/bookings
   */
  Future<dynamic> getAdminBookings({
    String? status,
    String? startDate,
    String? endDate,
    int? workerId,
    String? userId,
  }) async {
    final queryParams = <String>[];
    if (status != null) queryParams.add('status=$status');
    if (startDate != null) queryParams.add('startDate=$startDate');
    if (endDate != null) queryParams.add('endDate=$endDate');
    if (workerId != null) queryParams.add('workerId=$workerId');
    if (userId != null) queryParams.add('userId=$userId');

    final query = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
    return await get('admin/bookings$query');
  }

  /**
   * Get booking by ID
   * GET /admin/bookings/:id
   */
  Future<dynamic> getAdminBookingById(String bookingId) async {
    return await get('admin/bookings/$bookingId');
  }

  /**
   * Update booking status
   * PATCH /admin/bookings/:id/status
   */
  Future<dynamic> updateAdminBookingStatus(
    String bookingId,
    String status,
  ) async {
    return await patch('admin/bookings/$bookingId/status', {'status': status});
  }

  /**
   * Cancel a booking
   * POST /admin/bookings/:id/cancel
   */
  Future<dynamic> cancelAdminBooking(String bookingId, {String? reason}) async {
    return await post('admin/bookings/$bookingId/cancel', {
      if (reason != null) 'reason': reason,
    });
  }

  /**
   * Get revenue analytics
   * GET /admin/analytics/revenue
   */
  Future<dynamic> getAdminRevenueAnalytics({String? period}) async {
    if (period != null) {
      return await get('admin/analytics/revenue?period=$period');
    }
    return await get('admin/analytics/revenue');
  }

  /**
   * Get booking analytics
   * GET /admin/analytics/bookings
   */
  Future<dynamic> getAdminBookingAnalytics() async {
    return await get('admin/analytics/bookings');
  }

  /**
   * Get all users
   * GET /admin/users
   */
  Future<dynamic> getAdminUsers() async {
    return await get('admin/users');
  }

  /**
   * Get user by ID
   * GET /admin/users/:id
   */
  Future<dynamic> getAdminUserById(String userId) async {
    return await get('admin/users/$userId');
  }
}
