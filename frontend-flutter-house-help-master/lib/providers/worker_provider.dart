import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/worker.dart';

class WorkerProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Worker> _workers = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Worker> get workers => _workers;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  WorkerProvider();

  Future<void> fetchWorkers() async {
    print('🔍 DEBUG: WorkerProvider.fetchWorkers() called');
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      print('📡 DEBUG: Making API call to /workers');
      final response = await _apiService.get('workers');
      print('📡 DEBUG: API response received: $response');

      if (response != null) {
        print('✅ DEBUG: Processing ${response.length} workers from response');
        _workers = (response as List).map((i) => Worker.fromJson(i)).toList();
        print('✅ DEBUG: Successfully parsed ${_workers.length} workers');
        notifyListeners();
      } else {
        print('❌ DEBUG: No response received from API');
      }
    } catch (e) {
      print('❌ DEBUG: Error fetching workers: $e');
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
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
      _isLoading = false;
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearWorkers() {
    _workers = [];
    notifyListeners();
  }
}
