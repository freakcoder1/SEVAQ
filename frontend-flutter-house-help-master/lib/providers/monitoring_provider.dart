import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/system_metrics.dart';
import '../models/database_metrics.dart';
import '../models/alert.dart';

class MonitoringProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  SystemMetrics? _systemMetrics;
  DatabaseMetrics? _databaseMetrics;
  List<Alert> _alerts = [];
  bool _isLoading = false;

  SystemMetrics? get systemMetrics => _systemMetrics;
  DatabaseMetrics? get databaseMetrics => _databaseMetrics;
  List<Alert> get alerts => _alerts;
  bool get isLoading => _isLoading;

  Future<void> fetchMonitoringData() async {
    _isLoading = true;
    notifyListeners();
    try {
      await Future.wait([
        _fetchSystemMetrics(),
        _fetchDatabaseMetrics(),
        _fetchAlerts(),
      ]);
    } catch (e) {
      debugPrint('Error fetching monitoring data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _fetchSystemMetrics() async {
    try {
      final response = await _apiService.get('metrics/system');
      if (response != null) {
        _systemMetrics = SystemMetrics.fromJson(response);
      }
    } catch (e) {
      debugPrint('Error fetching system metrics: $e');
    }
  }

  Future<void> _fetchDatabaseMetrics() async {
    try {
      final response = await _apiService.get('database-monitoring/metrics');
      if (response != null) {
        _databaseMetrics = DatabaseMetrics.fromJson(response);
      }
    } catch (e) {
      debugPrint('Error fetching database metrics: $e');
    }
  }

  Future<void> _fetchAlerts() async {
    try {
      final response = await _apiService.get('alerts');
      if (response != null) {
        _alerts = (response as List).map((i) => Alert.fromJson(i)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching alerts: $e');
    }
  }
}
