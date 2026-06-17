import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String _baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000/api');
  
  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiClient() {
    _dio.options.baseUrl = _baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
    _dio.options.headers = {'Content-Type': 'application/json'};
    
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: _onRequest,
      onError: _onError,
    ));
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  void _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    if (error.response?.statusCode == 401) {
      await _clearToken();
    }
    handler.next(error);
  }

  Future<String?> _getToken() async {
    String? token = await _storage.read(key: 'jwt_token');
    if (token == null) {
      final prefs = await SharedPreferences.getInstance();
      token = prefs.getString('jwt_token');
    }
    return token;
  }

  Future<void> _clearToken() async {
    await _storage.delete(key: 'jwt_token');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }

  Future<dynamic> get(String endpoint) async {
    try {
      final response = await _dio.get(_normalizeEndpoint(endpoint));
      return _processResponse(response);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        _normalizeEndpoint(endpoint),
        data: jsonEncode(data),
      );
      return _processResponse(response);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> patch(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await _dio.patch(
        _normalizeEndpoint(endpoint),
        data: jsonEncode(data),
      );
      return _processResponse(response);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> delete(String endpoint) async {
    try {
      final response = await _dio.delete(_normalizeEndpoint(endpoint));
      return _processResponse(response);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _normalizeEndpoint(String endpoint) {
    if (endpoint.startsWith('/api/')) {
      endpoint = endpoint.substring(5);
    } else if (endpoint.startsWith('api/')) {
      endpoint = endpoint.substring(4);
    }
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    return endpoint;
  }

  dynamic _processResponse(Response response) {
    if (response.statusCode! >= 200 && response.statusCode! < 300) {
      if (response.data == null) return null;
      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data.containsKey('data')) {
          return data['data'];
        }
      }
      return response.data;
    }
    throw Exception('Error ${response.statusCode}: ${response.data}');
  }

  Exception _handleError(DioException e) {
    if (e.error != null) {
      return Exception('Network error: Please check your internet connection');
    }
    if (e.type == DioExceptionType.receiveTimeout || e.type == DioExceptionType.sendTimeout) {
      return Exception('Request timeout: Please try again');
    }
    return Exception('Request failed: ${e.message}');
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'jwt_token');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }
}