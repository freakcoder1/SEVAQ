import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/worker.dart';

class WorkerProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Worker> _workers = [];
  bool _isLoading = false;
  String? _errorMessage;

  // ── NEW: Live intelligence data ──
  int _nearbyCount = 0;
  int _avgResponseTime = 14;
  bool _isStatsLoading = false;

  List<Worker> get workers => _workers;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // NEW getters
  int get nearbyCount => _nearbyCount;
  int get avgResponseTime => _avgResponseTime;
  bool get isStatsLoading => _isStatsLoading;

  WorkerProvider();

  Future<void> fetchWorkers() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('workers');
      if (response != null) {
        _workers = (response as List).map((i) => Worker.fromJson(i)).toList();
        notifyListeners();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchWorkersByService(String serviceId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('workers/service/$serviceId');
      if (response != null) {
        _workers = (response as List).map((i) => Worker.fromJson(i)).toList();
        notifyListeners();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── NEW: Fetch live nearby count + stats ──
  Future<void> fetchWorkerStats(double lat, double lng) async {
    _isStatsLoading = true;
    notifyListeners();

    try {
      final countResponse = await _apiService.getNearbyWorkersCount(lat, lng);
      if (countResponse != null) {
        _nearbyCount = (countResponse['count'] as num?)?.toInt() ?? 0;
      }

      final statsResponse = await _apiService.getWorkerStats();
      if (statsResponse != null) {
        _avgResponseTime = (statsResponse['avgResponseTime'] as num?)?.toInt() ?? 14;
      }
    } catch (e) {
      debugPrint('WorkerProvider.fetchWorkerStats error: $e');
    } finally {
      _isStatsLoading = false;
      notifyListeners();
    }
  }

  void clearWorkers() {
    _workers = [];
    notifyListeners();
  }
}
