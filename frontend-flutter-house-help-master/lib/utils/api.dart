import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiConfig {
  static String get baseUrl => AppConfig.apiBaseUrl;

  static Future<Map<String, String>> getAuthHeaders() async {
    const FlutterSecureStorage storage = FlutterSecureStorage();
    String? token = await storage.read(key: 'jwt_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
