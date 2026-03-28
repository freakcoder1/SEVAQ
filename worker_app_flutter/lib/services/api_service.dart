import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    String? token = await _storage.read(key: 'worker_jwt_token');

    if (token == null) {
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
      final url = '$baseUrl/$endpoint';
      final headers = await _getHeaders();
      debugPrint('ApiService: GET request to $url');
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(AppConfig.requestTimeout);
      return _processResponse(response);
    } catch (e) {
      debugPrint('GET Error to $endpoint: $e');
      if (e is SocketException) {
        throw Exception('Network error: Please check your internet connection');
      } else if (e is TimeoutException) {
        throw Exception('Request timeout: Please try again');
      } else {
        throw Exception('Request failed: $e');
      }
    }
  }

  Future<dynamic> patch(String endpoint, Map<String, dynamic> data) async {
    try {
      final url = '$baseUrl/$endpoint';
      debugPrint('ApiService: PATCH request to $url');
      final response = await http
          .patch(
            Uri.parse(url),
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
      } else {
        throw Exception('Request failed: $e');
      }
    }
  }

  dynamic _processResponse(http.Response response) {
    debugPrint('ApiService: Response status: ${response.statusCode}');
    debugPrint('ApiService: Response body: ${response.body}');

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return {'success': true};
      }
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      throw TokenExpiredException('Session expired. Please log in again.');
    } else {
      String message = 'Request failed';
      try {
        final body = jsonDecode(response.body);
        message = body['message'] ?? body['error'] ?? message;
      } catch (_) {}
      throw Exception('Error ${response.statusCode}: $message');
    }
  }

  // Token management
  Future<void> saveToken(String token) async {
    await _storage.write(key: 'worker_jwt_token', value: token);
    debugPrint('Token saved to secure storage');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'worker_jwt_token');
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'worker_jwt_token');
    debugPrint('Token cleared from secure storage');
  }

  // Check if logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    if (token == null) return false;

    final tokenData = decodeJwt(token);
    if (tokenData == null) {
      await clearToken();
      return false;
    }

    if (isTokenExpired(tokenData)) {
      await clearToken();
      return false;
    }

    return true;
  }
}
