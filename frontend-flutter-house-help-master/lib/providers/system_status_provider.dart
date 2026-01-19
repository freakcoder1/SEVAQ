import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class SystemHealth {
  final double serviceAvailability;
  final double workerAvailability;
  final int averageResponseTime;
  final bool isHealthy;
  final String lastUpdated;

  SystemHealth({
    required this.serviceAvailability,
    required this.workerAvailability,
    required this.averageResponseTime,
    required this.isHealthy,
    required this.lastUpdated,
  });

  factory SystemHealth.fromJson(Map<String, dynamic> json) {
    return SystemHealth(
      serviceAvailability: json['serviceAvailability']?.toDouble() ?? 100.0,
      workerAvailability: json['workerAvailability']?.toDouble() ?? 100.0,
      averageResponseTime: json['averageResponseTime'] ?? 0,
      isHealthy: json['isHealthy'] ?? true,
      lastUpdated: json['lastUpdated'] ?? DateTime.now().toIso8601String(),
    );
  }
}

class SystemStatusProvider with ChangeNotifier {
  SystemHealth? _systemHealth;
  bool _isLoading = false;
  String? _error;

  SystemHealth? get systemHealth => _systemHealth;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isHealthy => _systemHealth?.isHealthy ?? true;

  Future<void> fetchSystemStatus() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/locations/availability'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _systemHealth = SystemHealth.fromJson(data);
      } else {
        _error = 'Failed to fetch system status';
      }
    } catch (e) {
      _error = 'Network error: ${e.toString()}';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Initialize and start polling
  void initialize() {
    fetchSystemStatus();
    // Poll every 30 seconds
    Future.doWhile(() async {
      await Future.delayed(Duration(seconds: 30));
      await fetchSystemStatus();
      return true; // Continue polling
    });
  }
}
