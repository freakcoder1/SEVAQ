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
