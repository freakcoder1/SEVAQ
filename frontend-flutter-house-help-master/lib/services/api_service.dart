import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';

class ApiService {
  static String get baseUrl {
    return AppConfig.apiBaseUrl;
  }

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    String? token = await _storage.read(key: 'jwt_token');
    debugPrint('ApiService: _getHeaders - token exists: ${token != null}');
    if (token != null) {
      debugPrint('ApiService: _getHeaders - token length: ${token.length}');
      debugPrint(
        'ApiService: _getHeaders - token starts with: ${token.substring(0, math.min(20, token.length))}...',
      );
    } else {
      debugPrint('ApiService: _getHeaders - NO TOKEN FOUND in secure storage');
    }
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final url = '$baseUrl/$endpoint';
      debugPrint('ApiService: POST request to $url');
      final response = await http
          .post(
            Uri.parse(url),
            headers: await _getHeaders(),
            body: jsonEncode(data),
          )
          .timeout(AppConfig.requestTimeout);
      return _processResponse(response);
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
      final response = await http
          .get(Uri.parse('$baseUrl/$endpoint'), headers: await _getHeaders())
          .timeout(AppConfig.requestTimeout);
      return _processResponse(response);
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
      final response = await http
          .patch(
            Uri.parse('$baseUrl/$endpoint'),
            headers: await _getHeaders(),
            body: jsonEncode(data),
          )
          .timeout(AppConfig.requestTimeout);
      return _processResponse(response);
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
      final response = await http
          .delete(Uri.parse('$baseUrl/$endpoint'), headers: await _getHeaders())
          .timeout(AppConfig.requestTimeout);
      return _processResponse(response);
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

  dynamic _processResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
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
    required String serviceId,
    required DateTime scheduledDate,
    required String timeWindow,
    required double priceSnapshot,
  }) async {
    return await post('service-requests', {
      'serviceId': serviceId,
      'date': scheduledDate.toIso8601String(),
      'timeWindow': timeWindow,
      'priceSnapshot': priceSnapshot,
    });
  }

  Future<dynamic> getServiceRequestStatus(String requestId) async {
    return await get('service-requests/$requestId');
  }
}
